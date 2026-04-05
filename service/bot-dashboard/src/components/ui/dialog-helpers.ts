/**
 * Initialize standard dialog behavior: backdrop-click-to-close and cancel/close buttons.
 * Uses native <dialog>.showModal() which provides focus trap and Escape-to-close.
 */
export const initDialog = (dialogId: string): void => {
  const dialog = document.getElementById(dialogId) as HTMLDialogElement | null;
  if (!dialog) return;

  // Close on backdrop click
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  // Close on cancel/close buttons
  for (const btn of dialog.querySelectorAll(
    "[data-modal-close], [data-modal-cancel]",
  )) {
    btn.addEventListener("click", () => dialog.close());
  }
};
