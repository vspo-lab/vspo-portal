// @vitest-environment happy-dom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { $channelToEdit } from "../../stores/channel-actions";
import { ChannelConfigModal } from "../ChannelConfigModal";

const creators = [
  {
    id: "c1",
    name: "Hinano",
    memberType: "vspo_jp" as const,
    thumbnailUrl: null,
  },
  { id: "c2", name: "Ema", memberType: "vspo_jp" as const, thumbnailUrl: null },
  {
    id: "c3",
    name: "Remia",
    memberType: "vspo_en" as const,
    thumbnailUrl: null,
  },
];

const translations = {
  title: "#{channelName}",
  close: "Close",
  language: "Language",
  memberType: "Member Type",
  customMembers: "Custom Members",
  selected: "{count} selected",
  search: "Search members...",
  jpGroup: "VSPO JP",
  enGroup: "VSPO EN",
  selectAll: "Select All",
  deselectAll: "Deselect All",
  reset: "Reset",
  cancel: "Cancel",
  save: "Save",
  diffTitle: "Change Preview",
  diffLanguage: "Language",
  diffMemberType: "Members",
  diffCustomMembers: "Custom Members",
};

const languageOptions = [
  { value: "ja", label: "Japanese" },
  { value: "en", label: "English" },
  { value: "default", label: "Default" },
];

const memberTypeOptions = [
  { value: "vspo_jp", label: "VSPO JP", description: "JP members" },
  { value: "vspo_en", label: "VSPO EN", description: "EN members" },
  { value: "all", label: "All", description: "All members" },
  { value: "custom", label: "Custom", description: "Select members" },
];

const defaultProps = {
  guildId: "123456789012345678",
  updateActionUrl: "/actions/updateChannel",
  resetActionUrl: "/actions/resetChannel",
  creators,
  translations,
  languageOptions,
  memberTypeOptions,
};

describe("ChannelConfigModal", () => {
  beforeEach(() => {
    $channelToEdit.set(null);
  });

  it("renders nothing when no channel to edit", () => {
    const { container } = render(<ChannelConfigModal {...defaultProps} />);
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("renders dialog with channel name", () => {
    $channelToEdit.set({
      channelId: "ch1",
      channelName: "general",
      language: "ja",
      memberType: "vspo_jp",
    });
    render(<ChannelConfigModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("#general")).toBeInTheDocument();
  });

  it("selects correct language", () => {
    $channelToEdit.set({
      channelId: "ch1",
      channelName: "general",
      language: "en",
      memberType: "all",
    });
    render(<ChannelConfigModal {...defaultProps} />);
    const select = screen.getByLabelText("Language") as HTMLSelectElement;
    expect(select.value).toBe("en");
  });

  it("selects correct member type", () => {
    $channelToEdit.set({
      channelId: "ch1",
      channelName: "general",
      language: "ja",
      memberType: "all",
    });
    render(<ChannelConfigModal {...defaultProps} />);
    const radio = screen.getByLabelText("All") as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it("shows custom member section when custom is selected", async () => {
    const user = userEvent.setup();
    $channelToEdit.set({
      channelId: "ch1",
      channelName: "general",
      language: "ja",
      memberType: "vspo_jp",
    });
    render(<ChannelConfigModal {...defaultProps} />);

    await user.click(screen.getByLabelText("Custom"));
    expect(screen.getByText("Custom Members")).toBeInTheDocument();
    // Members should be visible immediately without clicking search
    expect(screen.getByText("Hinano")).toBeInTheDocument();
  });

  it("closes dialog on cancel", async () => {
    const user = userEvent.setup();
    $channelToEdit.set({
      channelId: "ch1",
      channelName: "general",
      language: "ja",
      memberType: "vspo_jp",
    });
    render(<ChannelConfigModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect($channelToEdit.get()).toBeNull();
  });

  it("shows change preview when language is changed", async () => {
    const user = userEvent.setup();
    $channelToEdit.set({
      channelId: "ch1",
      channelName: "general",
      language: "ja",
      memberType: "vspo_jp",
    });
    render(<ChannelConfigModal {...defaultProps} />);

    expect(screen.queryByText("Change Preview")).not.toBeInTheDocument();

    const select = screen.getByLabelText("Language") as HTMLSelectElement;
    await user.selectOptions(select, "en");

    const preview = screen.getByText("Change Preview").closest("div")!;
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByText("Japanese")).toBeInTheDocument();
    expect(within(preview).getByText("English")).toBeInTheDocument();
  });

  it("shows change preview when member type is changed", async () => {
    const user = userEvent.setup();
    $channelToEdit.set({
      channelId: "ch1",
      channelName: "general",
      language: "ja",
      memberType: "vspo_jp",
    });
    render(<ChannelConfigModal {...defaultProps} />);

    await user.click(screen.getByLabelText("VSPO EN"));

    const preview = screen.getByText("Change Preview").closest("div")!;
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByText("VSPO JP")).toBeInTheDocument();
    expect(within(preview).getByText("VSPO EN")).toBeInTheDocument();
  });

  it("checks custom members when pre-selected", () => {
    $channelToEdit.set({
      channelId: "ch1",
      channelName: "general",
      language: "ja",
      memberType: "custom",
      customMemberIds: ["c1", "c3"],
    });
    render(<ChannelConfigModal {...defaultProps} />);

    // Members should be visible immediately (no dropdown click needed)
    const c1 = screen.getByLabelText("Hinano") as HTMLInputElement;
    const c3 = screen.getByLabelText("Remia") as HTMLInputElement;
    expect(c1.checked).toBe(true);
    expect(c3.checked).toBe(true);
  });
});
