/**
 * Initialize standard dialog behavior: backdrop-click-to-close and cancel button.
 * Uses AbortController to prevent duplicate listeners on View Transition navigation.
 */
const controllers = new Map<string, AbortController>();

export const initDialog = (dialogId: string): void => {
  const dialog = document.getElementById(dialogId) as HTMLDialogElement | null;
  if (!dialog) return;

  const prev = controllers.get(dialogId);
  if (prev) prev.abort();
  const controller = new AbortController();
  controllers.set(dialogId, controller);
  const { signal } = controller;

  dialog.addEventListener(
    "click",
    (e) => {
      if (e.target === dialog) dialog.close();
    },
    { signal },
  );

  for (const btn of dialog.querySelectorAll(
    "[data-modal-close], [data-modal-cancel]",
  )) {
    btn.addEventListener("click", () => dialog.close(), { signal });
  }
};
