// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChannelAddModal } from "../ChannelAddModal";
import { $showAddModal } from "../../stores/channel-actions";

const translations = {
  title: "Add Channel",
  search: "Search channels...",
  loading: "Loading...",
  error: "Failed to load channels",
  empty: "No channels found",
  submit: "Add",
  registered: "Already registered",
  cancel: "Cancel",
  close: "Close",
};

describe("ChannelAddModal", () => {
  beforeEach(() => {
    $showAddModal.set(false);
    vi.restoreAllMocks();
  });

  it("renders nothing when modal is closed", () => {
    const { container } = render(
      <ChannelAddModal
        guildId="123456789012345678"
        actionUrl="/actions/addChannel"
        registeredChannelIds={[]}
        translations={translations}
      />,
    );
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("renders dialog when modal is open", () => {
    $showAddModal.set(true);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    render(
      <ChannelAddModal
        guildId="123456789012345678"
        actionUrl="/actions/addChannel"
        registeredChannelIds={[]}
        translations={translations}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add Channel")).toBeInTheDocument();
  });

  it("fetches and displays channels", async () => {
    $showAddModal.set(true);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: "ch1", name: "general" },
          { id: "ch2", name: "announcements" },
        ]),
        { status: 200 },
      ),
    );
    render(
      <ChannelAddModal
        guildId="123456789012345678"
        actionUrl="/actions/addChannel"
        registeredChannelIds={[]}
        translations={translations}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("general")).toBeInTheDocument();
      expect(screen.getByText("announcements")).toBeInTheDocument();
    });
  });

  it("marks already registered channels", async () => {
    $showAddModal.set(true);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: "ch1", name: "general" },
          { id: "ch2", name: "announcements" },
        ]),
        { status: 200 },
      ),
    );
    render(
      <ChannelAddModal
        guildId="123456789012345678"
        actionUrl="/actions/addChannel"
        registeredChannelIds={["ch1"]}
        translations={translations}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Already registered")).toBeInTheDocument();
    });
  });

  it("filters channels by search", async () => {
    const user = userEvent.setup();
    $showAddModal.set(true);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: "ch1", name: "general" },
          { id: "ch2", name: "announcements" },
        ]),
        { status: 200 },
      ),
    );
    render(
      <ChannelAddModal
        guildId="123456789012345678"
        actionUrl="/actions/addChannel"
        registeredChannelIds={[]}
        translations={translations}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("general")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Search channels..."), "gen");
    expect(screen.getByText("general")).toBeInTheDocument();
    expect(screen.queryByText("announcements")).not.toBeInTheDocument();
  });

  it("closes dialog on cancel", async () => {
    const user = userEvent.setup();
    $showAddModal.set(true);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    render(
      <ChannelAddModal
        guildId="123456789012345678"
        actionUrl="/actions/addChannel"
        registeredChannelIds={[]}
        translations={translations}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect($showAddModal.get()).toBe(false);
  });
});
