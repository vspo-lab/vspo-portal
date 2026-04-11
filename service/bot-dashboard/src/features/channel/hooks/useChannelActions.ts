import { actions } from "astro:actions";
import { showFlash } from "~/features/shared/stores/flash";
import type { ChannelConfigType } from "../domain/channel-config";
import {
  closeAddModal,
  closeDeleteDialog,
  closeEditModal,
} from "../stores/channel-actions";
import {
  optimisticAdd,
  optimisticRemove,
  optimisticUpdate,
} from "../stores/channel-data";

type ChannelActionTranslations = {
  addSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
  resetSuccess: string;
  error: string;
};

/**
 * Channel CRUD operations using Astro Actions (JSON mode) with optimistic UI.
 * Each operation: close modal → optimistic update → API call → flash / rollback.
 */
export function createChannelActions(translations: ChannelActionTranslations) {
  const addChannel = async (
    guildId: string,
    channelId: string,
    channelName: string,
  ) => {
    closeAddModal();
    const newChannel: ChannelConfigType = {
      channelId,
      channelName,
      enabled: true,
      language: "default",
      memberType: "all",
    };
    const rollback = optimisticAdd(newChannel);

    const { error } = await actions.addChannel({ guildId, channelId });
    if (error) {
      rollback();
      showFlash({ type: "error", message: translations.error });
    } else {
      showFlash({ type: "success", message: translations.addSuccess });
    }
  };

  const updateChannel = async (
    guildId: string,
    channelId: string,
    patch: { language: string; memberType: string; customMemberIds?: string[] },
  ) => {
    closeEditModal();
    const rollback = optimisticUpdate(channelId, {
      language: patch.language,
      memberType: patch.memberType as ChannelConfigType["memberType"],
      customMembers: patch.customMemberIds,
    });

    const { error } = await actions.updateChannel({
      guildId,
      channelId,
      language: patch.language as
        | "ja"
        | "en"
        | "fr"
        | "de"
        | "es"
        | "cn"
        | "tw"
        | "ko"
        | "default",
      memberType: patch.memberType as "vspo_jp" | "vspo_en" | "all" | "custom",
      customMemberIds: patch.customMemberIds,
    });
    if (error) {
      rollback();
      showFlash({ type: "error", message: translations.error });
    } else {
      showFlash({ type: "success", message: translations.updateSuccess });
    }
  };

  const resetChannel = async (guildId: string, channelId: string) => {
    closeEditModal();
    const rollback = optimisticUpdate(channelId, {
      language: "default",
      memberType: "all",
      customMembers: [],
    });

    const { error } = await actions.resetChannel({ guildId, channelId });
    if (error) {
      rollback();
      showFlash({ type: "error", message: translations.error });
    } else {
      showFlash({ type: "success", message: translations.resetSuccess });
    }
  };

  const deleteChannel = async (guildId: string, channelId: string) => {
    closeDeleteDialog();
    const rollback = optimisticRemove(channelId);

    const { error } = await actions.deleteChannel({ guildId, channelId });
    if (error) {
      rollback();
      showFlash({ type: "error", message: translations.error });
    } else {
      showFlash({ type: "success", message: translations.deleteSuccess });
    }
  };

  return { addChannel, updateChannel, resetChannel, deleteChannel };
}
