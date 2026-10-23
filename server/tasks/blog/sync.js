// Finds new, changed and removed posts in the outbox of the site and puts the activities for the
// followers into the delivery queue (see README.md, "Fediverse"). nitro.config.mjs runs this task
// every five minutes, so a new post reaches the fediverse some minutes after the deployment.
//
// The first run only records the posts that exist: the archive does not go to the followers.
// The outbox is a static file of the site (build/activitypub.js).
const audience = { to: [AS_PUBLIC], cc: [BLOG.followers] };

export default defineTask({
  meta: { name: 'blog:sync', description: 'Send new and changed posts of @blog@yasiu.pl to the followers' },
  async run() {
    const db = apDb();
    // BLOG_OUTBOX_URL: another outbox, for example of a test build.
    const response = await fetch(process.env.BLOG_OUTBOX_URL || BLOG.outbox, { headers: { accept: AS_TYPE }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`outbox: ${response.status}`);
    const outbox = await response.json();
    const objects = (outbox.orderedItems || []).map((item) => item.object).filter((o) => o && o.id);
    if (!objects.length) return { result: 'the outbox is empty: no change' };

    const known = new Map(db.prepare('SELECT object, updated FROM posts').all().map((r) => [r.object, r.updated]));
    const save = db.prepare('INSERT INTO posts (object, updated, json) VALUES (?, ?, ?) ON CONFLICT (object) DO UPDATE SET updated = excluded.updated, json = excluded.json');

    if (!apMeta('initialized')) {
      for (const o of objects) save.run(o.id, o.updated || null, JSON.stringify(o));
      apMeta('initialized', new Date().toISOString());
      return { result: `recorded ${objects.length} existing posts` };
    }

    const inboxes = followerInboxes();
    const changes = { created: 0, updated: 0, deleted: 0 };
    for (const o of objects) {
      if (!known.has(o.id)) {
        enqueue({ id: `${o.id}#create`, type: 'Create', actor: BLOG.actor, published: o.published, ...audience, object: o }, inboxes);
        changes.created++;
      } else if ((o.updated || null) !== known.get(o.id)) {
        enqueue({ id: `${o.id}#update-${Date.parse(o.updated || o.published)}`, type: 'Update', actor: BLOG.actor, ...audience, object: o }, inboxes);
        changes.updated++;
      } else {
        continue;
      }
      save.run(o.id, o.updated || null, JSON.stringify(o));
    }

    // A removed or renamed post. A short or broken outbox must not delete the blog: if more than
    // a few posts are gone at once, nothing is deleted.
    const current = new Set(objects.map((o) => o.id));
    const gone = [...known.keys()].filter((id) => !current.has(id));
    if (gone.length > 3) {
      console.warn(`blog: ${gone.length} posts are not in the outbox; no Delete sent`);
    } else {
      for (const id of gone) {
        enqueue({ id: `${id}#delete`, type: 'Delete', actor: BLOG.actor, ...audience, object: { id, type: 'Tombstone' } }, inboxes);
        db.prepare('DELETE FROM posts WHERE object = ?').run(id);
        changes.deleted++;
      }
    }
    if (changes.created || changes.updated || changes.deleted) await processQueue();
    return { result: changes };
  }
});
