// The blog as the ActivityPub actor @blog@yasiu.pl (see README.md, "Fediverse").
//
// The build makes the static part of the actor: the actor document, the outbox with all posts, and
// one object for each post. The site serves these files from the CDN, so the fediverse can read the
// blog also when the backend is down. The backend (api.yasiu.pl) has the dynamic part: the inbox,
// the followers, the delivery of new posts, and the replies and reactions (server/routes/ap/).
//
// The addresses are in server/utils/blog-actor.json. The build and the backend use the same file.
const fs = require('fs');
const path = require('path');
const AP = require('../server/utils/blog-actor.json');
const { absoluteUrls, escape } = require('./blog');

// The public key of the actor. The private key is a secret of the backend (see README.md,
// "Fediverse"). Without the public key, the build makes no actor files.
const PUBLIC_KEY_FILE = path.join(__dirname, '..', 'src', 'activitypub', 'blog.pub.pem');

const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';
const CONTEXT = ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'];
const json = (value) => JSON.stringify(value, null, 1);
const iso = (date) => new Date(date).toISOString();

// The address of the object of a post. The HTML page of the post links to it (see blogPage in
// webpack.config.js), so a search for the page address in Mastodon finds the object.
const objectId = (p) => `${AP.objects}${p.slug}.json`;

function publicKey() {
  try {
    return fs.readFileSync(PUBLIC_KEY_FILE, 'utf8').trim();
  } catch {
    return null;
  }
}

// The fediverse gets each post as a Note with the full text. Mastodon shows only the title and a
// link for an Article, but the full content of a Note. Mastodon keeps only simple HTML in a post
// (paragraphs, links, emphasis, lists, quotes and code). Thus:
// - the title is the first paragraph, in bold, and the headings are bold paragraphs;
// - the images are attachments (at most MAX_ATTACHMENTS, the header image first), not <img>;
// - a YouTube player is a link to the video;
// - the last paragraph links to the post page.
const MAX_ATTACHMENTS = 4;
const youtubeLink = (id, title) => `<p><a href="https://www.youtube.com/watch?v=${id}">▶ ${title || 'YouTube'}</a></p>`;

function noteContent(p) {
  const html = absoluteUrls(p.html)
    .replace(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/g, '')
    .replace(/<img\b[^>]*>/g, '')
    .replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/g, '<p><strong>$1</strong></p>')
    .replace(/<iframe\b[^>]*\bsrc="[^"]*\/embed\/([A-Za-z0-9_-]{11})[^"]*"[^>]*?(?:\btitle="([^"]*)")?[^>]*>\s*<\/iframe>/g,
      (m, id, title) => youtubeLink(id, title))
    .replace(/<p>\s*<\/p>/g, '')
    .trim();
  const url = AP.site + p.url;
  return [
    `<p><strong>${escape(p.title)}</strong></p>`,
    p.video ? youtubeLink(p.video.id, escape(p.title)) : '',
    html,
    `<p><a href="${url}">${url}</a></p>`
  ].filter(Boolean).join('\n');
}

function attachments(p) {
  const list = [
    ...(p.image ? [{ url: p.image.share, alt: '' }] : []),
    ...(p.images || [])
  ];
  return list.slice(0, MAX_ATTACHMENTS).map((i) => ({ type: 'Document', mediaType: 'image/jpeg', url: i.url, name: i.alt }));
}

function postObject(p) {
  const content = noteContent(p);
  const files = attachments(p);
  return {
    id: objectId(p),
    type: 'Note',
    attributedTo: AP.actor,
    content,
    contentMap: { [p.lang]: content },
    url: AP.site + p.url,
    published: iso(p.date),
    ...(p.modified && { updated: iso(p.modified) }),
    to: [PUBLIC],
    cc: [AP.followers],
    sensitive: false,
    ...(files.length && { attachment: files })
  };
}

const createActivity = (p) => ({
  id: `${objectId(p)}#create`,
  type: 'Create',
  actor: AP.actor,
  published: iso(p.date),
  to: [PUBLIC],
  cc: [AP.followers],
  object: postObject(p)
});

function actorDocument(posts, { key, author, summary }) {
  const first = posts.length ? posts[posts.length - 1].date : null;
  return {
    '@context': CONTEXT,
    id: AP.actor,
    type: 'Person',
    preferredUsername: AP.username,
    name: 'yasiu.pl blog',
    summary: `<p>${summary}</p>`,
    url: AP.profile,
    icon: { type: 'Image', url: AP.site + author.photo },
    inbox: AP.inbox,
    outbox: AP.outbox,
    followers: AP.followers,
    following: AP.following,
    endpoints: { sharedInbox: AP.inbox },
    manuallyApprovesFollowers: false,
    discoverable: true,
    // The post pages are hidden from search engines (see "Search engines" in README.md).
    // Fediverse servers get the same rule for their full-text search.
    indexable: false,
    ...(first && { published: iso(first) }),
    attachment: [
      { type: 'PropertyValue', name: 'Website', value: `<a href="${AP.site}/" rel="me">yasiu.pl</a>` },
      { type: 'PropertyValue', name: 'Feed', value: `<a href="${AP.site}/blog/feed.xml">Atom</a>` }
    ],
    publicKey: { id: AP.key, owner: AP.actor, publicKeyPem: key }
  };
}

// The files of the actor, as { path in the site: content }. An empty object if the public key is
// not in the repository.
function actorFiles(posts, { author, summary }) {
  const key = publicKey();
  if (!key) {
    console.warn(`warning: ${path.relative(process.cwd(), PUBLIC_KEY_FILE)} not found: the build makes no ActivityPub files`);
    return {};
  }
  const prefix = (url) => url.replace(`${AP.site}/`, '');
  const files = {
    [prefix(AP.actor)]: json(actorDocument(posts, { key, author, summary })),
    [prefix(AP.outbox)]: json({
      '@context': CONTEXT[0],
      id: AP.outbox,
      type: 'OrderedCollection',
      totalItems: posts.length,
      orderedItems: posts.map(createActivity)
    }),
    [prefix(AP.following)]: json({
      '@context': CONTEXT[0], id: AP.following, type: 'OrderedCollection', totalItems: 0, orderedItems: []
    })
  };
  for (const p of posts) {
    files[prefix(objectId(p))] = json({ '@context': CONTEXT[0], ...postObject(p) });
  }
  return files;
}

module.exports = { actorFiles, objectId, hasKey: () => Boolean(publicKey()) };
