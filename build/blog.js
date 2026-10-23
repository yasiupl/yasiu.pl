// Turns the posts in blog/*.md into the blog pages at build time.
// Format: see "Blog" in README.md.
const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { imageSize } = require('image-size');
const { transformUrl } = require('unpic');

const SITE = 'https://yasiu.pl';
const FIELDS = ['title', 'date', 'updated', 'ai', 'lang', 'description', 'image', 'crop', 'index', 'video'];
// The "ai" field: how much of the post an AI wrote. The post header shows it.
const AI = {
  written: { en: 'Written with AI from the author’s materials',pl: 'Tekst napisany przez AI na podstawie materiałów autora' },
  edited: { en: 'Edited with AI', pl: 'Tekst zredagowany z pomocą AI' }
};
const AI_NOTE = ['written'];
const WORDS = {
  en: {
    updated: 'Last edited',
    // The forms of Intl.PluralRules: the script that writes the number selects one.
    views: { one: 'view', other: 'views' },
    comments: 'Comments',
    empty: 'No comments yet. Be the first!',
    howTo: 'Comment from Mastodon or another fediverse app:',
    steps: [
      'Copy the address of this post:',
      'Paste it into the search of your app and open the post.',
      'Reply, like or boost. Your comment shows here in a minute.'
    ],
    follow: 'To get new posts, follow',
    email: 'Or write to me:',
    webmention: 'Did you write about this post on your own website? Send the address of your post (webmention):',
    webmentionUrl: 'The address of your post',
    send: 'Send',
    mentioned: 'Mentioned this post',
    more: 'Read more',
    copy: 'Copy',
    copied: 'Copied',
    likes: { one: 'like', other: 'likes' },
    boosts: { one: 'boost', other: 'boosts' },
    support: 'Support',
    supportText: 'Do you like what I do? Support me on Patreon. It helps me find time for new projects, videos and posts.',
    patreon: 'Become a patron',
    about: 'More about me'
  },
  pl: {
    updated: 'Ostatnia edycja',
    views: { one: 'wyświetlenie', few: 'wyświetlenia', many: 'wyświetleń', other: 'wyświetlenia' },
    comments: 'Komentarze',
    empty: 'Nikt jeszcze nie skomentował tego wpisu. Bądź pierwszy!',
    howTo: 'Skomentuj z Mastodona lub innej aplikacji fediwersum:',
    steps: [
      'Skopiuj adres tego wpisu:',
      'Wklej go w wyszukiwarkę swojej aplikacji i otwórz wpis.',
      'Odpowiedz, polub lub podbij. Twój komentarz pojawi się tutaj po minucie.'
    ],
    follow: 'Nowe wpisy dostaniesz, obserwując',
    email: 'Albo napisz do mnie:',
    webmention: 'Napisałeś o tym wpisie na swojej stronie? Wyślij adres swojego wpisu (webmention):',
    webmentionUrl: 'Adres twojego wpisu',
    send: 'Wyślij',
    mentioned: 'Wspomniał(a) o tym wpisie',
    more: 'Czytaj dalej',
    copy: 'Kopiuj',
    copied: 'Skopiowano',
    likes: { one: 'polubienie', few: 'polubienia', many: 'polubień', other: 'polubienia' },
    boosts: { one: 'podbicie', few: 'podbicia', many: 'podbić', other: 'podbicia' },
    support: 'Wsparcie',
    supportText: 'Podoba Ci się to, co robię? Wesprzyj mnie na Patreonie. Dzięki temu znajduję czas na nowe projekty, filmy i wpisy.',
    patreon: 'Zostań patronem',
    about: 'Więcej o mnie'
  }
};
// The contact links of the post footer.
const EMAIL = 'contact@yasiu.pl';
// webmention.io receives the webmentions of the site (see "Webmentions" in README.md).
const WEBMENTION = 'https://webmention.io/yasiu.pl/webmention';
const PATREON = 'https://www.patreon.com/yasiupl';
const words = (lang) => WORDS[lang] || WORDS.en;
const CROPS = ['top', 'center', 'bottom'];
// The video in the header of a post: a YouTube URL (youtu.be/<ID>, watch?v=<ID> or embed/<ID>)
// with an optional start time (t= or start=, in seconds or as 1h2m3s).
function youtube(url) {
  const id = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/);
  if (!id) return null;
  const t = url.match(/[?&](?:t|start)=([0-9hms]+)/);
  const parts = t && t[1].match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  const start = parts ? (+parts[1] || 0) * 3600 + (+parts[2] || 0) * 60 + (+parts[3] || 0) : 0;
  return { id: id[1], start };
}
const embedUrl = (v) => `https://www.youtube-nocookie.com/embed/${v.id}${v.start ? `?start=${v.start}` : ''}`;

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

