import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "h1", "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "strong", "b", "em", "i", "u", "s", "br", "hr", "pre", "code"];

export function sanitizeDraft(value: string) {
  return sanitizeHtml(value, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    allowedSchemes: [],
    disallowedTagsMode: "discard"
  }).slice(0, 500_000);
}