// The inbox of the actor @blog@yasiu.pl (see README.md, "Fediverse"). Other servers send their
// activities here: follows, replies to the posts, likes and boosts, and their changes and deletions.
// Each request must have a valid HTTP signature of the actor of the activity.
const MAX_BODY = 1024 * 1024;
const PUBLIC = [AS_PUBLIC, 'as:Public', 'Public'];

// The slug of a post from the address of its object or of its page, else null.
function slugOf(id) {
  if (!id) return null;
  const match = id.startsWith(BLOG.objects) ? id.slice(BLOG.objects.length).match(/^([a-z0-9-]+)\.json$/)
    : id.startsWith(`${BLOG.site}/blog/`) ? id.slice(BLOG.site.length).match(/^\/blog\/([a-z0-9-]+)\/?$/) : null;
  return match ? match[1] : null;
}

// The slug of the post that a reply belongs to: a reply to the post, or a reply in its thread.
function threadSlug(inReplyTo) {
  return slugOf(inReplyTo) || apDb().prepare('SELECT slug FROM replies WHERE id = ?').get(inReplyTo)?.slug || null;
}

const hostOf = (url) => { try { return new URL(url).host; } catch { return null; } };
// An actor may only write objects on its own server.
const sameServer = (id, actorId) => Boolean(id) && hostOf(id) === hostOf(actorId);

const isPublic = (object) => [].concat(object.to || [], object.cc || []).some((a) => PUBLIC.includes(idOf(a)));

async function objectOf(value) {
  return typeof value === 'string' ? apGet(value) : value;
}

async function follow(activity, actorId) {
  if (idOf(activity.object) !== BLOG.actor) return;
  const actor = await remoteActor(actorId);
  apDb().prepare(`INSERT INTO followers (actor, inbox, shared_inbox, follow_id, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (actor) DO UPDATE SET inbox = excluded.inbox, shared_inbox = excluded.shared_inbox, follow_id = excluded.follow_id`)
    .run(actorId, actor.inbox, actor.endpoints?.sharedInbox || null, activity.id || null, Date.now());
  const ids = enqueue({
    id: `${BLOG.actor}#accept/${encodeURIComponent(activity.id || actorId)}`,
    type: 'Accept',
    actor: BLOG.actor,
    object: activity
  }, [actor.inbox]);
  // Send the answer at once. If it fails, the queue sends it again later.
  await processQueue({ ids }).catch(() => {});
}

async function storeReply(object, actorId) {
  if (idOf(object.attributedTo) !== actorId || !sameServer(object.id, actorId) || !isPublic(object)) return;
  const inReplyTo = idOf(object.inReplyTo);
  const slug = threadSlug(inReplyTo);
  if (!slug) return;
  await remoteActor(actorId).catch(() => {}); // The name and the avatar for the post page.
  apDb().prepare(`INSERT INTO replies (id, slug, in_reply_to, actor, url, published, updated, summary, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET updated = excluded.updated, summary = excluded.summary, content = excluded.content
    WHERE replies.actor = excluded.actor`)
    .run(object.id, slug, inReplyTo, actorId, idOf([].concat(object.url || object.id)[0]) || object.id,
      object.published || new Date().toISOString(), object.updated || null,
      object.summary ? plainText(object.summary) : null, sanitizeReply(object.content));
}

async function handle(activity, actorId) {
  const db = apDb();
  const type = activity.type;
  if (type === 'Follow') return follow(activity, actorId);

  if (type === 'Like' || type === 'Announce') {
    const slug = slugOf(idOf(activity.object));
    if (!slug || !sameServer(activity.id, actorId)) return;
    db.prepare('INSERT OR IGNORE INTO reactions (id, kind, actor, slug, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(activity.id, type === 'Like' ? 'like' : 'boost', actorId, slug, Date.now());
    return;
  }

  if (type === 'Undo') {
    const inner = activity.object;
    const innerId = idOf(inner);
    if (!inner || (typeof inner === 'object' && inner.type === 'Follow')) {
      db.prepare('DELETE FROM followers WHERE actor = ?').run(actorId);
    } else if (innerId) {
      db.prepare('DELETE FROM reactions WHERE id = ? AND actor = ?').run(innerId, actorId);
      db.prepare('DELETE FROM followers WHERE actor = ? AND follow_id = ?').run(actorId, innerId);
    }
    return;
  }

  if (type === 'Create' || type === 'Update') {
    const object = await objectOf(activity.object);
    if (!object) return;
    if (idOf(object) === actorId) { // A changed profile.
      await remoteActor(actorId, { fresh: true }).catch(() => {});
      return;
    }
    if (type === 'Update' && !db.prepare('SELECT 1 FROM replies WHERE id = ?').get(object.id)) return;
    return storeReply(object, actorId);
  }

  if (type === 'Delete') {
    const id = idOf(activity.object);
    if (id === actorId) { // A deleted account.
      for (const table of ['followers', 'replies', 'reactions']) db.prepare(`DELETE FROM ${table} WHERE actor = ?`).run(actorId);
      db.prepare('DELETE FROM actors WHERE id = ?').run(actorId);
    } else if (id) {
      db.prepare('DELETE FROM replies WHERE id = ? AND actor = ?').run(id, actorId);
    }
  }
}

export default defineEventHandler(async (event) => {
  const body = (await readRawBody(event, 'utf8')) || '';
  if (body.length > MAX_BODY) throw createError({ statusCode: 413, statusMessage: 'Too large' });
  let activity;
  try {
    activity = JSON.parse(body);
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Not JSON' });
  }
  const actorId = idOf(activity.actor);
  if (!actorId) throw createError({ statusCode: 400, statusMessage: 'No actor' });

  // A deleted account: its server sends the deletion to all servers it knows, and the key of the
  // account is gone. Without data of that account here, there is nothing to check or to delete.
  if (activity.type === 'Delete' && idOf(activity.object) === actorId &&
      !apDb().prepare('SELECT 1 FROM actors WHERE id = ?').get(actorId)) {
    setResponseStatus(event, 202);
    return '';
  }

  const signer = await verifyRequest(event, body);
  if (signer !== actorId) throw createError({ statusCode: 401, statusMessage: 'The signer is not the actor' });
  try {
    await handle(activity, actorId);
  } catch (error) {
    console.warn(`blog: ${activity.type} from ${actorId}: ${error.message}`);
  }
  setResponseStatus(event, 202);
  return '';
});
