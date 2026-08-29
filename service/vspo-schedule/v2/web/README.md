# Spodule

A site where you can check the streams (YouTube/Twitch/Twitcasting/Niconico) and clips of Vspo members. Follow us on [X](https://twitter.com/vspodule) for updates.

## Requirements

- Node.js: >=22.12.0
- Package Manager: pnpm >=9.15.9 (pinned to `10.33.0` via `packageManager`)

## Quick Start

To set up the development environment, run the following commands:

```bash
# root directory(packages build)
pnpm build

# change dir(service/vspo-schedule/v2/web)
# Install dependencies
pnpm i

# Start development server (http://localhost:4000)
pnpm dev
```

## Scripts

| Script                | Description                                    |
| ----------------------- | ------------------------------------------------ |
| `pnpm dev`               | Start the Next.js dev server on port 4000      |
| `pnpm build` / `pnpm start` | Build and run the production Next.js server |
| `pnpm cf:build` / `cf:deploy` / `cf:preview` | Build/deploy/preview via OpenNext for Cloudflare |
| `pnpm test` / `test:run` / `test:coverage` | Run Vitest (watch/once/with coverage) |
| `pnpm storybook`         | Start Storybook on port 6006                   |

## Used Packages

- @vspo-lab/api: 0.1.0
- @vspo-lab/dayjs: 0.1.0
- @vspo-lab/error: 0.1.0

## Website

Visit the live site at [https://www.vspo-schedule.com/schedule/all](https://www.vspo-schedule.com/schedule/all)
