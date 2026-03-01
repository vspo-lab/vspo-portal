# Glossary

## Domain Terms

| Term | Code Name | Description |
| --- | --- | --- |
| Stream | `Stream` | A livestream, VOD, or broadcast from a VSPO! creator on any supported platform. Has a status lifecycle: upcoming -> live -> ended. |
| Creator | `Creator` | A VSPO! member or affiliated content creator. Has channels on one or more platforms. |
| Clip | `Clip` | A fan-made highlight clip or short video derived from stream content. Has a `type` field distinguishing `clip` from `short`. |
| Event | `Event` | A scheduled occurrence such as a tournament, collaboration, or special broadcast. Date-based rather than time-precise. |
| FreeChat | `FreeChat` | A standing free-chat room on YouTube. Structurally identical to Stream but represents a persistent chat space. |
| SiteNews | `SiteNews` | An application-local announcement or changelog entry for the Spodule service. Not sourced from the external API. |
| VSPO! | -- | A Japanese VTuber group (formally "Virtual eSports Project"). The subject of all content aggregated by this platform. |
| Spodule | -- | The public-facing name of the vspo-portal web application. Combines "VSPO" and "Schedule". |
| memberType | `memberType` | Categorization of a Creator within the VSPO! organization. Values: `vspo_jp` (main Japanese roster), `vspo_en` (English branch), `vspo_ch` (Chinese branch), `general` (affiliated/external creators). |
| platform | `platform` | The streaming service hosting a Stream, Clip, or FreeChat. Values: `youtube`, `twitch`, `twitcasting`, `niconico`, `unknown`. |
| rawId | `rawId` | The platform-native identifier for a video, stream, or channel. Used to construct direct links and embed URLs. |
| rawChannelID | `rawChannelID` | The platform-native channel identifier. Used to associate a Stream with its Creator. |
| status | `status` | The lifecycle state of a Stream. Values: `live` (currently broadcasting), `upcoming` (scheduled), `ended` (finished), `unknown`. |
| clipType | `type` on Clip | Distinguishes between standard clips (`clip`) and short-form vertical videos (`short`). |
| visibility | `visibility` | Access level of an Event. Values: `public`, `private`, `internal`. |
| locale | -- | The user's chosen UI language. Supported values: `en`, `ja`, `cn`, `tw`, `ko`. |
| multiview | -- | A feature allowing users to watch multiple streams simultaneously in a grid layout. |

## Naming Conventions

- Domain concepts use the English names from this glossary in code.
- If an abbreviation is introduced, it must be defined here.
- Synonyms are unified to a single preferred term.

## Deprecated and Synonymous Terms

| Deprecated Term | Preferred Term | Reason |
| --- | --- | --- |
| schedule | Stream list | "Schedule" is the page name; the underlying data is a list of Stream entities |
| member | Creator | "Creator" is the canonical domain term used in the API |
| video | Stream | "Stream" is the unified term covering livestreams and VODs |
| channel | Creator.channel | "Channel" refers to a platform-specific sub-object of Creator, not a standalone entity |
