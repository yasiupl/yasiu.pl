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
const { absoluteUrls } = require('./blog');

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

function postObject(p) {
  const html = absoluteUrls((p.image ? `<p><img src="${p.image.share}" alt=""></p>\n` : '') + p.html);
  return {
    id: objectId(p),
    type: 'Article',
    attributedTo: AP.actor,
    name: p.title,
    content: html,
    contentMap: { [p.lang]: html },
    url: AP.site + p.url,
    published: iso(p.date),
    ...(p.updated && { updated: iso(p.updated) }),
    to: [PUBLIC],
    cc: [AP.followers],
    ...(p.image && { image: { type: 'Image', mediaType: 'image/jpeg', url: p.image.share } })
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
