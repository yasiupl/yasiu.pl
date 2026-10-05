// Turns the posts in blog/*.md into the blog pages at build time.
// Format: see "Blog" in README.md.
const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { imageSize } = require('image-size');
const { transformUrl } = require('unpic');

const SITE = 'https://yasiu.pl';
const FIELDS = ['title', 'date', 'updated', 'ai', 'lang', 'description', 'image', 'crop'];
// The "ai" field: how much of the post an AI wrote. The post header shows it.
const AI = {
  written: { en: 'Written with AI from the author’s materials',pl: 'Tekst napisany przez AI na podstawie materiałów autora' },
  edited: { en: 'Edited with AI', pl: 'Tekst zredagowany z pomocą AI' }
};
const AI_NOTE = ['written'];
const WORDS = { en: { updated: 'Last edited' }, pl: { updated: 'Ostatnia edycja' } };
const words = (lang) => WORDS[lang] || WORDS.en;
const CROPS = ['top', 'center', 'bottom'];
const FILE_NAME = /^(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)\.md$/;

const escape = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// "sizes" of the images: the post text is at most 736 px wide, the header 800 px.
const SIZES = {
  body: '(max-width: 832px) 100vw, 736px',
  header: '(max-width: 832px) 100vw, 800px',
  card: '(max-width: 600px) 100vw, (max-width: 992px) 50vw, 33vw'
};

function img(d, attrs = '') {
  const srcset = d.srcset ? ` srcset="${escape(d.srcset)}" sizes="${d.sizes}"` : '';
  const size = d.width ? ` width="${d.width}" height="${d.height}"` : '';
  const position = d.position ? ` style="object-position: center ${d.position}"` : '';
  return `<img src="${escape(d.src)}"${srcset}${size}${position}${attrs}>`;
}

// Images in the post text: a scaled copy that links to the original file.
// An image that is already in a link keeps that link.
// Images are large and far down the page: load them lazily.
const marked = new Marked({
  renderer: {
    image(t) {
      const title = t.title ? ` title="${escape(t.title)}"` : '';
      const tag = img(t.display || { src: t.href }, ` alt="${escape(t.text)}"${title} loading="lazy" decoding="async"`);
      return t.inLink ? tag : `<a class="post-image" href="${escape(t.href)}">${tag}</a>`;
    }
  }
});

// A relative link or image in a post points to a file in the post folder.
const isRelative = (href) => !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href);
const absolute = (src) => (src.startsWith('/') ? SITE + src : src);

// Width and height of an image file as a browser shows it. EXIF orientation 5 to 8
// turns the image by 90 degrees.
const sizeCache = new Map();
function dimensions(file) {
  const key = `${file}:${fs.statSync(file).mtimeMs}`;
  if (!sizeCache.has(key)) {
    const { width, height, orientation = 1 } = imageSize(fs.readFileSync(file));
    sizeCache.set(key, orientation >= 5
      ? { width: height, height: width, orientation }
      : { width, height, orientation });
  }
  return sizeCache.get(key);
}

// The image CDN of the hosting platform scales the images down (the originals are up to 10 MB)
// and sends WebP or AVIF. "cdn" is the platform: "vercel", "netlify" or null (no CDN, the
// original file). The unpic library makes the CDN URLs.
// Vercel accepts only the widths in IMAGE_WIDTHS (see nitro.config.mjs).
// The CDNs do not document EXIF orientation, so a turned image stays original.
const IMAGE_WIDTHS = [480, 800, 960, 1200, 1600];
const cdnUrl = (cdn, src, width, height, position, format) => transformUrl(
  { url: decodeURI(src), provider: cdn, width, height, format },
  { netlify: position ? { position } : {} });

// The CSS crops the header and card images to 16:9. "position" (top or bottom) selects the
// part of the image that the crop keeps.
function scaled(pic, cdn, widths, sizes, ratio, position, format) {
  const heightOf = (w) => (ratio ? Math.round(w / ratio) : Math.round(w * pic.height / pic.width));
  position = ratio && position !== 'center' ? position : undefined;
  // Never ask for more pixels than the original has.
  const list = widths.filter((w) => w <= pic.width);
  if (!cdn || !list.length || pic.orientation !== 1) {
    return { src: pic.url, width: pic.width, height: pic.width && heightOf(pic.width), position };
  }
  const at = (w) => cdnUrl(cdn, pic.url, w, ratio && heightOf(w), position, format);
  const largest = list[list.length - 1];
  return {
    src: at(largest),
    srcset: list.length > 1 ? list.map((w) => `${at(w)} ${w}w`).join(', ') : '',
    sizes,
    width: largest,
    height: heightOf(largest),
    position
  };
}

function frontMatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`${file}: no front matter (--- ... ---) at the top`);
  const fields = {};
  match[1].split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const field = line.match(/^([a-z]+)\s*:\s*(.*?)\s*$/);
    if (!field) throw new Error(`${file}:${i + 2}: cannot read "${line}"`);
    if (!FIELDS.includes(field[1])) {
      throw new Error(`${file}:${i + 2}: unknown field "${field[1]}" (use ${FIELDS.join(', ')})`);
    }
    fields[field[1]] = field[2].replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
  });
  return { fields, body: source.slice(match[0].length) };
}

// Plain text of inline tokens (links keep their text, images are dropped).
function plainText(tokens) {
  return tokens.map((t) => {
    if (t.type === 'image' || t.type === 'html') return '';
    if (t.tokens) return plainText(t.tokens);
    return t.text || '';
  }).join('');
}

// The summary is the start of the text: paragraphs that are only a link or an image are skipped.
function summary(tokens, max = 220) {
  let text = '';
  for (const t of tokens) {
    if (text.length >= 160) break;
    if (t.type !== 'paragraph') continue;
    if (t.tokens.every((i) => ['link', 'image', 'br', 'space'].includes(i.type) || !(i.text || '').trim())) continue;
    text += (text ? ' ' : '') + plainText(t.tokens).replace(/\s+/g, ' ').trim();
  }
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function firstImage(tokens) {
  let found = null;
  marked.walkTokens(tokens, (t) => { if (!found && t.type === 'image') found = t.pic; });
  return found;
}

function formatDate(date, lang) {
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(date.slice(0, 10)));
}

