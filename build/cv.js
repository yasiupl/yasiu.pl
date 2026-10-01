// Makes the CV (LaTeX and PDF) from src/cv.md and src/timeline.md.
// Usage: node build/cv.js [--tex-only]
// Format of src/cv.md: see the top of that file.
const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const { parse: parseTimeline } = require('./timeline');

const ROOT = path.join(__dirname, '..');
const CV_FILE = path.join(ROOT, 'src', 'cv.md');
const TIMELINE_FILE = path.join(ROOT, 'src', 'timeline.md');
const OUT_DIR = path.join(ROOT, 'build', 'cv-out');
const NAME = 'Marcin_Jasiukowicz_CV';
const PDF = path.join(ROOT, 'src', 'static', 'cv', `${NAME}.pdf`);
const CARD_PDF = path.join(ROOT, 'src', 'static', 'cv', 'Marcin_Jasiukowicz_card.pdf');

const LISTS = ['from', 'en', 'pl']; // Fields that can occur more than one time.
const ENTRY_PARTS = ['work', 'projects', 'education', 'awards'];
const ITEM_PARTS = ['skills', 'certificates', 'languages', 'learning'];
const PARTS = ['header', ...ENTRY_PARTS, ...ITEM_PARTS];

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pl: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
};
const WORDS = {
  en: {
    now: 'present', work: 'I’ve worked for:', projects: 'I’ve worked on:', education: 'I’ve studied at:',
    awards: 'Awards:', contact: 'Contact me:', skills: 'I’m good with:', certificates: 'I’ve been certified in:',
    languages: 'I speak:', learning: 'I want to learn:', phone: 'Phone', email: 'Email', website: 'Website',
    generated: (date) => `This CV is generated from the data on yasiu.pl. Last change: ${date}.`
  },
  pl: {
    now: 'obecnie', work: 'Pracowałem na rzecz:', projects: 'Pracowałem nad:', education: 'Studiowałem na:',
    awards: 'Wyróżnienia:', contact: 'Dane kontaktowe:', skills: 'Umiejętności:', certificates: 'Certyfikaty:',
    languages: 'Języki:', learning: 'Chcę się nauczyć:', phone: 'Telefon', email: 'Email', website: 'WWW',
    generated: (date) => `To CV powstaje automatycznie z danych na stronie yasiu.pl. Ostatnia zmiana: ${date}.`
  }
};
// Default Polish names of places, for entries without place-pl.
const PLACES_PL = [[/\bPoland\b/g, 'Polska'], [/\bGermany\b/g, 'Niemcy'], [/\bWarsaw\b/g, 'Warszawa'], [/\bremote\b/g, 'zdalnie']];

function parseCv(markdown, file) {
  const cv = {};
  let part = null;
  let entry = null;
  markdown.split(/\r?\n/).forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    const field = line.match(/^\s*[-*]\s+([a-z-]+)\s*:\s*(.+?)\s*$/);
    if (h3) {
      if (!part || !ENTRY_PARTS.includes(part.name)) throw new Error(`${where}: "###" entries are only allowed in ${ENTRY_PARTS.join(', ')}`);
      entry = { heading: h3[1], line: i + 1, from: [], en: [], pl: [] };
      part.entries.push(entry);
    } else if (h2) {
      if (!PARTS.includes(h2[1])) throw new Error(`${where}: unknown part "${h2[1]}" (use ${PARTS.join(', ')})`);
      part = { name: h2[1], entries: [], items: [], fields: {} };
      cv[part.name] = part;
      entry = null;
    } else if (field && part) {
      const [, key, value] = field;
      if (entry) {
        if (LISTS.includes(key)) entry[key].push(value);
        else entry[key] = value;
      } else if (ITEM_PARTS.includes(part.name)) {
        if (key !== 'en' && key !== 'pl') throw new Error(`${where}: use "en" or "pl" in ${part.name}`);
        part.items.push({ lang: key, text: value });
      } else {
        part.fields[key] = value;
      }
    }
  });
  for (const name of ['header', 'work', 'education']) {
    if (!cv[name]) throw new Error(`${file}: the part "${name}" is missing`);
  }
  return cv;
}

// Sort key for timeline dates: YYYY, YYYY-MM or YYYY-MM-DD.
const key = (d) => (d === 'now' ? '9999' : d);

