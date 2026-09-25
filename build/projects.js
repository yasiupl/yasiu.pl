// Turns src/projects.md into the project card HTML at build time.
// Format: see the top of src/projects.md.
const fs = require('fs');

const FIELDS = ['url', 'label', 'image', 'embed'];

const escape = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function parse(markdown, file) {
  const projects = [];
  let current = null;
  markdown.split(/\r?\n/).forEach((line, i) => {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = { title: heading[1], line: i + 1 };
      projects.push(current);
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
  for (const p of projects) {
    for (const required of ['url', 'image']) {
      if (!p[required]) throw new Error(`${file}:${p.line}: "${p.title}" has no ${required}`);
    }
    if (!/^https?:\/\//.test(p.url)) throw new Error(`${file}:${p.line}: "${p.title}" url must start with http(s)://`);
    if (!fs.existsSync(`src/static/assets/${p.image}`)) {
      throw new Error(`${file}:${p.line}: "${p.title}" image src/static/assets/${p.image} not found`);
    }
    p.label = p.label || p.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  return projects;
}

function card(p) {
  const image = `<img src="./assets/${escape(p.image)}" alt="" loading="lazy">`;
  const title = `<span class="card-title">${escape(p.title)}</span>`;
  const link = `target="_blank" rel="noopener"`;
  // Materialize card markup, one grid column per project.
  if (p.embed) {
    return `<div class="col s12 m4">
            <div class="card is-link">
              <div class="card-image">
                ${image}
                <iframe src="${escape(p.embed)}" title="${escape(p.title)}" loading="lazy" allowfullscreen></iframe>
              </div>
              <div class="card-content">
                ${title}
                <a class="card-link" href="${escape(p.url)}" ${link}>${escape(p.label)}</a>
              </div>
            </div>
          </div>`;
  }
  return `<div class="col s12 m4">
            <a class="card is-link" href="${escape(p.url)}" ${link}>
              <div class="card-image">
                ${image}
              </div>
              <div class="card-content">
                ${title}
                <span class="card-link">${escape(p.label)}</span>
              </div>
            </a>
          </div>`;
}

function renderProjects(file) {
  return parse(fs.readFileSync(file, 'utf8'), file).map(card).join('\n          ');
}

module.exports = { parse, renderProjects };
