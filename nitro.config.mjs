// Nitro (https://nitro.build) makes the deployment for the hosting platform: Vercel, Netlify or a
// Node.js server. It serves the site that webpack makes in public/, the API routes in server/api/,
// and the redirects below. Nitro finds the platform from the environment of the build.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineNitroConfig } from 'nitropack/config';

const { IMAGE_WIDTHS } = createRequire(import.meta.url)('./build/blog.js');

const redirect = (to, statusCode = 301) => ({ redirect: { to, statusCode } });

export default defineNitroConfig({
  compatibilityDate: '2026-10-01',
  srcDir: 'server',
  // "fallthrough": a path that is not a file goes to the API routes. It also stops the Vercel preset
  // from sending all files (also the HTML pages) with a cache time of one year.
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
    '/ssh.pub': redirect('https://github.com/yasiupl.keys'),
    '/pgp.pub': redirect('https://keybase.io/yasiupl/pgp_keys.asc?fingerprint=fe683591ae239dc2188c4bba1e3e8090e179f056'),
    '/cv': redirect('/cv/Marcin_Jasiukowicz_CV.pdf', 302),

    // The thesis PDF files moved from /resume/ to their blog posts.
    '/resume/bachelor_thesis.pdf': redirect('/blog/engineering-thesis-stardust/bachelor_thesis.pdf'),
    '/resume/**': redirect('/blog/masters-thesis-ops-sat/**'),

    // Bridgy Fed: the fediverse handle @yasiu@yasiu.pl (see README.md, "Fediverse").
    // The WebFinger request has a query, so server/routes/.well-known/webfinger.get.js sends it on.
    '/.well-known/host-meta': redirect('https://fed.brid.gy/.well-known/host-meta', 302),
    '/.well-known/host-meta.json': redirect('https://fed.brid.gy/.well-known/host-meta.json', 302),
  },

  // Vercel Image Optimization scales the blog images (see build/blog.js).
  vercel: {
    config: {
      images: { sizes: IMAGE_WIDTHS, formats: ['image/avif', 'image/webp'], minimumCacheTTL: 86400 }
    }
  }
});
