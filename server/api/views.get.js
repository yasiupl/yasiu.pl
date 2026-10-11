// The number of views of each blog post, for the footer under the post (see README.md, "Post
// footer"). The numbers come from the self-hosted Plausible (Stats API v2) and count all page
// views since the start of the statistics.
//
// One request to Plausible gives the numbers of all posts. The backend keeps the answer for
// 10 minutes (the route rules in nitro.config.mjs), so Plausible gets few requests.
// The answer: { "/blog/<slug>/": <views>, ... }.
const SITE_ID = 'yasiu.pl';

// A post page has the path /blog/<slug>/. Plausible can also have /blog/<slug> or
// /blog/<slug>/index.html for the same page. Files of the post (/blog/<slug>/file.pdf) are not pages.
function postPath(page) {
  const match = page.match(/^\/blog\/([a-z0-9-]+)(?:\/(?:index\.html)?)?$/);
  return match ? `/blog/${match[1]}/` : null;
}

export default defineEventHandler(async () => {
  const apiKey = fromEnv('PLAUSIBLE_API_KEY');
  const base = fromEnv('PLAUSIBLE_URL') || 'https://plausible.yasiu.pl';
  const data = await $fetch(`${base}/api/v2/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      site_id: SITE_ID,
      metrics: ['pageviews'],
      date_range: 'all',
      dimensions: ['event:page'],
      filters: [['contains', 'event:page', ['/blog/']]],
      pagination: { limit: 10000 }
    },
    timeout: 10000
  }).catch((error) => {
    // The error tells if the key has a value (yes or no), never the value.
    throw createError({
      statusCode: 502,
      statusMessage: `Plausible: ${error.status || error.message}`,
      data: { PLAUSIBLE_API_KEY: Boolean(apiKey) }
    });
  });

  const views = {};
  for (const { dimensions: [page], metrics: [count] } of data.results) {
    const path = postPath(page);
    if (path) views[path] = (views[path] || 0) + count;
  }
  return views;
});
