// WebFinger for the fediverse handle @yasiu@yasiu.pl (see README.md, "Fediverse"). The site
// redirects /.well-known/webfinger to the backend, which runs this route.
// The handle is an alias of the Mastodon account @yasiu@0x3c.pl. The subject of the answer is
// acct:yasiu@0x3c.pl, so the other server asks 0x3c.pl again and shows @yasiu@0x3c.pl.
const RESOURCES = ['acct:yasiu@yasiu.pl', 'https://yasiu.pl/', 'https://yasiu.pl'];

const ACTOR = 'https://0x3c.pl/users/yasiu';
const PROFILE = 'https://0x3c.pl/@yasiu';

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
  const resource = String(getQuery(event).resource || '').toLowerCase();
  if (!RESOURCES.includes(resource)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown resource' });
  }
  setResponseHeaders(event, {
    'Content-Type': 'application/jrd+json',
    'Cache-Control': 'public, max-age=3600'
  });
  return {
    subject: 'acct:yasiu@0x3c.pl',
    aliases: [PROFILE, ACTOR],
    links: [
      { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: PROFILE },
      { rel: 'self', type: 'application/activity+json', href: ACTOR },
      { rel: 'http://ostatus.org/schema/1.0/subscribe', template: 'https://0x3c.pl/authorize_interaction?uri={uri}' }
    ]
  };
});
