// The replies and reactions from the fediverse for one blog post, for the post footer (see
// README.md, "Post footer"). The query: ?slug=<slug of the post>.
// The answer: { object, likes, boosts, replies: [{ id, url, inReplyTo, published, summary, content,
// author: { name, handle, url, icon } }] }. The content is HTML that the backend made safe.
// Only web addresses: a "javascript:" link from another server must not get into the page.
const web = (url) => (typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null);

function author(id) {
  const row = apDb().prepare('SELECT json FROM actors WHERE id = ?').get(id);
  const actor = row ? JSON.parse(row.json) : {};
  const host = new URL(id).host;
  const icon = [].concat(actor.icon || [])[0];
  return {
    name: plainText(actor.name || actor.preferredUsername || id),
    handle: `@${actor.preferredUsername || '?'}@${host}`,
    url: web(idOf([].concat(actor.url || id)[0])) || web(id),
    icon: icon ? web(idOf(icon.url ? [].concat(icon.url)[0] : icon)) : null
  };
}

export default defineEventHandler((event) => {
  const slug = String(getQuery(event).slug || '');
  if (!/^[a-z0-9-]+$/.test(slug)) throw createError({ statusCode: 400, statusMessage: 'slug must be the slug of a post' });
  const db = apDb();
  const count = (kind) => db.prepare('SELECT COUNT(*) AS n FROM reactions WHERE slug = ? AND kind = ?').get(slug, kind).n;
  const replies = db.prepare('SELECT * FROM replies WHERE slug = ? ORDER BY published').all(slug).map((r) => ({
    id: r.id,
    url: web(r.url) || web(r.id),
    inReplyTo: r.in_reply_to,
    published: r.published,
    summary: r.summary,
    content: r.content,
    author: author(r.actor)
  }));
  return { object: `${BLOG.objects}${slug}.json`, likes: count('like'), boosts: count('boost'), replies };
});
