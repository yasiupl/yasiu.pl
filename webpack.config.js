const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');
const path = require('path');
const { renderProjects } = require('./build/projects');
const { renderTimeline } = require('./build/timeline');
const { renderProfile } = require('./build/profile');
const blog = require('./build/blog');

const PROJECTS_FILE = path.resolve(__dirname, 'src/projects.md');
const TIMELINE_FILE = path.resolve(__dirname, 'src/timeline.md');
const CV_FILE = path.resolve(__dirname, 'src/cv.md');
const BLOG_DIR = path.resolve(__dirname, 'blog');
const HOME_POSTS = 3;
// The image CDN of the hosting platform scales the post images. Local builds use the original files.
const IMAGE_CDN = process.env.VERCEL ? 'vercel' : process.env.NETLIFY === 'true' ? 'netlify' : null;
// The address of the backend with the API routes (see nitro.config.mjs and infra/api/README.md).
// Local builds use the same origin: the development server sends /api/ to "npm run dev:api".
const API_BASE = process.env.API_BASE ?? (process.env.VERCEL || process.env.NETLIFY ? 'https://api.yasiu.pl' : '');

// Posts are read once per build and shared by all blog pages; a (watch) rebuild
// reads them again. The list of pages is fixed when webpack starts: restart it
// after you add or rename a post.
const postsCache = new WeakMap();
function posts(compilation) {
    compilation.contextDependencies.add(BLOG_DIR);
    if (!postsCache.has(compilation)) postsCache.set(compilation, blog.loadPosts(BLOG_DIR, { cdn: IMAGE_CDN }));
    return postsCache.get(compilation);
}

function blogPage(filename, page) {
    return new HtmlWebpackPlugin({
        hash: true,
        template: './src/blog.html',
        filename,
        favicon: './src/favicon.ico',
        templateParameters: (compilation) => {
            const p = page(posts(compilation));
            const e = blog.escape;
            return {
                page: {
                    lang: e(p.lang || 'en'),
                    type: p.type || 'website',
                    title: e(p.title),
                    description: e(p.description),
                    url: e(blog.SITE + p.url),
                    image: e(p.image || blog.SITE + '/assets/meirl.png'),
                    main: p.main
                }
            };
        }
    });
}

// The subtitle of the blog on the home page and on /blog/.
const BLOG_INTRO = 'A collection of my thoughts and texts – some never published before, others first published in various places.';

const blogIndex = blogPage('./blog/index.html', (all) => ({
    title: 'Blog',
    description: BLOG_INTRO,
    url: '/blog/',
    main: `<header class="post-header">
          <h1>Blog</h1>
          <a href="/blog/feed.xml">Atom feed</a>
        </header>
        <p class="section-subtitle">${BLOG_INTRO}</p>
        <div class="row h-feed">
          ${blog.renderCards(all)}
        </div>`
}));

const startPosts = blog.loadPosts(BLOG_DIR, { cdn: IMAGE_CDN });

const postPages = startPosts.map(({ slug }) => blogPage(`./blog/${slug}/index.html`, (all) => {
    const i = all.findIndex((p) => p.slug === slug);
    const p = all[i];
    return {
        lang: p.lang,
        type: 'article',
        title: p.title,
        description: p.summary,
        url: p.url,
        image: p.image && p.image.share,
        main: blog.renderPost(p, all[i - 1], all[i + 1])
    };
}));

// Writes blog/feed.xml next to the pages.
class BlogFeedPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('BlogFeedPlugin', (compilation) => {
            compilation.hooks.processAssets.tap({
                name: 'BlogFeedPlugin',
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, () => {
                compilation.emitAsset('blog/feed.xml', new compiler.webpack.sources.RawSource(blog.renderFeed(posts(compilation))));
            });
        });
    }
}

