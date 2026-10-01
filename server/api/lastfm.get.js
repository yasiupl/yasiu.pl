// The last track on Last.fm, for the "I'm listening to..." card of the home page.
export default defineEventHandler(async (event) => {
  const apiKey = fromEnv('LASTFM_API_KEY', 'lastfm');
  const data = await $fetch('https://ws.audioscrobbler.com/2.0/', {
    query: { method: 'user.getrecenttracks', user: 'yasiupl', format: 'json', limit: 1, api_key: apiKey },
    timeout: 10000
  }).catch((error) => {
    // The error tells if the key has a value (yes or no), never the value.
    throw createError({
      statusCode: 502,
      statusMessage: `Last.fm: ${error.status || error.message}`,
      data: { LASTFM_API_KEY: Boolean(apiKey) }
    });
  });
  setResponseHeader(event, 'Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return data;
});
