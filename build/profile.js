// Makes the profile card at the top of the home page from src/cv.md (name, tagline, summary,
// contact data) and src/timeline.md (current job). The card is the representative h-card of the
// site: Bridgy Fed makes the fediverse profile from it (see README.md, "Fediverse").
const fs = require('fs');
const path = require('path');
const { parseCv } = require('./cv');
const { parse: parseTimeline } = require('./timeline');

const SITE = 'https://yasiu.pl/';

const escape = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Path of a file in src/static as a URL of the site.
const siteUrl = (file) => './' + path.relative(path.join('src', 'static'), file).split(path.sep).join('/');

function renderProfile(cvFile, timelineFile) {
  const h = parseCv(fs.readFileSync(cvFile, 'utf8'), path.basename(cvFile)).header.fields;
  const timeline = parseTimeline(fs.readFileSync(timelineFile, 'utf8'), path.basename(timelineFile));
  const job = timeline.find((t) => t.type === 'work' && t.end === 'now');
  const [, mastodonUser, mastodonHost] = (h.mastodon || '').split('@');

  // [label, shown text, URL, extra attributes]
  const contacts = [
    h.email && ['Email', h.email, `mailto:${h.email}?subject=Website%20Contact%20Form`, ' class="u-email"'],
    h.linkedin && ['LinkedIn', `in/${h.linkedin}`, `https://www.linkedin.com/in/${h.linkedin}`, ' rel="me"'],
    h.github && ['GitHub', `@${h.github}`, `https://github.com/${h.github}`, ' rel="me"'],
    h.mastodon && ['Mastodon', h.mastodon, `https://${mastodonHost}/@${mastodonUser}`, ' rel="me"'],
    h.instagram && ['Instagram', `@${h.instagram}`, `https://www.instagram.com/${h.instagram}/`, ' rel="me"'],
    h.twitter && ['Twitter', `@${h.twitter}`, `https://twitter.com/${h.twitter}`, ' rel="me"'],
    h.telegram && ['Telegram', `@${h.telegram}`, `https://t.me/${h.telegram}`, ' rel="me"']
  ].filter(Boolean);

  const contactList = contacts.map(([label, text, url, attrs]) => `
                  <li><a${attrs} href="${escape(url)}"${/^https?:/.test(url) ? ' target="_blank"' : ''}><span class="profile-label">${escape(label)}</span><span class="profile-value">${escape(text)}</span></a></li>`).join('');

  return `<div class="card profile-card h-card">
              <div class="profile-cover" style="background-image: url('${escape(siteUrl(h.background))}')" role="img" aria-label="New Zealand, photographed from orbit by OPS-SAT"></div>
              <div class="card-content">
                <img class="profile-photo u-photo" src="${escape(siteUrl(h.photo))}" alt="${escape(h.name)}" width="160" height="160">
                <div class="profile-head">
                  <h1 class="profile-name"><span class="p-name">${escape(h.name)}</span> <a class="u-url u-uid" href="${SITE}" aria-label="yasiu.pl">🅨</a></h1>
                  <p class="profile-tagline">${escape(h['tagline-en'] || '')}</p>${job ? `
                  <p class="profile-job"><span class="p-job-title">${escape(job.title)}</span> · <span class="p-org">${escape(job.org)}</span></p>` : ''}
                </div>
                <!-- Bridgy Fed: the fediverse handle is @yasiu@yasiu.pl, not @yasiu.pl@yasiu.pl. -->
                <a class="u-url" href="acct:yasiu@yasiu.pl" hidden></a>
                <p class="profile-summary p-note">${escape(h['summary-en'] || '')}</p>
              </div>
              <div class="profile-contact">
                <ul class="profile-links">${contactList}
                </ul>
                <a class="btn profile-cv" href="/cv/Marcin_Jasiukowicz_CV.pdf">Download CV</a>
              </div>
            </div>`;
}

module.exports = { renderProfile };
