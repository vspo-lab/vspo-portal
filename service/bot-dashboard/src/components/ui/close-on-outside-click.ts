/**
 * Auto-close <details> elements when clicking outside.
 * Elements with [data-auto-close] will close when a click occurs outside them.
 */
let controller: AbortController | null = null;

const init = (): void => {
  if (controller) controller.abort();
  controller = new AbortController();

  document.addEventListener(
    "click",
    (e) => {
      if (!(e.target instanceof Node)) return;
      const target = e.target;
      for (const el of document.querySelectorAll<HTMLDetailsElement>(
        "details[data-auto-close]",
      )) {
        if (el.open && !el.contains(target)) el.open = false;
      }
    },
    { signal: controller.signal },
  );
};

init();
document.addEventListener("astro:page-load", init);
