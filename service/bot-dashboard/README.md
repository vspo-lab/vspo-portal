# Bot Dashboard

A dashboard for managing the Vspo Discord bot: announcements, and per-guild/channel
settings. Built with Astro (React islands) and deployed to Cloudflare Workers.

## Requirements

- Node.js: >=22.12.0
- Package Manager: pnpm >=9.15.9 (pinned to `10.33.0` via `packageManager`)

## Quick Start

```bash
# root directory (packages build)
pnpm build

# change dir(service/bot-dashboard)
pnpm i

# copy the env template and fill in Discord OAuth credentials
cp .dev.vars.example .dev.vars

# Start development server (http://localhost:4321)
pnpm dev
```

Setting `DEV_MOCK_AUTH=true` in `.dev.vars` skips Discord OAuth and injects a mock
user session, so the `/dashboard` pages are reachable without real credentials.

## Environment Variables

See `.dev.vars.example` for the full list:

- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` / `DISCORD_BOT_CLIENT_ID` - Discord OAuth2 app credentials
- `DISCORD_REDIRECT_URI` - OAuth callback URL (`http://localhost:4321/auth/callback` in dev)
- `DEV_MOCK_AUTH` - skip OAuth with a mock session (dev only)

## Scripts

| Script                | Description                                  |
| ----------------------- | ----------------------------------------------- |
| `pnpm dev`               | Start the Astro dev server                    |
| `pnpm build` / `preview` | Build and preview the production build        |
| `pnpm cf:deploy`         | Deploy to Cloudflare Workers via Wrangler      |
| `pnpm typecheck`         | Run `astro check` and `tsc --noEmit`           |
| `pnpm test` / `test:run` / `test:coverage` | Run Vitest (watch/once/with coverage) |
| `pnpm storybook`         | Start Storybook on port 6007                   |

## Used Packages

- @vspo-lab/dayjs: 0.1.0
- @vspo-lab/error: 0.1.0

## Website

Visit the live site at [https://discord.vspo-schedule.com](https://discord.vspo-schedule.com)
