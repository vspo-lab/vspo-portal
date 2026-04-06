// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import {
  $channelToDelete,
  $channelToEdit,
  $showAddModal,
  closeAddModal,
  closeDeleteDialog,
  closeEditModal,
  openAddModal,
  openDeleteDialog,
  openEditModal,
} from "../channel-actions";

describe("channel-actions store", () => {
  beforeEach(() => {
    $channelToEdit.set(null);
    $channelToDelete.set(null);
    $showAddModal.set(false);
  });

  describe("edit modal", () => {
    const channel = {
      channelId: "123456789012345678",
      channelName: "general",
      language: "ja",
      memberType: "all" as const,
    };

    it("starts as null", () => {
      expect($channelToEdit.get()).toBeNull();
    });

    it("openEditModal sets channel data", () => {
      openEditModal(channel);
      expect($channelToEdit.get()).toEqual(channel);
    });

    it("closeEditModal resets to null", () => {
      openEditModal(channel);
      closeEditModal();
      expect($channelToEdit.get()).toBeNull();
    });
  });

  describe("delete dialog", () => {
    const target = { channelId: "123456789012345678", channelName: "general" };

    it("starts as null", () => {
      expect($channelToDelete.get()).toBeNull();
    });

    it("openDeleteDialog sets target", () => {
      openDeleteDialog(target);
      expect($channelToDelete.get()).toEqual(target);
    });

    it("closeDeleteDialog resets to null", () => {
      openDeleteDialog(target);
      closeDeleteDialog();
      expect($channelToDelete.get()).toBeNull();
    });
  });

  describe("add modal", () => {
    it("starts as false", () => {
      expect($showAddModal.get()).toBe(false);
    });

    it("openAddModal sets true", () => {
      openAddModal();
      expect($showAddModal.get()).toBe(true);
    });

    it("closeAddModal sets false", () => {
      openAddModal();
      closeAddModal();
      expect($showAddModal.get()).toBe(false);
    });
  });
});
