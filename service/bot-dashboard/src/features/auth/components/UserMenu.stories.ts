import type { Meta, StoryObj } from "@storybook/html";

type UserMenuArgs = {
  displayName: string;
  avatarUrl: string | null;
};

const avatarFallback = (args: UserMenuArgs, size: string) => {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-sm font-medium"
      : "h-10 w-10 text-sm font-bold";
  if (args.avatarUrl) {
    return `<img src="${args.avatarUrl}" alt="${args.displayName}" class="${sizeClass} rounded-full" />`;
  }
  return `<div class="flex ${sizeClass} items-center justify-center rounded-full bg-muted" role="img" aria-label="${args.displayName}">${args.displayName[0]}</div>`;
};

const meta: Meta<UserMenuArgs> = {
  title: "Auth/UserMenu",
  argTypes: {
    avatarUrl: { control: "text" },
  },
  render: (args) => {
    return `
      <div class="flex justify-end p-4">
        <details class="group relative" open>
          <summary
            class="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-container-highest [&::-webkit-details-marker]:hidden"
          >
            ${avatarFallback(args, "sm")}
            <span class="text-sm font-medium">${args.displayName}</span>
            <svg class="h-4 w-4 opacity-60 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div class="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-surface-container-high/95 p-2 shadow-hover glass">
            <div class="px-3 py-2">
              <p class="text-xs font-medium text-muted-foreground">Language</p>
              <div class="mt-1 flex gap-1">
                <button class="rounded px-2 py-1 text-xs bg-surface-container-highest">English</button>
                <button class="rounded px-2 py-1 text-xs">Japanese</button>
              </div>
            </div>

            <div class="my-1 h-px bg-outline-variant/20"></div>

            <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface transition-colors hover:bg-surface-container-highest">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
              </svg>
              <span>Theme</span>
            </button>

            <div class="my-1 h-px bg-outline-variant/20"></div>

            <form method="post" action="/auth/logout">
              <button type="submit" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </form>
          </div>
        </details>
      </div>
    `;
  },
};

export default meta;
type Story = StoryObj<UserMenuArgs>;

export const WithAvatar: Story = {
  args: {
    displayName: "Test User",
    avatarUrl: "https://cdn.discordapp.com/avatars/123/abc.png",
  },
};

export const WithoutAvatar: Story = {
  args: {
    displayName: "Zach",
    avatarUrl: null,
  },
};

export const LongDisplayName: Story = {
  args: {
    displayName: "Very Long Display Name User",
    avatarUrl: null,
  },
};
