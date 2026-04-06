/**
 * Parse an HTML string into a happy-dom Document for assertion.
 * Extracted from individual test files to avoid duplication.
 */
export const parseHtml = (html: string): Document => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc;
};

/** Query helper: find all matching elements in rendered HTML. */
export const queryAll = (html: string, selector: string): Element[] => {
  const doc = parseHtml(html);
  return Array.from(doc.querySelectorAll(selector));
};

/** Query helper: find first matching element. */
export const query = (html: string, selector: string): Element | null => {
  const doc = parseHtml(html);
  return doc.querySelector(selector);
};