function resolve(entry, timeline, file) {
  const where = `${file}:${entry.line}: "${entry.heading}"`;
  if (!entry.from.length) throw new Error(`${where} needs at least one "from"`);
  const sources = entry.from.map((title) => {
    const found = timeline.filter((t) => t.title === title);
    if (found.length !== 1) throw new Error(`${where}: "${title}" matches ${found.length} entries in src/timeline.md, it must match one`);
    return found[0];
  });
  const start = sources.map((s) => s.start).sort((a, b) => key(a).localeCompare(key(b)))[0];
  const ends = sources.map((s) => s.end).filter(Boolean);
  const end = ends.length ? ends.sort((a, b) => key(b).localeCompare(key(a)))[0] : null;
  return { ...entry, sources, start, end };
}

const tex = (s) => String(s)
  .replace(/\\/g, '\\textbackslash{}')
  .replace(/([{}$&#%_])/g, '\\$1')
  .replace(/\^/g, '\\textasciicircum{}')
  .replace(/~/g, '\\textasciitilde{}')
  .replace(/"([^"]*)"/g, '“$1”')
  .replace(/ - /g, ' – ')
  .replace(EMOJI, (e) => `\\cvemoji{${emojiFile(e)}}`);

// The fonts of the CV have no emoji. The CV shows an emoji as an image from src/cv/emoji/
// (Noto Emoji, Apache License 2.0), with the name emoji_u<code point>.png.
const EMOJI_DIR = path.join(ROOT, 'src', 'cv', 'emoji');
const EMOJI = /\p{Extended_Pictographic}️?/gu;
function emojiFile(e) {
  const name = `emoji_u${e.codePointAt(0).toString(16)}.png`;
  if (!fs.existsSync(path.join(EMOJI_DIR, name))) {
    throw new Error(`cv: no image for the emoji ${e}. Add ${name} from https://github.com/googlefonts/noto-emoji/tree/main/2D/png/512 to src/cv/emoji/`);
  }
  return name;
}

function showDate(d, lang) {
  if (d === 'now') return WORDS[lang].now;
  const [y, m] = d.split('-');
  return m ? `${MONTHS[lang][Number(m) - 1]} ${y}` : y;
}

function period(e, lang) {
  if (!e.end) return showDate(e.start, lang);
  return `${showDate(e.start, lang)} – ${showDate(e.end, lang)}`;
}

function placePl(place) {
  return PLACES_PL.reduce((s, [from, to]) => s.replace(from, to), place);
}

function entryTex(e, lang) {
  const first = e.sources[0];
  const org = lang === 'pl' ? (e['org-pl'] || e['org-en'] || e.heading) : (e['org-en'] || e.heading);
  const role = lang === 'pl' ? (e['role-pl'] || e['role-en'] || first.title) : (e['role-en'] || first.title);
  const placeEn = e['place-en'] || first.place || '';
  const place = lang === 'pl' ? (e['place-pl'] || placePl(placeEn)) : placeEn;
  const meta = [period(e, lang), place].filter(Boolean).map(tex).join(' \\textbar{} ');
  const bullets = e[lang].length
    ? `\n\\begin{cvlist}\n${e[lang].map((b) => `  \\item ${tex(b)}`).join('\n')}\n\\end{cvlist}`
    : '';
  return `\\cventry{${tex(org)}}{${tex(role)}}{${meta}}${bullets}`;
}

function awardTex(e, lang) {
  const first = e.sources[0];
  const name = lang === 'pl' ? (e.pl[0] || e.en[0] || first.title) : (e.en[0] || first.title);
  const org = lang === 'pl' ? (e['org-pl'] || first.org) : (e['org-en'] || first.org);
  const meta = [org, e.start.slice(0, 4)].filter(Boolean).map(tex).join(', ');
  return `\\cvaward{${tex(name)}}{${meta}}`;
}

function contactTex(h, w) {
  const rows = [
    h.phone && [w.phone, h.phone, `tel:${h.phone.replace(/\s/g, '')}`],
    h.email && [w.email, h.email, `mailto:${h.email}`],
    h.website && [w.website, h.website, `https://${h.website}/`],
    h.linkedin && ['LinkedIn', `in/${h.linkedin}`, `https://www.linkedin.com/in/${h.linkedin}`],
    h.github && ['GitHub', `@${h.github}`, `https://github.com/${h.github}`],
    h.mastodon && ['Mastodon', h.mastodon, (() => { const [, user, host] = h.mastodon.split('@'); return `https://${host}/@${user}`; })()]
  ].filter(Boolean);
  return rows.map(([label, text, url]) => `\\cvcontact{${tex(label)}}{${url.replace(/([%#])/g, '\\$1')}}{${tex(text)}}`).join('\n');
}

function itemsTex(part, lang) {
  if (!part) return '';
  const items = part.items.filter((i) => i.lang === lang);
  return `\\begin{cvlist}\n${items.map((i) => `  \\item ${tex(i.text)}`).join('\n')}\n\\end{cvlist}`;
}

function pageTex(cv, lang, changed) {
  const w = WORDS[lang];
  const h = cv.header.fields;
  const main = ['work', 'projects', 'education']
    .filter((p) => cv[p] && cv[p].entries.length)
    .map((p) => `\\cvsection{${tex(w[p])}}\n${cv[p].entries.map((e) => entryTex(e, lang)).join('\n\n')}`)
    .join('\n\n');
  const awards = cv.awards && cv.awards.entries.length
    ? `\\cvsection{${tex(w.awards)}}\n${cv.awards.entries.map((e) => awardTex(e, lang)).join('\n')}`
    : '';
  const side = [
    `\\cvsection{${tex(w.contact)}}\n${contactTex(h, w)}`,
    ...ITEM_PARTS.filter((p) => cv[p]).map((p) => `\\cvsection{${tex(w[p])}}\n${itemsTex(cv[p], lang)}`)
  ].join('\n\n');
  return `\\cvheader{${tex(h.name)}}{${tex(h[`tagline-${lang}`] || h['tagline-en'] || '')}}
\\begin{paracol}{2}
${main}

${awards}
\\switchcolumn
${side}
\\end{paracol}
\\vfill
{\\scriptsize\\color{muted} ${tex(h[`consent-${lang}`] || '')}\\par
${tex(w.generated(changed[lang]))}\\par}`;
}

// The images of the header and of the business card, copied next to the .tex file.
const IMAGES = { photo: 'cv-photo', background: 'cv-background', 'card-background': 'card-background' };
const imageName = (h, field) => IMAGES[field] + path.extname(h[field]).toLowerCase();

function documentTex(cv, changed) {
  const h = cv.header.fields;
  const PHOTO = imageName(h, 'photo');
  const BACKGROUND = imageName(h, 'background');
  return `% Generated by build/cv.js from src/cv.md and src/timeline.md. Do not edit.
\\documentclass[10pt]{article}
\\usepackage[a4paper,top=10mm,bottom=8mm,left=13mm,right=13mm]{geometry}
\\usepackage{fontspec}
\\usepackage[default]{sourcesanspro}
\\usepackage{xcolor}
\\usepackage{paracol}
\\usepackage{enumitem}
\\usepackage{graphicx}
\\usepackage{tikz}
\\usepackage[hidelinks,pdfauthor={${tex(cv.header.fields.name)}},pdftitle={${tex(cv.header.fields.name)} – CV}]{hyperref}
\\definecolor{accent}{HTML}{FF4F00}
\\definecolor{muted}{HTML}{5F6368}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\raggedright
\\linespread{0.96}
\\columnratio{0.67}
\\setlength{\\columnsep}{16pt}
\\newenvironment{cvlist}{\\begin{itemize}[leftmargin=1em,label={\\color{accent}\\textbullet},nosep,topsep=0pt,after=\\vspace{3pt}]\\small}{\\end{itemize}}
\\newcommand{\\cvsection}[1]{\\vspace{3pt}{\\color{accent}\\large\\bfseries #1}\\par\\vspace{2pt}}
\\newcommand{\\cventry}[3]{{\\bfseries #1} -- #2\\par{\\small\\color{muted} #3}\\par}
\\newcommand{\\cvaward}[2]{{\\small #1} {\\footnotesize\\color{muted}(#2)}\\par\\vspace{1pt}}
\\newcommand{\\cvcontact}[3]{{\\footnotesize\\color{muted} #1}\\par{\\small\\href{#2}{#3}}\\par\\vspace{2pt}}
\\newcommand{\\cvemoji}[1]{\\raisebox{-0.15em}{\\includegraphics[height=1.05em]{#1}}}
% The header: the background photo over the full width of the page, the name, and the round profile photo.
\\newlength{\\cvband}\\setlength{\\cvband}{44mm}
\\newcommand{\\cvheader}[2]{%
\\begin{tikzpicture}[remember picture,overlay]
  \\node[anchor=north west,inner sep=0] at (current page.north west) {\\includegraphics[width=\\paperwidth,height=\\cvband]{${BACKGROUND}}};
  \\fill[black,opacity=0.25] (current page.north west) rectangle ([yshift=-\\cvband]current page.north east);
  \\fill[accent] ([yshift=-\\cvband]current page.north west) rectangle ([yshift=-\\cvband-1.2mm]current page.north east);
  \\node[anchor=south west,inner sep=0,text=white] at ([xshift=13mm,yshift=-25mm]current page.north west) {\\fontsize{28}{32}\\selectfont\\bfseries #1};
  \\node[anchor=north west,inner sep=0,text=white] at ([xshift=13.4mm,yshift=-28mm]current page.north west) {\\large #2};
  \\begin{scope}
    \\clip ([xshift=-33mm,yshift=-22mm]current page.north east) circle (17mm);
    \\node at ([xshift=-33mm,yshift=-22mm]current page.north east) {\\includegraphics[width=34mm]{${PHOTO}}};
  \\end{scope}
  \\draw[white,line width=1.2pt] ([xshift=-33mm,yshift=-22mm]current page.north east) circle (17mm);
\\end{tikzpicture}%
\\vspace*{\\dimexpr\\cvband-10mm-2mm\\relax}\\par}
\\begin{document}
${pageTex(cv, 'en', changed)}
\\newpage
${pageTex(cv, 'pl', changed)}
\\end{document}
`;
}

// The business card: 85 mm × 55 mm, with 3 mm of bleed on each side (for a print shop).
// The front has the background photo, the profile photo, the name, the tagline and the current job.
// The back has the contact data and a QR code: a link to the website, or the full contact (with the phone number) on the private card.
const CARD = { trim: [85, 55], bleed: 3 };

function currentJob(timeline) {
  const job = timeline.find((t) => t.type === 'work' && t.end === 'now');
  return job ? `${job.title} · ${job.org}` : '';
}

const qrText = (s) => s.replace(/([\\{}$&#^_%~])/g, '\\$1');

function cardTex(cv, timeline) {
  const h = cv.header.fields;
  const [tw, th] = CARD.trim;
  const b = CARD.bleed;
  const pw = tw + 2 * b;
  const ph = th + 2 * b;
  const safe = b + 4; // The distance of the text from the edge of the paper, in mm.
  const contacts = [
    ['Email', h.email], ['Web', h.website], h.phone && ['Phone', h.phone],
    ['LinkedIn', h.linkedin && `in/${h.linkedin}`], ['GitHub', h.github && `@${h.github}`], ['Mastodon', h.mastodon]
  ].filter((c) => c && c[1]);
  const column = (list) => list.map(([label, value]) => `{\\fontsize{5}{6}\\selectfont\\color{accent}${tex(label)}}\\\\[-0.5mm]{\\fontsize{7}{8.4}\\selectfont ${tex(value)}}`).join('\\\\[0.6mm]');
  const qr = h.phone
    ? `MECARD:N:${h.name.split(' ').reverse().join(',')};TEL:${h.phone.replace(/\s/g, '')};EMAIL:${h.email};URL:https://${h.website}/;;`
    : `https://${h.website}/`;
  const PHOTO = imageName(h, 'photo');
  const BACKGROUND = imageName(h, 'card-background');
  return `% Generated by build/cv.js from src/cv.md and src/timeline.md. Do not edit.
\\documentclass{article}
\\usepackage[paperwidth=${pw}mm,paperheight=${ph}mm,margin=0mm]{geometry}
\\usepackage{fontspec}
\\usepackage[default]{sourcesanspro}
\\usepackage{xcolor}
\\usepackage{graphicx}
\\usepackage{tikz}
\\usepackage{qrcode}
\\usepackage[hidelinks,pdfauthor={${tex(h.name)}},pdftitle={${tex(h.name)} – business card}]{hyperref}
\\definecolor{accent}{HTML}{FF4F00}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\newcommand{\\cvemoji}[1]{\\raisebox{-0.15em}{\\includegraphics[height=1.05em]{#1}}}
% Trim box and bleed box for the print shop: the card is ${tw} mm × ${th} mm.
\\AddToHook{shipout/background}{\\special{pdf:put @thispage << /TrimBox [${(b * 72 / 25.4).toFixed(2)} ${(b * 72 / 25.4).toFixed(2)} ${((pw - b) * 72 / 25.4).toFixed(2)} ${((ph - b) * 72 / 25.4).toFixed(2)}] /BleedBox [0 0 ${(pw * 72 / 25.4).toFixed(2)} ${(ph * 72 / 25.4).toFixed(2)}] >>}}
\\begin{document}
% Front: the background photo, the profile photo, the name, the tagline and the current job.
\\begin{tikzpicture}[remember picture,overlay,x=1mm,y=-1mm,shift={(current page.north west)}]
  \\node[anchor=north west,inner sep=0] at (0,0) {\\includegraphics[width=${pw}mm,height=${ph}mm]{${BACKGROUND}}};
  \\fill[black,opacity=0.3] (0,0) rectangle (${pw},${ph});
  \\fill[accent] (0,${ph - b - 1.6}) rectangle (${pw},${ph});
  \\begin{scope}
    \\clip (${safe + 13},${ph / 2 - 0.8}) circle (13);
    \\node at (${safe + 13},${ph / 2 - 0.8}) {\\includegraphics[width=26mm]{${PHOTO}}};
  \\end{scope}
  \\draw[white,line width=0.9pt] (${safe + 13},${ph / 2 - 0.8}) circle (13);
  \\node[anchor=south west,inner sep=0,text=white] at (${safe + 30},${ph / 2 - 3}) {\\fontsize{13}{15}\\selectfont\\bfseries ${tex(h.name)}};
  \\node[anchor=north west,inner sep=0,text=white] at (${safe + 30.3},${ph / 2 - 0.6}) {\\fontsize{7.5}{9}\\selectfont ${tex(h['tagline-en'] || '')}};
  \\node[anchor=north west,inner sep=0,text=accent] at (${safe + 30.3},${ph / 2 + 4.6}) {\\fontsize{7}{8.5}\\selectfont\\bfseries ${tex(currentJob(timeline))}};
\\end{tikzpicture}
\\null\\newpage
% Back: the contact data and the QR code.
\\begin{tikzpicture}[remember picture,overlay,x=1mm,y=-1mm,shift={(current page.north west)}]
  \\fill[white] (0,0) rectangle (${pw},${ph});
  \\fill[accent] (0,0) rectangle (${b + 3},${ph});
  \\node[anchor=west,inner sep=0,align=left,text=black] at (${safe + 3},${ph / 2}) {${column(contacts)}};
  \\node[anchor=east,inner sep=0] (qr) at (${pw - safe},${ph / 2 - 2.5}) {\\qrcode[height=30mm,nolink]{${qrText(qr)}}};
  \\node[anchor=north,inner sep=0,text=black!60] at ([yshift=-1.6mm]qr.south) {\\fontsize{5.5}{6.5}\\selectfont ${h.phone ? 'Scan to save my contact' : 'Scan to visit my website'}};
\\end{tikzpicture}
\\null
\\end{document}
`;
}

// The date of the last change of the CV data: the last git commit of the data files,
// or the file dates when the files have changes that are not committed.
function lastChange(files) {
  const mtime = Math.max(...files.map((f) => fs.statSync(f).mtimeMs));
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', ...files], { cwd: ROOT, encoding: 'utf8' }).trim();
    const commit = Number(execFileSync('git', ['log', '-1', '--format=%ct', '--', ...files], { cwd: ROOT, encoding: 'utf8' }).trim()) * 1000;
    if (!dirty && commit) return new Date(commit);
  } catch (e) { /* No git: use the file dates. */ }
  return new Date(mtime);
}

function findTectonic() {
  const candidates = [process.env.TECTONIC, 'tectonic', path.join(ROOT, 'tectonic'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'tectonic', 'tectonic.exe')].filter(Boolean);
  return candidates.find((c) => spawnSync(c, ['--version'], { stdio: 'ignore' }).status === 0);
}

function main() {
  const timeline = parseTimeline(fs.readFileSync(TIMELINE_FILE, 'utf8'), 'src/timeline.md');
  const cv = parseCv(fs.readFileSync(CV_FILE, 'utf8'), 'src/cv.md');
  for (const p of ENTRY_PARTS) {
    if (cv[p]) cv[p].entries = cv[p].entries.map((e) => resolve(e, timeline, 'src/cv.md'));
  }
  const date = lastChange([CV_FILE, TIMELINE_FILE]);
  const changed = {
    en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Europe/Warsaw' }).format(date),
    pl: new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeZone: 'Europe/Warsaw' }).format(date)
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const file of fs.readdirSync(EMOJI_DIR)) fs.copyFileSync(path.join(EMOJI_DIR, file), path.join(OUT_DIR, file));
  for (const field of Object.keys(IMAGES)) {
    const from = cv.header.fields[field];
    if (!from || !fs.existsSync(path.join(ROOT, from))) throw new Error(`src/cv.md: header field "${field}" must be the path of an image`);
    fs.copyFileSync(path.join(ROOT, from), path.join(OUT_DIR, imageName(cv.header.fields, field)));
  }
  // The public CV has no phone number. The private CV has the phone number from CV_PHONE
  // and a file name from CV_PRIVATE_NAME. Both come from the environment or from .env (not in git).
  const config = { ...readDotEnv(path.join(ROOT, '.env')), ...process.env };
  const publicHeader = { ...cv.header.fields, phone: undefined };
  const privateHeader = { ...cv.header.fields, phone: config.CV_PHONE };
  const digits = (config.CV_PHONE || '').replace(/[^+\d]/g, '');
  const privateFile = (variable, fallback) => {
    const name = config[variable] || fallback;
    if (!/^[A-Za-z0-9_+.-]+\.pdf$/.test(name)) throw new Error(`cv: ${variable} must be a file name that ends with .pdf`);
    return path.join(path.dirname(PDF), name);
  };
  const variants = [
    { tex: 'cv-public', pdf: PDF, header: publicHeader, make: documentTex },
    { tex: 'card-public', pdf: CARD_PDF, header: publicHeader, make: (c) => cardTex(c, timeline) }
  ];
  if (config.CV_PHONE) {
    variants.push(
      { tex: 'cv-private', pdf: privateFile('CV_PRIVATE_NAME', `Resume_MarcinJasiukowicz_${digits}.pdf`), header: privateHeader, make: documentTex },
      { tex: 'card-private', pdf: privateFile('CARD_PRIVATE_NAME', `Card_MarcinJasiukowicz_${digits}.pdf`), header: privateHeader, make: (c) => cardTex(c, timeline) }
    );
  } else {
    console.log('cv: CV_PHONE is not set. The build makes only the public CV and the public business card.');
  }
  for (const v of variants) {
    v.texFile = path.join(OUT_DIR, `${v.tex}.tex`);
    fs.writeFileSync(v.texFile, v.make({ ...cv, header: { ...cv.header, fields: v.header } }, changed));
    console.log(`cv: wrote ${path.relative(ROOT, v.texFile)}`);
  }
  if (process.argv.includes('--tex-only')) return;

  const tectonic = findTectonic();
  if (!tectonic) {
    console.warn(`cv: Tectonic not found. The site keeps the old ${path.relative(ROOT, PDF)}. See README.md, "CV".`);
    return;
  }
  // A fixed date in the PDF metadata: the PDF changes only when the CV data changes.
  const env = { ...process.env, SOURCE_DATE_EPOCH: String(Math.floor(date.getTime() / 1000)) };
  for (const v of variants) {
    const run = spawnSync(tectonic, ['-X', 'compile', '--keep-logs', '--outdir', OUT_DIR, v.texFile], { stdio: 'inherit', env });
    if (run.status !== 0) throw new Error('cv: Tectonic failed');
    fs.copyFileSync(path.join(OUT_DIR, `${v.tex}.pdf`), v.pdf);
    // XeTeX writes "Output written on <file>.xdv (N pages, ...)" in its log.
    const log = fs.readFileSync(path.join(OUT_DIR, `${v.tex}.log`), 'utf8');
    const pages = Number((log.match(/Output written on .*?\((\d+) pages?/s) || [])[1] || 0);
    console.log(`cv: wrote ${v.tex.endsWith('-private') ? `the private ${v.tex.replace('-private', '')}` : path.relative(ROOT, v.pdf)} (${pages} pages)`);
    if (pages !== 2) console.warn(`cv: WARNING: ${v.tex} has ${pages} pages, not 2. Make the text in src/cv.md shorter.`);
  }
}

// KEY=VALUE lines of a .env file. Lines that start with # are comments.
function readDotEnv(file) {
  if (!fs.existsSync(file)) return {};
  const values = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) values[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return values;
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = { parseCv, documentTex };