// The images of the post text as absolute URLs of JPEG files up to 1600 px wide, with their alt
// text. The fediverse gets them as attachments of the post (see build/activitypub.js).
function bodyImages(tokens, cdn) {
  const list = [];
  marked.walkTokens(tokens, (t) => {
    if (t.type === 'image') list.push({ url: absolute(scaled(t.pic, cdn, [1600], '', null, undefined, 'jpg').src), alt: t.text || '' });
  });
  return list;
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
    if (fields.index && !['yes', 'no'].includes(fields.index)) throw new Error(`${file}: index must be yes or no`);
    if (fields.video && !youtube(fields.video)) throw new Error(`${file}: video must be a YouTube URL`);
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

    // Header video: the "video" field, else the video of a YouTube thumbnail youtube-<ID>.jpg in the
    // header. The page shows the player in place of the header image. The header image stays for
    // the post card and the link previews. If the post text has a player of the same video on its
    // own, the header replaces it.
    const thumbnail = header && header.url.match(/\/youtube-([A-Za-z0-9_-]{11})\.jpg$/);
    const video = fields.video ? youtube(fields.video) : thumbnail && { id: thumbnail[1], start: 0 };
    if (video) {
      const player = new RegExp(`^<iframe[^>]+/embed/${video.id}[^>]*>\\s*</iframe>\\s*$`);
      const index = tokens.findIndex((t) => t.type === 'html' && player.test(t.raw.trim()));
      if (index >= 0) tokens.splice(index, 1);
    }
    // A header video replaces the header image on the page: then the text keeps that image.
    const same = header && !video ? tokens.findIndex((t) => t.type === 'paragraph' && t.tokens.length === 1 &&
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
      // Search engines index the post page and its files only with "index: yes" (see renderRobots).
      indexed: fields.index === 'yes',
      video,
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
      // For the fediverse (build/activitypub.js): the date of the last edit, also on the day of
      // publication, and the images of the text, which a Note sends as attachments.
      modified: updated,
      images: bodyImages(tokens, cdn),
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

// The card of a post with a header video shows a play button. A post with a short clip in the
// text does not get the button.

function card(p) {
  return `<div class="col s12 m6 l4">
            <a class="card is-link post-card h-entry${p.video ? ' video-card' : ''}" href="${p.url}" lang="${escape(p.lang)}">${p.image ? `
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

// The small author card at the top of a post, for readers who come from a link. It is the
// p-author of the h-entry. "author" comes from
// authorData in build/profile.js.
function authorCard(author, lang) {
  return `<a class="card is-link author-card p-author h-card" href="${SITE}/">
            <img class="u-photo" src="${escape(author.photo)}" alt="" width="48" height="48">
            <span class="author-text">
              <span class="author-name p-name">${escape(author.name)}</span>
              <span class="author-tagline p-note">${escape(author.tagline[lang] || author.tagline.en)}</span>${author.job ? `
              <span class="author-job">${escape(author.job[lang] || author.job.en)}</span>` : ''}
              <span class="author-more">${escape(words(lang).about)} →</span>
            </span>
          </a>`;
}

// The footer under each post: the number of views, the comments and the support on Patreon.
// The comments come from two sources (see "Post footer" in README.md):
// - the replies, likes and boosts from the fediverse, sent to the actor @blog@yasiu.pl,
// - the webmentions from webmention.io (other websites, and the fediverse through Bridgy).
// src/app.js fills the parts with data-views-path, data-comments-slug and data-webmention-target.
// The card always tells how to comment; the text "be the first" shows only when a source answers
// with no comments. Without the actor (no public key, see build/activitypub.js), the card has no
// data-comments-slug and no steps for the fediverse.
function renderFooter(p, { fediverse = false } = {}) {
  const w = words(p.lang);
  const subject = encodeURIComponent(p.title);
  const target = SITE + p.url;
  const forms = (prefix, list) => Object.entries(list).map(([form, word]) => ` data-${prefix}-${form}="${escape(word)}"`).join('');
  const email = `<a href="mailto:${EMAIL}?subject=${subject}">${EMAIL}</a>`;
  const slug = fediverse ? ` data-comments-slug="${escape(p.slug)}"` : '';
  const steps = fediverse ? `<p>${escape(w.howTo)}</p>
                <ol class="post-comments-steps">
                  <li>${escape(w.steps[0])} <span class="post-copy"><code class="post-copy-url">${escape(target)}</code> <button class="post-copy-link" type="button" data-copied="${escape(w.copied)}" hidden>${escape(w.copy)}</button></span></li>
                  <li>${escape(w.steps[1])}</li>
                  <li>${escape(w.steps[2])}</li>
                </ol>
                <p class="post-comments-more">${escape(w.follow)} <code>@blog@yasiu.pl</code>.</p>
                ` : '';
  const comments = `<section class="card post-comments"${slug} data-webmention-target="${escape(target)}" data-mentioned="${escape(w.mentioned)}" data-more="${escape(w.more)}"${forms('likes', w.likes)}${forms('boosts', w.boosts)}>
            <div class="card-content">
              <h2 class="eyebrow">${escape(w.comments)}</h2>
              <p class="post-reactions" hidden></p>
              <ol class="post-comments-list" hidden></ol>
              <p class="post-comments-empty" hidden>${escape(w.empty)}</p>
              <div class="post-comments-how">
                ${steps}<form class="post-webmention" action="${WEBMENTION}" method="post">
                  <label for="post-webmention-source">${escape(w.webmention)}</label>
                  <div class="post-webmention-row">
                    <input id="post-webmention-source" type="url" name="source" required placeholder="https://…" aria-label="${escape(w.webmentionUrl)}">
                    <input type="hidden" name="target" value="${escape(target)}">
                    <button class="post-webmention-send" type="submit">${escape(w.send)}</button>
                  </div>
                </form>
                <p>${escape(w.email)} ${email}</p>
              </div>
            </div>
          </section>`;
  return `<aside class="post-footer" lang="${escape(p.lang)}">
          <p class="post-views" data-views-path="${escape(p.url)}"${Object.entries(w.views).map(([form, word]) => ` data-${form}="${escape(word)}"`).join('')} hidden><span class="post-views-count"></span> <span class="post-views-word"></span></p>
          ${comments}
          <section class="card post-footer-card">
            <div class="card-content">
              <h2 class="eyebrow">${escape(w.support)}</h2>
              <p>${escape(w.supportText)}</p>
              <p class="post-footer-links"><a class="post-footer-button" href="${PATREON}" target="_blank" rel="noopener">${escape(w.patreon)}</a></p>
            </div>
          </section>
        </aside>`;
}

function renderPost(p, newer, older, author, { fediverse = false } = {}) {
  const link = (q, rel, label) => q
    ? `<a class="post-nav-${rel}" href="${q.url}" rel="${rel}"><span class="eyebrow">${label}</span><span lang="${escape(q.lang)}">${escape(q.title)}</span></a>`
    : '<span></span>';
  return `<article class="h-entry" lang="${escape(p.lang)}">
          <header class="post-header">
            <time class="dt-published" datetime="${escape(p.date)}">${escape(p.displayDate)}</time>
            <h1 class="p-name">${escape(p.title)}</h1>
            <a class="u-url" href="${SITE}${p.url}" hidden></a>
            ${author ? '' : `<a class="p-author h-card" href="${SITE}/" hidden>Marcin Jasiukowicz</a>`}
          </header>${author ? `
          ${authorCard(author, p.lang)}` : ''}
          <div class="card post-body">${p.video ? `
            <div class="card-image post-video">
              <iframe src="${embedUrl(p.video)}" title="${escape(p.title)}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>` : p.image ? `
            <div class="card-image">
              <a class="u-featured" href="${escape(p.image.original)}">${img(p.image.header, ' alt="" fetchpriority="high"')}</a>
            </div>` : ''}
            <div class="card-content e-content">
${p.html}
            </div>
          </div>${p.updated || p.aiLabel ? `
          <p class="post-notes">${p.updated ? `${escape(words(p.lang).updated)}: <time class="dt-updated" datetime="${escape(p.updated)}">${escape(p.displayUpdated)}</time>.` : ''}${p.updated && p.aiLabel ? ' ' : ''}${p.aiLabel ? `${escape(p.aiLabel)}.` : ''}</p>` : ''}
        </article>
        ${renderFooter(p, { fediverse })}
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

// The robots meta tag of a post page. A page that search engines do not index still lets them
// follow its links (to the older and newer post).
const robots = (p) => (p.indexed ? '' : 'noindex, follow, noimageindex');

// robots.txt. Search engines see the blog list (/blog/) with the title and the summary of each
// post, but not the posts. A post with "index: yes" is fully visible.
// - The post page stays open to crawlers: they must read its "noindex" tag.
// - The files of the post (images, PDF files, archives) are closed to crawlers.
// - Google Images gets no images of these posts and no scaled images of the image CDN (the cards
//   on /blog/ and the images in the post text use the CDN).
function renderRobots(posts) {
  const hidden = posts.filter((p) => !p.indexed);
  return `# The private CV and business card (with the phone number) are not linked from the site.
# Search engines must not index them (see README.md, "Public and private CV").
# The blog posts without "index: yes": see README.md, "Search engines".
User-agent: *
Disallow: /cv/Resume_
Disallow: /cv/Card_
${hidden.map((p) => `Allow: ${p.url}$\nDisallow: ${p.url}`).join('\n')}

User-agent: Googlebot-Image
Disallow: /cv/Resume_
Disallow: /cv/Card_
Disallow: /_vercel/image
Disallow: /.netlify/images
${hidden.map((p) => `Disallow: ${p.url}`).join('\n')}

Sitemap: ${SITE}/sitemap.xml
`;
}

// sitemap.xml: the pages for search engines. Posts without "index: yes" are not in it.
function renderSitemap(posts) {
  const lastmod = (p) => (p.updated || p.date).slice(0, 10);
  const newest = posts.map(lastmod).sort().pop();
  const pages = [
    { loc: `${SITE}/` },
    { loc: `${SITE}/blog/`, lastmod: newest },
    ...posts.filter((p) => p.indexed).map((p) => ({ loc: SITE + p.url, lastmod: lastmod(p) }))
  ];
  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((u) => `  <url><loc>${escape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
}

module.exports = { SITE, IMAGE_WIDTHS, loadPosts, renderCards, renderPost, renderFeed, renderRobots, renderSitemap, robots, escape, absoluteUrls };
