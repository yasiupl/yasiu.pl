import { readFileSync } from 'node:fs';

// The value of a variable. If the variable has no value, the value is the content of the file in
// the variable <name>_FILE. On blade12 the secrets are files from sops (see infra/api/README.md).
function valueOf(name) {
  if (process.env[name]) return process.env[name];
  const file = process.env[`${name}_FILE`];
  if (!file) return '';
  try {
    return readFileSync(file, 'utf8').trim();
  } catch {
    return '';
  }
}

// The value of the first variable in the list that has a value (see README.md, "API routes").
// The lower-case names are the names of the old Netlify functions.
export const fromEnv = (...names) => names.map(valueOf).find(Boolean) || '';
