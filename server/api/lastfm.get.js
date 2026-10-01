// The last track on Last.fm, for the "I'm listening to..." card of the home page.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return $fetch('https://ws.audioscrobbler.com/2.0/', {
    query: { method: 'user.getrecenttracks', user: 'yasiupl', format: 'json', limit: 1, api_key: fromEnv('LASTFM_API_KEY', 'lastfm') }
  });
});
