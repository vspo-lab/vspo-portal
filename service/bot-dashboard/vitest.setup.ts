import "@testing-library/jest-dom/vitest";
import { GlobalWindow } from "happy-dom";

// Register DOM globals (DOMParser, document, window, etc.) without switching
// vitest to a browser-like environment. This keeps Astro's server-side
// component compilation intact while providing DOM APIs for
// @testing-library/dom queries on rendered HTML strings.
const window = new GlobalWindow();
for (const key of [
  "DOMParser",
  "document",
  "HTMLElement",
  "DocumentFragment",
  "Element",
  "Node",
  "Text",
  "Comment",
  "getComputedStyle",
] as const) {
  if (!(key in globalThis)) {
    Object.defineProperty(globalThis, key, {
      value: (window as Record<string, unknown>)[key],
      writable: true,
      configurable: true,
    });
  }
}
