// The delivery queue of the actor @blog@yasiu.pl. Each activity goes to each inbox as one row.
// The task blog:deliver sends the rows that are due. A failed delivery waits longer each time
// (1 min, 2 min, 4 min ... up to 6 hours) and stops after about three days.
const MAX_ATTEMPTS = 16;
const MAX_WAIT = 6 * 3600 * 1000;

// The inboxes of all followers. Followers on the same server share one inbox.
export function followerInboxes() {
  return apDb().prepare('SELECT DISTINCT COALESCE(shared_inbox, inbox) AS inbox FROM followers').all().map((r) => r.inbox);
}

export function enqueue(activity, inboxes) {
  const db = apDb();
  const body = JSON.stringify({ '@context': 'https://www.w3.org/ns/activitystreams', ...activity });
  const insert = db.prepare('INSERT INTO deliveries (inbox, body, next_at, created_at) VALUES (?, ?, ?, ?)');
  const now = Date.now();
  return [...new Set(inboxes)].map((inbox) => Number(insert.run(inbox, body, now, now).lastInsertRowid));
}

async function send(row) {
  const db = apDb();
  let status;
  let error;
  try {
    status = await apPost(row.inbox, row.body);
  } catch (e) {
    error = e.message;
  }
  if (status >= 200 && status < 300) {
    db.prepare('DELETE FROM deliveries WHERE id = ?').run(row.id);
    return true;
  }
  // 410 Gone: the server or the account does not exist any more. The followers there go too.
  // Other 4xx answers (except 408 and 429) do not change on the next attempt.
  const permanent = status && status >= 400 && status < 500 && status !== 408 && status !== 429;
  if (status === 410) db.prepare('DELETE FROM followers WHERE inbox = ? OR shared_inbox = ?').run(row.inbox, row.inbox);
  const attempts = row.attempts + 1;
  if (permanent || attempts >= MAX_ATTEMPTS) {
    console.warn(`blog: delivery to ${row.inbox} dropped after ${attempts} attempt(s): ${error || status}`);
    db.prepare('DELETE FROM deliveries WHERE id = ?').run(row.id);
    return false;
  }
  db.prepare('UPDATE deliveries SET attempts = ?, next_at = ?, last_error = ? WHERE id = ?')
    .run(attempts, Date.now() + Math.min(60000 * 2 ** row.attempts, MAX_WAIT), error || String(status), row.id);
  return false;
}

// Sends the rows that are due, five at a time.
export async function processQueue({ ids, limit = 200 } = {}) {
  const db = apDb();
  const rows = ids
    ? ids.map((id) => db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id)).filter(Boolean)
    : db.prepare('SELECT * FROM deliveries WHERE next_at <= ? ORDER BY id LIMIT ?').all(Date.now(), limit);
  let sent = 0;
  for (let i = 0; i < rows.length; i += 5) {
    const results = await Promise.all(rows.slice(i, i + 5).map(send));
    sent += results.filter(Boolean).length;
  }
  return { due: rows.length, sent };
}
