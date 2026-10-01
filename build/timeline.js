// Turns src/timeline.md (plus the blog posts) into the timeline section of the home page.
// Format: see the top of src/timeline.md.
const fs = require('fs');

const FIELDS = ['type', 'org', 'start', 'end', 'place', 'url', 'text'];
const TYPES = {
  work: { label: 'Work', icon: '💼' },
  education: { label: 'Education', icon: '🎓' },
  org: { label: 'Community', icon: '🤝' },
  project: { label: 'Project', icon: '🛠️' },
  talk: { label: 'Talk', icon: '🎤' },
  award: { label: 'Award', icon: '🏆' },
  cert: { label: 'Certificate', icon: '📜' },
  post: { label: 'Blog post', icon: '📝' }
};
const DATE = /^\d{4}(-\d{2}){0,2}$/;
const OPEN_YEARS = 3;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const escape = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function parse(markdown, file) {
  const entries = [];
  let current = null;
  markdown.split(/\r?\n/).forEach((line, i) => {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = { title: heading[1], line: i + 1 };
      entries.push(current);
      return;
    }
    const field = line.match(/^\s*[-*]\s+([a-z]+)\s*:\s*(.+?)\s*$/);
    if (current && field) {
      if (!FIELDS.includes(field[1])) {
        throw new Error(`${file}:${i + 1}: unknown field "${field[1]}" (use ${FIELDS.join(', ')})`);
      }
      current[field[1]] = field[2];
    }
  });
  for (const e of entries) {
    const where = `${file}:${e.line}: "${e.title}"`;
    if (!TYPES[e.type] || e.type === 'post') throw new Error(`${where} type must be one of ${Object.keys(TYPES).filter((t) => t !== 'post').join(', ')}`);
    if (!DATE.test(e.start || '')) throw new Error(`${where} start must be YYYY, YYYY-MM or YYYY-MM-DD`);
    if (e.end && e.end !== 'now' && !DATE.test(e.end)) throw new Error(`${where} end must be YYYY-MM or "now"`);
  }
  return entries;
}

function showDate(d) {
  if (d === 'now') return 'present';
  const [y, m] = d.split('-');
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}

function period(e) {
  if (!e.end) return showDate(e.start);
  return `${showDate(e.start)} – ${showDate(e.end)}`;
}

function item(e) {
  const t = TYPES[e.type];
  const title = e.url
    ? `<a href="${escape(e.url)}"${/^https?:/.test(e.url) ? ' target="_blank" rel="noopener"' : ''}>${escape(e.title)}</a>`
    : escape(e.title);
  const org = [e.org, e.place].filter(Boolean).map(escape).join(' · ');
  const lang = e.lang && e.lang !== 'en' ? ` lang="${escape(e.lang)}"` : '';
  return `<li class="tl-item" data-type="${e.type}">
                <span class="tl-icon" aria-hidden="true">${t.icon}</span>
                <div class="tl-body">
                  <div class="tl-meta"><span class="tl-type">${t.label}</span> · <time datetime="${escape(e.start)}">${period(e)}</time></div>
                  <h4 class="tl-title"${lang}>${title}</h4>${org ? `
                  <div class="tl-org">${org}</div>` : ''}${e.text ? `
                  <p>${escape(e.text)}</p>` : ''}
                </div>
              </li>`;
}

// Entries from src/timeline.md and the blog, newest first, grouped by the year they start.
function renderTimeline(file, posts) {
  const entries = parse(fs.readFileSync(file, 'utf8'), file).concat(posts.map((p) => ({
    type: 'post', title: p.title, start: p.date.slice(0, 10), url: p.url, lang: p.lang
  })));
  entries.sort((a, b) => (a.start < b.start ? 1 : a.start > b.start ? -1 : 0));
  const years = new Map();
  for (const e of entries) {
    const y = e.start.slice(0, 4);
    if (!years.has(y)) years.set(y, []);
    years.get(y).push(e);
  }
  const used = Object.keys(TYPES).filter((t) => entries.some((e) => e.type === t));
  const filters = [`<button type="button" class="tl-filter" data-filter="all" aria-pressed="true">All</button>`]
    .concat(used.map((t) => `<button type="button" class="tl-filter" data-filter="${t}" aria-pressed="false">${TYPES[t].label}</button>`));
  const groups = [...years].map(([y, list], i) => `<details class="tl-year"${i < OPEN_YEARS ? ' open' : ''}>
            <summary>${y} <span class="tl-count">${list.length}</span></summary>
            <ol class="tl-list">
              ${list.map(item).join('\n              ')}
            </ol>
          </details>`);
  return `<div class="tl-filters" role="group" aria-label="Show">
          ${filters.join('\n          ')}
        </div>
        <div class="tl-years">
          ${groups.join('\n          ')}
        </div>`;
}

module.exports = { parse, renderTimeline };
