// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteChannelDialog } from "../DeleteChannelDialog";
import { $channelToDelete } from "../../stores/channel-actions";

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

  it("renders nothing when no channel targeted", () => {
    const { container } = render(
      <DeleteChannelDialog
        guildId="123456789012345678"
        actionUrl="/actions/deleteChannel"
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
        actionUrl="/actions/deleteChannel"
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
        actionUrl="/actions/deleteChannel"
        translations={translations}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect($channelToDelete.get()).toBeNull();
  });

  it("renders hidden form fields", () => {
    $channelToDelete.set({
      channelId: "111222333444555666",
      channelName: "general",
    });
    render(
      <DeleteChannelDialog
        guildId="123456789012345678"
        actionUrl="/actions/deleteChannel"
        translations={translations}
      />,
    );
    const form = screen.getByRole("dialog").querySelector("form");
    expect(form).toBeInTheDocument();
    expect(
      form?.querySelector<HTMLInputElement>('input[name="guildId"]')?.value,
    ).toBe("123456789012345678");
    expect(
      form?.querySelector<HTMLInputElement>('input[name="channelId"]')?.value,
    ).toBe("111222333444555666");
  });
});
