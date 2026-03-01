# Overview

## Project Information

| Item | Value |
| --- | --- |
| Project Name | vspo-portal |
| Service Name | Spodule |
| Domain | VTuber content aggregation for VSPO! |
| Repository | vspo-portal |
| Last Updated | 2026-03-01 |

## Summary

vspo-portal is a content discovery platform for **VSPO!** (Japanese VTuber group). The main service, **Spodule**, aggregates streams, clips, events, and free chats from multiple platforms (YouTube, Twitch, Twitcasting, Niconico) into a single unified interface.

### Problem

VSPO! fans must manually check multiple streaming platforms and channels to find current and upcoming content. There is no single place that consolidates streams, clips, events, and free chats across all platforms where VSPO! members are active.

### Solution

Spodule provides a centralized schedule and content browser. It normalizes stream data from YouTube, Twitch, Twitcasting, and Niconico into a unified format, enabling fans to discover content regardless of the originating platform.

### Value Proposition

- One-stop schedule for all VSPO! streams and events
- Cross-platform content discovery (YouTube, Twitch, Twitcasting, Niconico)
- International accessibility with 5-language support
- Real-time status tracking (live, upcoming, ended)

## Target Users

| User Type | Problem | Expected Outcome |
| --- | --- | --- |
| VSPO! Fan (International) | Cannot easily find streams across platforms and languages | Unified schedule in their preferred language (en, ja, cn, tw, ko) |
| VSPO! Fan (Japanese) | Must check multiple YouTube/Twitch channels individually | One page showing all live, upcoming, and recent streams |
| Clip Viewer | Difficulty discovering fan-made clips and shorts | Browsable clip library with filtering and sorting |
| Event Follower | Misses events and special broadcasts | Event calendar with date-based browsing |

## Scope

### In Scope

- Stream schedule aggregation (live, upcoming, ended) from YouTube, Twitch, Twitcasting, Niconico
- Clip and short browsing with filtering
- Free chat room listing
- Event calendar
- Multi-language UI (en, ja, cn, tw, ko)
- Timezone-aware display
- Multiview for watching multiple streams simultaneously

### Out of Scope

- User accounts and authentication
- Chat interaction or messaging
- Stream hosting or restreaming
- Content creation tools
- Monetization features

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 |
| UI Library | React 19 |
| Styling | MUI v7 + TailwindCSS v4 |
| Deployment | Cloudflare Workers via OpenNext adapter |
| Package Manager | pnpm (monorepo) |
| i18n | 5 languages (en, ja, cn, tw, ko) |

## Internal Packages

| Package | Purpose |
| --- | --- |
| `@vspo-lab/api` | OpenAPI client for the external backend API |
| `@vspo-lab/error` | Result type for error handling (`Ok`, `Err`, `AppError`) |
| `@vspo-lab/dayjs` | Date/time utilities with timezone support |
| `@vspo-lab/logging` | Structured logging |

## Web Application

The primary web application lives at:

```
service/vspo-schedule/v2/web/
```

## Non-Functional Requirements

- **Availability**: High -- deployed on Cloudflare Workers (edge network)
- **Performance**: Sub-second page loads via edge rendering and caching
- **Internationalization**: 5-language support with locale-aware date/time formatting
- **Accessibility**: Standard web accessibility practices
- **Operations**: Serverless deployment, no infrastructure management
