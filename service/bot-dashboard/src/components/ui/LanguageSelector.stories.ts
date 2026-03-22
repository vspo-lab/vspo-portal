import type { Meta, StoryObj } from "@storybook/html";

type LangArgs = {
  currentLocale: "ja" | "en";
  variant: "header" | "dropdown";
};

const meta: Meta<LangArgs> = {
  title: "UI/LanguageSelector",
  argTypes: {
    currentLocale: { control: "select", options: ["ja", "en"] },
    variant: { control: "select", options: ["header", "dropdown"] },
  },
  render: (args) => {
    const activeClass =
      args.variant === "header"
        ? "bg-white/20 text-white"
        : "bg-primary/10 text-primary";
    const inactiveClass =
      args.variant === "header"
        ? "text-white/60 hover:text-white"
        : "text-muted-foreground hover:text-foreground";
    const dividerClass =
      args.variant === "header" ? "text-white/40" : "text-muted-foreground/40";
    const bgClass =
      args.variant === "header" ? "bg-vspo-purple p-4 rounded-lg" : "p-4";

    return `
      <div class="${bgClass}">
        <div class="flex items-center gap-1">
          <button class="rounded px-2 py-1 text-xs font-medium transition-colors ${args.currentLocale === "ja" ? activeClass : inactiveClass}">日本語</button>
          <span class="${dividerClass}" aria-hidden="true">/</span>
          <button class="rounded px-2 py-1 text-xs font-medium transition-colors ${args.currentLocale === "en" ? activeClass : inactiveClass}">English</button>
        </div>
      </div>
    `;
  },
};

export default meta;
type Story = StoryObj<LangArgs>;

export const HeaderJapanese: Story = {
  args: { currentLocale: "ja", variant: "header" },
};

export const HeaderEnglish: Story = {
  args: { currentLocale: "en", variant: "header" },
};

export const DropdownJapanese: Story = {
  args: { currentLocale: "ja", variant: "dropdown" },
};

export const DropdownEnglish: Story = {
  args: { currentLocale: "en", variant: "dropdown" },
};