function loadPosts(dir, { cdn = false } = {}) {
  const posts = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((name) => {
    const file = path.join(dir, name);
    const parts = name.match(FILE_NAME);
    if (!parts) throw new Error(`${file}: name the file YYYY-MM-DD-slug.md (lower case, digits and dashes)`);
    const { fields, body } = frontMatter(fs.readFileSync(file, 'utf8'), file);
    if (!fields.title) throw new Error(`${file}: front matter has no title`);
    const date = fields.date || parts[1];
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) throw new Error(`${file}: date must start with YYYY-MM-DD`);
    const updated = fields.updated || null;
    if (updated && !/^\d{4}-\d{2}-\d{2}/.test(updated)) throw new Error(`${file}: updated must start with YYYY-MM-DD`);
    if (fields.ai && !AI[fields.ai]) throw new Error(`${file}: ai must be ${Object.keys(AI).join(' or ')}`);
    const url = `/blog/${parts[2]}/`;

    // Files of the post: the folder with the same name as the post file.
    const filesDir = file.replace(/\.md$/, '');
    const hasFiles = fs.existsSync(filesDir);
    const localFile = (href) => {
      if (!isRelative(href)) return null;
      const local = path.join(filesDir, decodeURIComponent(href.split(/[?#]/)[0]));
      if (!hasFiles || !fs.existsSync(local)) {
        throw new Error(`${file}: "${href}" not found in ${filesDir}${path.sep}`);
      }
      return local;
    };
    const resolve = (href) => (localFile(href) ? url + href : href);
    // An image of the post: its URL and, for a file in the post folder, its size.
    const picture = (href) => {
      const local = localFile(href);
      return { url: local ? url + href : href, ...(local ? dimensions(local) : {}) };
    };

    const tokens = marked.lexer(body);
    marked.walkTokens(tokens, (t) => {
      if (t.type === 'image') {
        t.pic = picture(t.href);
        t.href = t.pic.url;
      } else if (t.type === 'link') {
        t.href = resolve(t.href);
        for (const child of t.tokens) if (child.type === 'image') child.inLink = true;
      }
    });

    // Header image: the "image" field, else the first image of the post.
    // If the post text shows the same image on its own, the header replaces it.
    const header = fields.image ? picture(fields.image) : firstImage(tokens);
    const crop = fields.crop || 'center';
    if (!CROPS.includes(crop)) throw new Error(`${file}: crop must be ${CROPS.join(', ')}`);
    const same = header ? tokens.findIndex((t) => t.type === 'paragraph' && t.tokens.length === 1 &&
      t.tokens[0].type === 'image' && t.tokens[0].href === header.url) : -1;
    if (same >= 0) tokens.splice(same, 1);
    marked.walkTokens(tokens, (t) => {
      if (t.type === 'image') t.display = scaled(t.pic, cdn, [800, 1600], SIZES.body);
    });

    const lang = fields.lang || 'en';
    return {
      file,
      filesDir: hasFiles ? filesDir : null,
      slug: parts[2],
      url,
      title: fields.title,
      date,
      lang,
      displayDate: formatDate(date, lang),
      // The date of the last edit, shown only when it is not the day of publication.
      updated: updated && updated.slice(0, 10) !== date.slice(0, 10) ? updated : null,
      displayUpdated: updated && updated.slice(0, 10) !== date.slice(0, 10) ? formatDate(updated, lang) : null,
      ai: fields.ai || null,
      // Only posts that an AI wrote get a note; posts that an AI only edited do not.
      aiLabel: AI_NOTE.includes(fields.ai) ? (AI[fields.ai][lang] || AI[fields.ai].en) : null,
      summary: fields.description || summary(tokens),
      image: header && {
        original: header.url,
        header: scaled(header, cdn, [800, 1600], SIZES.header, 16 / 9, crop),
        card: scaled(header, cdn, [480, 960], SIZES.card, 16 / 9, crop),
        // Link previews: JPEG, because not all sites that show previews accept WebP.
        share: absolute(scaled(header, cdn, [1200], '', 1200 / 630, crop, 'jpg').src)
      },
      html: marked.parser(tokens)
    };
  });
  const seen = new Map();
  for (const p of posts) {
    if (seen.has(p.slug)) throw new Error(`${p.file}: same slug "${p.slug}" as ${seen.get(p.slug)}`);
    seen.set(p.slug, p.file);
  }
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function card(p) {
  return `<div class="col s12 m6 l4">
            <a class="card is-link post-card h-entry" href="${p.url}" lang="${escape(p.lang)}">${p.image ? `
              <div class="card-image">
                ${img(p.image.card, ' class="u-featured" alt="" loading="lazy"')}
              </div>` : ''}
              <div class="card-content">
                <time class="eyebrow dt-published" datetime="${escape(p.date)}">${escape(p.displayDate)}</time>
                <span class="card-title p-name">${escape(p.title)}</span>
                <p class="p-summary">${escape(p.summary)}</p>
              </div>
            </a>
          </div>`;
}

function renderCards(posts) {
  return posts.map(card).join('\n          ');
}

function renderPost(p, newer, older) {
  const link = (q, rel, label) => q
    ? `<a class="post-nav-${rel}" href="${q.url}" rel="${rel}"><span class="eyebrow">${label}</span><span lang="${escape(q.lang)}">${escape(q.title)}</span></a>`
    : '<span></span>';
  return `<article class="h-entry" lang="${escape(p.lang)}">
          <header class="post-header">
            <time class="dt-published" datetime="${escape(p.date)}">${escape(p.displayDate)}</time>
            <h1 class="p-name">${escape(p.title)}</h1>
            <a class="u-url" href="${SITE}${p.url}" hidden></a>
            <a class="p-author h-card" href="${SITE}/" hidden>Marcin Jasiukowicz</a>
          </header>
          <div class="card post-body">${p.image ? `
            <div class="card-image">
              <a class="u-featured" href="${escape(p.image.original)}">${img(p.image.header, ' alt="" fetchpriority="high"')}</a>
            </div>` : ''}
            <div class="card-content e-content">
${p.html}
            </div>
          </div>${p.updated || p.aiLabel ? `
          <p class="post-notes">${p.updated ? `${escape(words(p.lang).updated)}: <time class="dt-updated" datetime="${escape(p.updated)}">${escape(p.displayUpdated)}</time>.` : ''}${p.updated && p.aiLabel ? ' ' : ''}${p.aiLabel ? `${escape(p.aiLabel)}.` : ''}</p>` : ''}
        </article>
        <nav class="post-nav" aria-label="More posts">
          ${link(older, 'prev', '← Older')}
          ${link(newer, 'next', 'Newer →')}
        </nav>`;
}

// Feed readers open the feed from another site: all URLs must be absolute.
const absoluteUrls = (html) => html
  .replace(/(href|src)="\/(?!\/)/g, `$1="${SITE}/`)
  .replace(/srcset="([^"]*)"/g, (m, list) => `srcset="${list.replace(/(^|,\s*)\/(?!\/)/g, `$1${SITE}/`)}"`);

function renderFeed(posts) {
  // The feed changes when a post is published or edited: the latest of all dates.
  const updated = new Date(Math.max(0, ...posts.map((p) => new Date(p.updated || p.date).getTime()))).toISOString();
  const entries = posts.map((p) => `  <entry>
    <title>${escape(p.title)}</title>
    <link href="${SITE}${p.url}"/>
    <id>${SITE}${p.url}</id>
    <published>${new Date(p.date).toISOString()}</published>
    <updated>${new Date(p.updated || p.date).toISOString()}</updated>
    <summary>${escape(p.summary)}</summary>
    <content type="html" xml:lang="${escape(p.lang)}">${escape(absoluteUrls(
      (p.image ? `<p>${img(p.image.header, ' alt=""')}</p>
` : '') + p.html))}</content>
  </entry>`).join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>yasiu.pl blog</title>
  <link href="${SITE}/blog/"/>
  <link rel="self" href="${SITE}/blog/feed.xml"/>
  <id>${SITE}/blog/</id>
  <updated>${updated}</updated>
  <author><name>Marcin Jasiukowicz</name><uri>${SITE}</uri></author>
${entries}
</feed>
`;
}

module.exports = { SITE, IMAGE_WIDTHS, loadPosts, renderCards, renderPost, renderFeed, escape };
