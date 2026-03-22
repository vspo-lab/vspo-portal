import type { Meta, StoryObj } from "@storybook/html";

type ThemeToggleArgs = {
  variant: "header" | "page";
};

const meta: Meta<ThemeToggleArgs> = {
  title: "UI/ThemeToggle",
  argTypes: {
    variant: { control: "select", options: ["header", "page"] },
  },
  render: (args) => {
    const buttonClass =
      args.variant === "header"
        ? "text-white/80 hover:bg-white/20 focus-visible:ring-white/50"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring";

    const bgClass =
      args.variant === "header" ? "bg-vspo-purple p-4 rounded-lg" : "p-4";

    return `
      <div class="${bgClass}">
        <button type="button" aria-label="Toggle theme"
          class="flex h-9 w-9 items-center justify-center rounded-[--radius-sm] transition-colors duration-[--duration-fast] ease-[--ease-standard] focus-visible:outline-none focus-visible:ring-2 ${buttonClass}">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
        </button>
      </div>
    `;
  },
};

export default meta;
type Story = StoryObj<ThemeToggleArgs>;

export const Header: Story = {
  args: { variant: "header" },
};

export const Page: Story = {
  args: { variant: "page" },
};
