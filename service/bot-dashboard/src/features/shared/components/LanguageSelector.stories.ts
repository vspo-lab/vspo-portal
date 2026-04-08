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
    if (args.variant === "header") {
      const label = args.currentLocale.toUpperCase();
      return `
        <div class="bg-surface-container p-4 rounded-lg inline-block">
          <button class="relative flex h-9 w-9 items-center justify-center rounded-[--radius-sm] text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface cursor-pointer">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path stroke-linecap="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span class="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vspo-purple px-0.5 text-[8px] font-bold leading-none text-white">${label}</span>
          </button>
        </div>
      `;
    }

    const activeClass = "bg-primary/10 text-primary";
    const inactiveClass = "text-muted-foreground hover:text-foreground";

    return `
      <div class="p-4">
        <div class="flex items-center gap-1">
          <button class="rounded px-2 py-1 text-[10px] font-bold transition-colors ${args.currentLocale === "ja" ? activeClass : inactiveClass}">日本語</button>
          <button class="rounded px-2 py-1 text-[10px] font-bold transition-colors ${args.currentLocale === "en" ? activeClass : inactiveClass}">English</button>
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
