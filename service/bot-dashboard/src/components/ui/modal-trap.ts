const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Initialize focus trap, Escape-to-close, and backdrop-click-to-close on a
 * modal dialog element.
 *
 * @param dialog - The dialog element (must already be in the DOM)
 * @param onClose - Callback invoked when the user requests close (Escape / backdrop click)
 */
export const initModalTrap = (
  dialog: HTMLElement,
  onClose: () => void,
): void => {
  const focusableEls = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];

  firstEl?.focus();

  dialog.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "Tab" && focusableEls.length > 0) {
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl?.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl?.focus();
      }
    }
  });

  dialog.addEventListener("click", (e: MouseEvent) => {
    if (e.target === dialog) onClose();
  });
};
