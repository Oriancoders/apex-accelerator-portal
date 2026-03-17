import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe HTML tags from rich text editors (TipTap) while stripping scripts.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "hr", "span", "div", "sub", "sup",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title",
      "class", "style", "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
  });
}

/**
 * Stricter sanitizer for user-submitted ticket descriptions.
 * Keeps formatting but removes style/classes/images to reduce XSS surface.
 */
export function sanitizeTicketHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "hr", "span", "div", "sub", "sup",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "title"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["style", "class", "onerror", "onload", "onclick", "onmouseover"],
  });
}
