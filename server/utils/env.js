// The value of the first environment variable in the list that has a value.
// The API routes read their secrets at run time. Set them in the settings of the platform
// (see README.md, "API routes"). The lower-case names are the names of the old Netlify functions.
export const fromEnv = (...names) => names.map((name) => process.env[name]).find(Boolean) || '';
