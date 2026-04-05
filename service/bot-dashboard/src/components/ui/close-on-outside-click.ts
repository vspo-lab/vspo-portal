/**
 * Auto-close <details> elements when clicking outside.
 * Elements with [data-auto-close] will close when a click occurs outside them.
 *
 * @postcondition All [data-auto-close] details elements close on outside click.
 */
const init = (): void => {
  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    for (const el of document.querySelectorAll<HTMLDetailsElement>(
      "details[data-auto-close]",
    )) {
      if (el.open && !el.contains(target)) el.open = false;
    }
  });
};

init();
document.addEventListener("astro:page-load", init);