module.exports = {
    entry: ['./src/app.js', '@materializecss/materialize/dist/css/materialize.min.css', './src/style.css'],
    output: {
        // Nitro serves this folder (see nitro.config.mjs).
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js',
        // Absolute asset URLs: pages live at / and at /blog/<slug>/.
        publicPath: '/',
        clean: true
    },
    devServer: {
        static: path.join(__dirname, 'public'),
        // The API routes come from "npm run dev:api" (Nitro, port 3000).
        proxy: [{ context: ['/api', '/.well-known'], target: 'http://localhost:3000' }],
        compress: true,
        // PORT lets a second copy run next to one on 8080 (for example, the preview of an editor).
        port: Number(process.env.PORT) || 8080,
        // Show only errors in the browser. The known size warnings hide the page.
        client: { overlay: { errors: true, warnings: false } }
    },
    plugins: [
        new DefinePlugin({ API_BASE: JSON.stringify(API_BASE) }),
        new CopyPlugin({
            patterns: [
                { from: "src/static", to: "" },
                // The files of each post (PDFs, images) go next to its page.
                ...startPosts.filter((p) => p.filesDir).map((p) => ({ from: p.filesDir, to: `blog/${p.slug}` })),
            ],
        }),
        new MiniCssExtractPlugin({
            filename: 'style.css'
        }),
        new HtmlWebpackPlugin({
            hash: true,
            title: 'yasiu.pl',
            template: './src/index.html',
            filename: './index.html',
            favicon: './src/favicon.ico',
            // Project cards come from src/projects.md; re-read on every (watch) build.
            templateParameters: (compilation) => {
                compilation.fileDependencies.add(PROJECTS_FILE);
                compilation.fileDependencies.add(TIMELINE_FILE);
                compilation.fileDependencies.add(CV_FILE);
                return {
                    // The profile card: src/cv.md and the current job from src/timeline.md.
                    profile: renderProfile(CV_FILE, TIMELINE_FILE),
                    projects: renderProjects(PROJECTS_FILE),
                    timeline: renderTimeline(TIMELINE_FILE, posts(compilation)),
                    posts: blog.renderCards(posts(compilation).slice(0, HOME_POSTS)),
                    blogIntro: BLOG_INTRO
                };
            }
        }),
        blogIndex,
        ...postPages,
        new BlogFeedPlugin(),
        new WebpackPwaManifest({
            fingerprints: false,
            name: 'yasiu.pl',
            short_name: 'yasiu.pl',
            description: 'yasiu.pl homepage',
            background_color: '#FF4F00',
            theme_color: '#FF4F00',
            start_url: '/?utm_source=a2hs',
            display: 'standalone',
            ios: {
                'apple-mobile-web-app-status-bar-style': 'black'
            },
            icons: [{
                    src: path.resolve('src/static/assets/icon.png'),
                    destination: './icons/',
                    sizes: [96, 128, 192, 256, 384, 512],
                    ios: true
                },
                {
                    src: path.resolve('src/static/assets/icon.png'),
                    destination: './icons/',
                    size: 512,
                    ios: 'startup'
                }
            ]
        }),
        new WorkboxPlugin.GenerateSW({
            // A new deploy takes over at once instead of waiting for all tabs to close.
            skipWaiting: true,
            clientsClaim: true,
            // Do not precache the page itself: it changes on every content edit.
            // Do not precache the blog either: its photos and PDFs are ~140 MB.
            // Runtime caching below still keeps the pages and files a visitor opens.
            exclude: [/\.map$/, /^manifest.*\.js$/, /\.html$/, /^blog\//, /\.pdf$/],
            runtimeCaching: [{
                // The page: network first, cached copy only when offline.
                urlPattern: ({ request }) => request.mode === 'navigate',
                handler: 'NetworkFirst',
            }, {
                urlPattern: /.*/,
                handler: 'StaleWhileRevalidate',
            }]
        })
    ],
    module: {
        rules: [{
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ],
            },
            {
                test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3)$/,
                type: 'asset/resource'
            }
        ]
    }
}
