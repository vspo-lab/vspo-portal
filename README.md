# Vspo Portal

Join the Spodule Discord for developers by clicking [here](https://discord.gg/Q7Hm8h3HAG)!

## Getting Started

### vspo-schedule

```bash
pnpm install
pnpm build
pnpm dev:vspo-schedule-web
```

## Current Services

| Service Name                                          | Description                                                                                             | Repository                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Spodule](https://www.vspo-schedule.com/schedule/all) | A site where you can check the streams (YouTube/Twitch/Twitcasting/Niconico) and clips of Vspo members. | [vspo-schedule](./service/vspo-schedule/v2/web/README.md) |
| Server                                                | Backend services for Vspo Portal                                                                        | [server](./service/server/README.md)                      |

## Packages

| Package Name                                      | Description                                                          | Version |
| ------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| [@vspo-lab/api](./packages/api/README.md)         | API client package for interacting with Vspo Portal backend services | 0.1.0   |
| [@vspo-lab/dayjs](./packages/dayjs/README.md)     | Date manipulation and formatting utilities                           | 0.1.0   |
| [@vspo-lab/error](./packages/errors/README.md)    | Error handling utilities                                             | 0.1.0   |
| [@vspo-lab/logging](./packages/logging/README.md) | Logging utilities                                                    | 0.1.0   |

## Development Environment

- Node.js: >=22.15.0
- Package Manager: pnpm >=10.10.0

## Development Roadmap

### How to Contribute

Please refer to "[CONTRIBUTING.md](./CONTRIBUTING.md)."
