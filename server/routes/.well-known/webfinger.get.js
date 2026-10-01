// Bridgy Fed answers the WebFinger requests for @yasiu@yasiu.pl (see README.md, "Fediverse").
// The redirect keeps the query of the request (?resource=acct:...).
export default defineEventHandler((event) =>
  sendRedirect(event, `https://fed.brid.gy/.well-known/webfinger${getRequestURL(event).search}`, 302));
