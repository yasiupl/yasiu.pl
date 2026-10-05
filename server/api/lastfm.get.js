// The last track on Last.fm, for the "I'm listening to..." card of the home page.
// The backend keeps the answer for 60 seconds (the route rules in nitro.config.mjs).
export default defineEventHandler(async () => {
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
  return data;
});
