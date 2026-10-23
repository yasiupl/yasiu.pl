// The HTML of a reply from the fediverse, as the post page may show it. Other servers send HTML;
// the backend keeps only the elements of a short text post (as Mastodon does) and safe links.
import sanitizeHtml from 'sanitize-html';

const OPTIONS = {
  allowedTags: ['p', 'br', 'a', 'span', 'em', 'strong', 'b', 'i', 'u', 'del', 's', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
  allowedAttributes: { a: ['href', 'class', 'rel', 'target'], span: ['class'] },
  allowedClasses: { a: ['mention', 'hashtag', 'u-url'], span: ['invisible', 'ellipsis', 'h-card'] },
  allowedSchemes: ['https', 'http'],
  transformTags: {
    a: (tag, attribs) => ({ tagName: 'a', attribs: { ...attribs, rel: 'nofollow noopener ugc', target: '_blank' } })
  }
};

export const sanitizeReply = (html) => sanitizeHtml(String(html || ''), OPTIONS);
export const plainText = (text) => sanitizeHtml(String(text || ''), { allowedTags: [], allowedAttributes: {} });
