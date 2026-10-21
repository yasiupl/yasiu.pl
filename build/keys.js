// Makes the Web Key Directory (WKD) of yasiu.pl: "gpg --locate-keys contact@yasiu.pl" gets the PGP
// key from https://yasiu.pl/.well-known/openpgpkey/hu/<hash> (the "direct method" of
// https://datatracker.ietf.org/doc/draft-koch-openpgp-webkey-service/).
//
// The build downloads the key from Keybase (or from GitHub, if Keybase fails), the same key that
// /pgp.pub sends to. The fingerprint of the key must be the "pgp" field of src/cv.md; else the build
// stops. The WKD file has only the user ID of the email address, as the draft recommends.
const crypto = require('crypto');

const sources = (fingerprint, github) => [
  `https://keybase.io/yasiupl/pgp_keys.asc?fingerprint=${fingerprint}`,
  github && `https://github.com/${github}.gpg`
].filter(Boolean);

// Armored text -> binary packets.
function dearmor(text) {
  const m = /-----BEGIN PGP PUBLIC KEY BLOCK-----\r?\n([\s\S]*?)-----END PGP PUBLIC KEY BLOCK-----/.exec(text);
  if (!m) throw new Error('no PGP public key block');
  // The headers (if any) end at the first empty line. The line "=XXXX" is the checksum.
  const lines = m[1].split(/\r?\n/).map((l) => l.trim());
  const body = lines.slice(lines.indexOf('') + 1);
  return Buffer.from(body.filter((l) => !l.startsWith('=')).join(''), 'base64');
}

// Binary key -> [{ tag, start, end, body }] (RFC 4880, 4.2). Only new-format and old-format
// headers with a known length; partial lengths do not occur in keys.
function packets(buf) {
  const list = [];
  let i = 0;
  while (i < buf.length) {
    const start = i;
    const h = buf[i++];
    if (!(h & 0x80)) throw new Error(`bad packet header at ${start}`);
    let tag, len;
    if (h & 0x40) {
      tag = h & 0x3f;
      const b = buf[i++];
      if (b < 192) len = b;
      else if (b < 224) len = ((b - 192) << 8) + buf[i++] + 192;
      else if (b === 255) { len = buf.readUInt32BE(i); i += 4; }
      else throw new Error('partial packet length in a key');
    } else {
      tag = (h >> 2) & 0x0f;
      const n = [1, 2, 4][h & 3];
      if (!n) throw new Error('indeterminate packet length in a key');
      len = buf.readUIntBE(i, n);
      i += n;
    }
    list.push({ tag, start, end: i + len, body: buf.subarray(i, i + len) });
    i += len;
  }
  return list;
}

// The v4 fingerprint of a public key packet (RFC 4880, 12.2).
function fingerprintOf(body) {
  const head = Buffer.from([0x99, body.length >> 8, body.length & 0xff]);
  return crypto.createHash('sha1').update(head).update(body).digest('hex').toUpperCase();
}

// Only the user IDs with this address, and their signatures. The primary key, its direct
// signatures and the subkeys stay.
function onlyUserId(buf, email) {
  const keep = [];
  let skip = false;
  for (const p of packets(buf)) {
    if (p.tag === 13 || p.tag === 17) skip = !(p.tag === 13 && p.body.toString('utf8').toLowerCase().includes(`<${email}>`));
    else if (p.tag === 14) skip = false;
    if (!skip) keep.push(buf.subarray(p.start, p.end));
  }
  return Buffer.concat(keep);
}

// z-base-32 of the SHA-1 of the local part (the "hu" name in WKD).
function wkdHash(local) {
  const alphabet = 'ybndrfg8ejkmcpqxot1uwisza345h769';
  const digest = crypto.createHash('sha1').update(local.toLowerCase()).digest();
  let bits = '';
  for (const b of digest) bits += b.toString(2).padStart(8, '0');
  return bits.match(/.{1,5}/g).map((c) => alphabet[parseInt(c.padEnd(5, '0'), 2)]).join('');
}

// -> { [path in the site]: Buffer }
async function wkdFiles({ email, fingerprint, github }) {
  const want = fingerprint.toUpperCase().replace(/\s/g, '');
  const errors = [];
  for (const url of sources(want, github)) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const key = dearmor(await res.text());
      const primary = packets(key)[0];
      if (primary?.tag !== 6) throw new Error('the first packet is not a public key');
      const got = fingerprintOf(primary.body);
      if (got !== want) throw new Error(`the fingerprint is ${got}, not ${want} (src/cv.md, "pgp")`);
      const out = onlyUserId(key, email.toLowerCase());
      if (!packets(out).some((p) => p.tag === 13)) throw new Error(`the key has no user ID <${email}>`);
      return {
        [`.well-known/openpgpkey/hu/${wkdHash(email.split('@')[0])}`]: out,
        // An empty policy file says that the site has a WKD.
        '.well-known/openpgpkey/policy': Buffer.alloc(0)
      };
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }
  throw new Error(`keys: cannot get the PGP key for the WKD.\n  ${errors.join('\n  ')}`);
}

module.exports = { wkdFiles, wkdHash };
