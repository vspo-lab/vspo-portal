// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { $channelToDelete } from "../../stores/channel-actions";
import { DeleteChannelDialog } from "../DeleteChannelDialog";

const translations = {
  heading: "Delete #{channelName}?",
  description: "This action cannot be undone.",
  cancel: "Cancel",
  submit: "Delete",
};

describe("DeleteChannelDialog", () => {
  beforeEach(() => {
    $channelToDelete.set(null);
  });

  const onDelete = vi.fn();

  it("renders nothing when no channel targeted", () => {
    const { container } = render(
      <DeleteChannelDialog
        guildId="123456789012345678"
        onDelete={onDelete}
        translations={translations}
      />,
    );
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("renders dialog when channel is targeted", () => {
    $channelToDelete.set({
      channelId: "111222333444555666",
      channelName: "general",
    });
    render(
      <DeleteChannelDialog
        guildId="123456789012345678"
        onDelete={onDelete}
        translations={translations}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete #general?")).toBeInTheDocument();
  });

  it("closes dialog on cancel click", async () => {
    const user = userEvent.setup();
    $channelToDelete.set({
      channelId: "111222333444555666",
      channelName: "general",
    });
    render(
      <DeleteChannelDialog
        guildId="123456789012345678"
        onDelete={onDelete}
        translations={translations}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect($channelToDelete.get()).toBeNull();
  });

  it("calls onDelete when submit is clicked", async () => {
    const user = userEvent.setup();
    $channelToDelete.set({
      channelId: "111222333444555666",
      channelName: "general",
    });
    render(
      <DeleteChannelDialog
        guildId="123456789012345678"
        onDelete={onDelete}
        translations={translations}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(
      "123456789012345678",
      "111222333444555666",
    );
  });
});
