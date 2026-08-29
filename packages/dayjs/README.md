# @vspo-lab/dayjs

A utility package for date manipulation and formatting using day.js. All values are
handled in UTC internally, with helpers to convert to/from a given time zone.

## Installation

```bash
pnpm add @vspo-lab/dayjs
```

## Usage

```typescript
import { convertToUTC, getCurrentUTCString, formatToLocalizedDate } from '@vspo-lab/dayjs';

// Convert an arbitrary date/string/timestamp to a UTC ISO string
const utc = convertToUTC(new Date());

// Get the current time as a UTC ISO string
const now = getCurrentUTCString();

// Format a date for a given locale/time zone (e.g. "ja")
const formatted = formatToLocalizedDate(new Date(), 'ja');
```

Other exports include `convertToUTCDate`, `convertToUTCTimestamp`,
`addDaysAndConvertToUTC`, `getEndOfDayUTC`, `getPreviousDay`, `getNextDay`, and the
`TargetLang`/`LOCALE_TIMEZONE_MAP` schema used to resolve locales and time zones.

## Dependencies

- dayjs: ^1.11.21
- zod: ^4.4.3

## Development

```bash
# Build the package
pnpm build
```

## Version

Current version: 0.1.0
