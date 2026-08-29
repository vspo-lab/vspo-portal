# Vspo Portal

Join the [Spodule Discord for developers](https://discord.gg/Q7Hm8h3HAG)!

## Getting Started

### vspo-schedule

```bash
pnpm install
pnpm build
pnpm dev:vspo-schedule-web
```

### bot-dashboard

```bash
pnpm install
pnpm build
pnpm --filter bot-dashboard dev
```

## Common Scripts

Run from the repository root (see `package.json` for the full list):

| Script                       | Description                                        |
| ----------------------------- | --------------------------------------------------- |
| `pnpm build`                   | Build every package/service via Turborepo          |
| `pnpm tsc`                     | Type-check every workspace package                 |
| `pnpm biome:check`             | Lint & format check with Biome                     |
| `pnpm knip`                    | Detect unused files/exports/dependencies            |
| `pnpm generate-openapi`        | Regenerate the `@vspo-lab/api` client from OpenAPI  |
| `pnpm dev:vspo-schedule-web`   | Start the vspo-schedule web app in dev mode         |

## Current Services

| Service Name                                          | Description                                                                                              | Repository                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Spodule](https://www.vspo-schedule.com/schedule/all) | A site where you can check the streams (YouTube/Twitch/Twitcasting/Niconico) and clips of Vspo members.   | [vspo-schedule](./service/vspo-schedule/v2/web/README.md) |
| [Bot Dashboard](https://discord.vspo-schedule.com)     | A dashboard for managing the Vspo Discord bot (announcements, guild/channel settings).                    | [bot-dashboard](./service/bot-dashboard/README.md)        |

## Packages

| Package Name                                      | Description                                                           | Version |
| -------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| [@vspo-lab/api](./packages/api/README.md)          | API client package for interacting with Vspo Portal backend services  | 0.1.0   |
| [@vspo-lab/dayjs](./packages/dayjs/README.md)      | Date manipulation and formatting utilities                            | 0.1.0   |
| [@vspo-lab/error](./packages/errors/README.md)     | Error handling utilities                                              | 0.1.0   |
| [@vspo-lab/logging](./packages/logging/README.md)  | Logging utilities                                                     | 0.1.0   |

## Development Environment

- Node.js: >=22.12.0
- Package Manager: pnpm >=9.15.9 (pinned to `10.33.0` via `packageManager`)

## Development Roadmap

### How to Contribute

Please refer to "[CONTRIBUTING.md](./CONTRIBUTING.md)."
