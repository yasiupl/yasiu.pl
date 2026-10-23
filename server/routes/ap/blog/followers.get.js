// The followers of the actor @blog@yasiu.pl: only their number, not the list (like Mastodon with a
// hidden list of followers).
export default defineEventHandler((event) => {
  const { count } = apDb().prepare('SELECT COUNT(*) AS count FROM followers').get();
  setResponseHeaders(event, { 'content-type': `${AS_TYPE}; charset=utf-8`, 'access-control-allow-origin': '*' });
  return { '@context': 'https://www.w3.org/ns/activitystreams', id: BLOG.followers, type: 'OrderedCollection', totalItems: count };
});
