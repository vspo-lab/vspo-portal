/**
 * Bridge script: connects ChannelTable (Astro) button clicks to Nano Stores.
 * Temporary — will be removed when ChannelTable is migrated to React in Phase 5.
 */
import {
  openEditModal,
  openDeleteDialog,
  openAddModal,
  type EditableChannel,
} from "../stores/channel-actions";

let controller: AbortController | null = null;

function init(): void {
  if (controller) controller.abort();
  controller = new AbortController();
  const { signal } = controller;

  // Read channel data from config modal's data attribute
  const configDialog = document.getElementById("config-modal");
  const channelsData: EditableChannel[] = configDialog
    ? JSON.parse(configDialog.dataset.channels ?? "[]").map(
        (ch: { channelId: string; channelName: string; language: string; memberType: string; customMembers?: string[] }) => ({
          channelId: ch.channelId,
          channelName: ch.channelName,
          language: ch.language,
          memberType: ch.memberType,
          customMemberIds: ch.customMembers,
        }),
      )
    : [];

  // Edit button → $channelToEdit
  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "[data-action-edit]",
      );
      if (!btn) return;
      const channelId = btn.dataset.actionEdit ?? "";
      const row = btn.closest("tr");
      const channelName = row?.querySelector("p")?.textContent ?? "";
      const channel = channelsData.find((c) => c.channelId === channelId);
      if (channel) {
        openEditModal(channel);
      } else {
        openEditModal({
          channelId,
          channelName,
          language: "default",
          memberType: "all",
        });
      }
    },
    { signal },
  );

  // Delete button → $channelToDelete
  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "[data-action-delete]",
      );
      if (!btn) return;
      const channelId = btn.dataset.actionDelete ?? "";
      const channelName =
        btn.closest("tr")?.querySelector("p")?.textContent ?? "";
      openDeleteDialog({ channelId, channelName });
    },
    { signal },
  );

  // Add button → $showAddModal
  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-action-add]",
      );
      if (btn) openAddModal();
    },
    { signal },
  );
}

init();
document.addEventListener("astro:page-load", init);
