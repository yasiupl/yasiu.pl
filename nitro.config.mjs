// Nitro (https://nitro.build) makes two outputs from this repository (see README.md, "Hosting"):
//
// - The site, on Vercel or on Netlify: the static files that webpack makes in public/ and the
//   redirects below. The site has no server functions (presets vercel-static and netlify-static).
// - The backend, on blade12: a Node.js server with the API routes in server/ (preset node-server).
//   infra/api/Dockerfile builds it with NITRO_PRESET=node-server.
//
// The variable VERCEL or NETLIFY selects the site. "nitro dev" (npm run dev:api) is like the backend.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineNitroConfig } from 'nitropack/config';

const site = Boolean(process.env.VERCEL || process.env.NETLIFY);

// The address of the backend (see infra/api/README.md).
const BACKEND = 'https://api.yasiu.pl';

const redirect = (to, statusCode = 301) => ({ redirect: { to, statusCode } });

function siteConfig() {
  const { IMAGE_WIDTHS } = createRequire(import.meta.url)('./build/blog.js');
  return {
    preset: process.env.VERCEL ? 'vercel-static' : 'netlify-static',
    // "fallthrough" stops the Vercel preset from sending all files (also the HTML pages) with a cache
    // time of one year.
    publicAssets: [{ dir: fileURLToPath(new URL('./public', import.meta.url)), fallthrough: true }],

    routeRules: {
      // Short addresses.
      '/reddit': redirect('https://reddit.com/u/marcysvoneylau'),
      '/twitter': redirect('https://twitter.com/yasiupl'),
      '/linkedin': redirect('https://www.linkedin.com/in/yasiu'),
      '/github': redirect('https://github.com/yasiupl'),
      '/patreon': redirect('https://www.patreon.com/yasiupl'),
      '/donate': redirect('https://www.patreon.com/yasiupl'),
      '/paypal': redirect('https://www.paypal.me/yasiupl'),
      '/youtube': redirect('https://www.youtube.com/channel/UCqFJAKOMWvS_oKHk9ppMC8w'),
      '/keybase': redirect('https://keybase.io/yasiupl'),
      // The public keys (the profile card links to them). The fingerprint of the PGP key is also in
      // src/cv.md ("pgp").
      '/ssh.pub': redirect('https://github.com/yasiupl.keys'),
      '/pgp.pub': redirect('https://keybase.io/yasiupl/pgp_keys.asc?fingerprint=fe683591ae239dc2188c4bba1e3e8090e179f056'),
      '/cv': redirect('/cv/Marcin_Jasiukowicz_CV.pdf', 302),

      // The thesis PDF files moved from /resume/ to their blog posts.
      '/resume/bachelor_thesis.pdf': redirect('/blog/engineering-thesis-stardust/bachelor_thesis.pdf'),
      '/resume/**': redirect('/blog/masters-thesis-ops-sat/**'),

      // The Web Key Directory (build/keys.js). GnuPG and other programs, also in browsers, read the
      // key from any origin.
      '/.well-known/openpgpkey/**': {
        headers: { 'content-type': 'application/octet-stream', 'access-control-allow-origin': '*' }
      },
      // The Bluesky handle @yasiu.pl (src/static/.well-known/atproto-did). DNS also has it
      // (_atproto.yasiu.pl).
      '/.well-known/atproto-did': { headers: { 'content-type': 'text/plain' } },
      '/bluesky': redirect('https://bsky.app/profile/yasiu.pl'),
      '/keyoxide': redirect('https://keyoxide.org/wkd/contact%40yasiu.pl'),

      // The backend answers the WebFinger requests (server/routes/.well-known/webfinger.get.js).
      // Vercel keeps the query of the request (?resource=acct:...) in the redirect.
      '/.well-known/webfinger': redirect(`${BACKEND}/.well-known/webfinger`, 302),
      // The static part of the actor @blog@yasiu.pl (build/activitypub.js). Fediverse servers accept
      // only these content types. The short cache time lets them see a changed post soon.
      '/ap/**': {
        headers: {
          'content-type': 'application/activity+json; charset=utf-8',
          'access-control-allow-origin': '*',
          'cache-control': 'public, max-age=300'
        }
      },
    },

    // Vercel Image Optimization scales the blog images (see build/blog.js).
    vercel: {
      config: {
        images: { sizes: IMAGE_WIDTHS, formats: ['image/avif', 'image/webp'], minimumCacheTTL: 86400 }
      }
    }
  };
}

function backendConfig() {
  return {
    // The site calls the API routes from another origin (yasiu.pl), so the routes send CORS headers.
    // Each route keeps its answer in memory ("swr"). After maxAge, the next request gets the kept
    // answer, and the route gets a new answer in the background. If the source fails, the route
    // keeps the last good answer. Thus the site sends few requests to Last.fm, OpenStreetMap and
    // Plausible.
    routeRules: {
      '/api/lastfm': { cors: true, cache: { maxAge: 60, swr: true, staleMaxAge: 300 } },
      '/api/location': { cors: true, cache: { maxAge: 300, swr: true, staleMaxAge: 900 } },
      '/api/views': { cors: true, cache: { maxAge: 600, swr: true, staleMaxAge: 3600 } },
      // The replies and reactions of a post change often, so the answer is kept only for one minute.
      '/api/comments': { cors: true, cache: { maxAge: 60, swr: true, staleMaxAge: 600 } }
    },
    // The actor @blog@yasiu.pl (see README.md, "Fediverse"): blog:sync finds new and changed posts in
    // the outbox of the site, blog:deliver sends the delivery queue.
    experimental: { tasks: true },
    scheduledTasks: {
      '*/5 * * * *': ['blog:sync'],
      '* * * * *': ['blog:deliver']
    }
  };
}

export default defineNitroConfig({
  compatibilityDate: '2026-10-01',
  srcDir: 'server',
  ...(site ? siteConfig() : backendConfig())
});
