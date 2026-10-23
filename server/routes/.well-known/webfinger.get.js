// WebFinger for the fediverse handles of yasiu.pl (see README.md, "Fediverse"). The site redirects
// /.well-known/webfinger to the backend, which runs this route.
//
// - @blog@yasiu.pl: the actor of the blog (build/activitypub.js and server/routes/ap/).
// - @yasiu@yasiu.pl: an alias of the Mastodon account @yasiu@0x3c.pl. The subject of the answer is
//   acct:yasiu@0x3c.pl, so the other server asks 0x3c.pl again and shows @yasiu@0x3c.pl.
const BLOG_RESOURCES = [`acct:${BLOG.username}@${BLOG.domain}`, BLOG.actor, BLOG.profile];
const PERSON_RESOURCES = ['acct:yasiu@yasiu.pl', 'https://yasiu.pl/', 'https://yasiu.pl'];

const ACTOR = 'https://0x3c.pl/users/yasiu';
const PROFILE = 'https://0x3c.pl/@yasiu';

function blog() {
  return {
    subject: `acct:${BLOG.username}@${BLOG.domain}`,
    aliases: [BLOG.actor, BLOG.profile],
    links: [
      { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: BLOG.profile },
      { rel: 'self', type: 'application/activity+json', href: BLOG.actor }
    ]
  };
}

function person() {
  return {
    subject: 'acct:yasiu@0x3c.pl',
    aliases: [PROFILE, ACTOR],
    links: [
      { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: PROFILE },
      { rel: 'self', type: 'application/activity+json', href: ACTOR },
      { rel: 'http://ostatus.org/schema/1.0/subscribe', template: 'https://0x3c.pl/authorize_interaction?uri={uri}' }
    ]
  };
}

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
  const resource = String(getQuery(event).resource || '');
  const lower = resource.toLowerCase();
  const answer = BLOG_RESOURCES.map((r) => r.toLowerCase()).includes(lower) ? blog()
    : PERSON_RESOURCES.includes(lower) ? person() : null;
  if (!answer) throw createError({ statusCode: 404, statusMessage: 'Unknown resource' });
  setResponseHeaders(event, {
    'Content-Type': 'application/jrd+json',
    'Cache-Control': 'public, max-age=3600'
  });
  return answer;
});
