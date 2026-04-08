// @vitest-environment happy-dom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { FeatureItem } from "../FeatureShowcase";
import { FeatureShowcase } from "../FeatureShowcase";

const features: FeatureItem[] = [
  {
    id: "feature-list",
    icon: "list",
    title: "Manage Together",
    description: "Manage multiple servers in one place",
    iconColor: "text-vspo-purple",
    iconBgColor: "bg-vspo-purple/10",
  },
  {
    id: "feature-filter",
    icon: "filter",
    title: "Filter Members",
    description: "Filter by JP/EN members",
    iconColor: "text-tertiary",
    iconBgColor: "bg-tertiary/10",
  },
];

const defaultProps = {
  features,
  closeLabel: "Close",
};

describe("FeatureShowcase", () => {
  it("renders all feature cards", () => {
    render(<FeatureShowcase {...defaultProps} />);
    expect(screen.getByText("Manage Together")).toBeInTheDocument();
    expect(screen.getByText("Filter Members")).toBeInTheDocument();
  });

  it("renders feature descriptions on cards", () => {
    render(<FeatureShowcase {...defaultProps} />);
    expect(
      screen.getByText("Manage multiple servers in one place"),
    ).toBeInTheDocument();
  });

  it("opens dialog when feature card is clicked", async () => {
    const user = userEvent.setup();
    render(<FeatureShowcase {...defaultProps} />);

    const card = screen.getByRole("button", { name: /Manage Together/i });
    await user.click(card);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Manage Together")).toBeInTheDocument();
  });

  it("closes dialog when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeatureShowcase {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /Manage Together/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows feature image in dialog", async () => {
    const user = userEvent.setup();
    render(<FeatureShowcase {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /Manage Together/i }));
    const img = within(screen.getByRole("dialog")).getByRole("img");
    expect(img).toHaveAttribute("src", "/features/feature-list.png");
    expect(img).toHaveAttribute("alt", "Manage Together");
  });
});
