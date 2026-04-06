import { atom } from "nanostores";

export type EditableChannel = {
  channelId: string;
  channelName: string;
  language: string;
  memberType: "vspo_jp" | "vspo_en" | "all" | "custom";
  customMemberIds?: string[];
};

export type DeletableChannel = {
  channelId: string;
  channelName: string;
};

/** Which channel's config modal is open, or null if closed */
export const $channelToEdit = atom<EditableChannel | null>(null);

/** Which channel's delete dialog is open, or null if closed */
export const $channelToDelete = atom<DeletableChannel | null>(null);

/** Whether the add-channel modal is open */
export const $showAddModal = atom<boolean>(false);

export const openEditModal = (channel: EditableChannel): void => {
  $channelToEdit.set(channel);
};

export const closeEditModal = (): void => {
  $channelToEdit.set(null);
};

export const openDeleteDialog = (target: DeletableChannel): void => {
  $channelToDelete.set(target);
};

export const closeDeleteDialog = (): void => {
  $channelToDelete.set(null);
};

export const openAddModal = (): void => {
  $showAddModal.set(true);
};

export const closeAddModal = (): void => {
  $showAddModal.set(false);
};
