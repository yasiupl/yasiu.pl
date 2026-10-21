// Makes the profile card at the top of the home page from src/cv.md (name, tagline, summary,
// contact data) and src/timeline.md (current job). The card is the representative h-card of the
// site.
const fs = require('fs');
const path = require('path');
const { parseCv } = require('./cv');
const { parse: parseTimeline } = require('./timeline');

const SITE = 'https://yasiu.pl/';

const escape = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Path of a file in src/static as a URL of the site.
const siteUrl = (file) => './' + path.relative(path.join('src', 'static'), file).split(path.sep).join('/');

function load(cvFile, timelineFile) {
  const h = parseCv(fs.readFileSync(cvFile, 'utf8'), path.basename(cvFile)).header.fields;
  const timeline = parseTimeline(fs.readFileSync(timelineFile, 'utf8'), path.basename(timelineFile));
  const job = timeline.find((t) => t.type === 'work' && t.end === 'now');
  const [, mastodonUser, mastodonHost] = (h.mastodon || '').split('@');

  // [label, shown text, URL, extra attributes]
  const contacts = [
    h.email && ['Email', h.email, `mailto:${h.email}?subject=Website%20Contact%20Form`, ' class="u-email"'],
    h.linkedin && ['LinkedIn', `in/${h.linkedin}`, `https://www.linkedin.com/in/${h.linkedin}`, ' rel="me"'],
    h.github && ['GitHub', `@${h.github}`, `https://github.com/${h.github}`, ' rel="me"'],
    h.youtube && ['YouTube', 'yasiu.pl/youtube', `https://www.youtube.com/channel/${h.youtube}`, ' rel="me"'],
    h.mastodon && ['Mastodon', h.mastodon, `https://${mastodonHost}/@${mastodonUser}`, ' rel="me"'],
    h.bluesky && ['Bluesky', `@${h.bluesky}`, `https://bsky.app/profile/${h.bluesky}`, ' rel="me"'],
    h.instagram && ['Instagram', `@${h.instagram}`, `https://www.instagram.com/${h.instagram}/`, ' rel="me"'],
    h.twitter && ['Twitter', `@${h.twitter}`, `https://twitter.com/${h.twitter}`, ' rel="me"'],
    h.telegram && ['Telegram', `@${h.telegram}`, `https://t.me/${h.telegram}`, ' rel="me"']
  ].filter(Boolean);

  // The public keys. /pgp.pub and /ssh.pub send to the keys on Keybase and GitHub (nitro.config.mjs).
  // [label, shown text, URL, extra attributes]
  const fingerprint = (h.pgp || '').toUpperCase().replace(/\s/g, '').replace(/(.{4})(?!$)/g, '$1 ');
  const keys = [
    h.pgp && ['PGP', fingerprint, '/pgp.pub', ' class="u-key profile-fingerprint"'],
    h.github && ['SSH', `github.com/${h.github}.keys`, '/ssh.pub', ''],
    // Keyoxide shows the identity proofs in the key. It gets the key from the WKD (build/keys.js).
    h.pgp && h.email && ['Keyoxide', h.email, `https://keyoxide.org/wkd/${encodeURIComponent(h.email)}`, ' rel="me"'],
    h.keybase && ['Keybase', `keybase.io/${h.keybase}`, `https://keybase.io/${h.keybase}`, ' rel="me"']
  ].filter(Boolean);
  return { h, job, contacts, keys };
}

function renderProfile(cvFile, timelineFile) {
  const { h, job, contacts, keys } = load(cvFile, timelineFile);
  const contactList = contacts.map(([label, text, url, attrs]) => `
                  <li><a${attrs} href="${escape(url)}"${/^https?:/.test(url) ? ' target="_blank"' : ''}><span class="profile-label">${escape(label)}</span><span class="profile-value">${escape(text)}</span></a></li>`).join('');
  const keyList = keys.map(([label, text, url, attrs]) => `
                  <li><span class="profile-label">${escape(label)}</span> <a${attrs} href="${escape(url)}"${/^https?:/.test(url) ? ' target="_blank"' : ''}>${escape(text)}</a></li>`).join('');

  return `<div class="card profile-card h-card">
              <div class="profile-cover" style="background-image: url('${escape(siteUrl(h.background))}')" role="img" aria-label="New Zealand, photographed from orbit by OPS-SAT"></div>
              <div class="card-content">
                <img class="profile-photo u-photo" src="${escape(siteUrl(h.photo))}" alt="${escape(h.name)}" width="160" height="160">
                <div class="profile-head">
                  <h1 class="profile-name"><span class="p-name">${escape(h.name)}</span> <a class="u-url u-uid" href="${SITE}" aria-label="yasiu.pl">🅨</a></h1>
                  <p class="profile-tagline">${escape(h['tagline-en'] || '')}</p>${job ? `
                  <p class="profile-job"><span class="p-job-title">${escape(job.title)}</span> · <span class="p-org">${escape(job.org)}</span></p>` : ''}
                </div>
                <p class="profile-summary p-note">${escape(h['summary-en'] || '')}</p>
              </div>
              <div class="profile-contact">
                <ul class="profile-links">${contactList}
                </ul>
              </div>${keyList ? `
              <div class="profile-keys">
                <ul>${keyList}
                </ul>
              </div>` : ''}
            </div>`;
}

// The data of the author card under each blog post (authorCard in build/blog.js).
function authorData(cvFile, timelineFile) {
  const { h, job } = load(cvFile, timelineFile);
  return {
    name: h.name,
    photo: siteUrl(h.photo).replace(/^\./, ''),
    tagline: { en: h['tagline-en'] || '', pl: h['tagline-pl'] || h['tagline-en'] || '' },
    job: job && {
      en: `${job.title} · ${job.org}`,
      pl: `${job['title-pl'] || job.title} · ${job.org}`
    }
  };
}

// The same data for search engines: a schema.org Person in JSON-LD. "sameAs" are the profiles
// on other sites.
function renderProfileJsonLd(cvFile, timelineFile) {
  const { h, job, contacts } = load(cvFile, timelineFile);
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: h.name,
    url: SITE,
    image: new URL(siteUrl(h.photo), SITE).href,
    description: h['summary-en'],
    ...(job && { jobTitle: job.title, worksFor: { '@type': 'Organization', name: job.org } }),
    sameAs: contacts.map((c) => c[2]).filter((url) => /^https:/.test(url))
  };
  // "<" in a string would end the <script> element.
  return `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`;
}

module.exports = { renderProfile, renderProfileJsonLd, authorData };
