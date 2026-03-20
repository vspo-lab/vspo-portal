# Date/Time Handling Guidelines

This document defines the date and time handling conventions for the application.

## Core Principles

1. **UTC as the standard**: All timestamps and stored dates use UTC.
2. **Localized display**: The frontend displays dates in the user's locale and timezone based on language settings.
3. **Always use `@vspo-lab/dayjs`**: Use the shared dayjs package instead of the native `Date` object.

## Package: `@vspo-lab/dayjs`

The `@vspo-lab/dayjs` package provides consistent date/time utilities across the entire application.

### Import

```typescript
import {
  getCurrentUTCDate,
  getCurrentUTCString,
  convertToUTC,
  convertToUTCDate,
  convertToUTCTimestamp,
  formatToLocalizedDate,
  addDaysAndConvertToUTC,
  getEndOfDayUTC,
  getPreviousDay,
} from "@vspo-lab/dayjs";
```

## Frontend (Client-Side)

### Getting the Current Time

```typescript
import { getCurrentUTCDate, getCurrentUTCString } from "@vspo-lab/dayjs";

// Get the current time as a Date object (UTC)
const now = getCurrentUTCDate();

// Get the current time as an ISO string (UTC)
const isoString = getCurrentUTCString();
```

### Displaying Dates to Users

Use `formatToLocalizedDate` for locale-aware display:

```typescript
import { formatToLocalizedDate } from "@vspo-lab/dayjs";

// Automatically formats based on language code
const jaDate = formatToLocalizedDate(utcDate, "ja"); // Japanese (JST)
const enDate = formatToLocalizedDate(utcDate, "en"); // English (UTC)
const koDate = formatToLocalizedDate(utcDate, "ko"); // Korean (KST)
const cnDate = formatToLocalizedDate(utcDate, "cn"); // Simplified Chinese (CST)
const twDate = formatToLocalizedDate(utcDate, "tw"); // Traditional Chinese (CST)
```

### Date Arithmetic

```typescript
import {
  addDaysAndConvertToUTC,
  getEndOfDayUTC,
  getPreviousDay,
} from "@vspo-lab/dayjs";

// Add days and convert to UTC string
const futureDate = addDaysAndConvertToUTC("2024-01-15", 7, "Asia/Tokyo");

// Get end of day in a timezone, as UTC
const endOfDay = getEndOfDayUTC("2024-01-15", "Asia/Tokyo");

// Get the previous day in a timezone
const yesterday = getPreviousDay("2024-01-15", "Asia/Tokyo"); // "2024-01-14"
```

## Available Functions

### Time Retrieval

| Function | Return Type | Description |
|----------|-------------|-------------|
| `getCurrentUTCDate()` | `Date` | Returns the current UTC time as a Date object |
| `getCurrentUTCString()` | `string` | Returns the current UTC time as an ISO string |

### Conversion Functions

| Function | Return Type | Description |
|----------|-------------|-------------|
| `convertToUTC(input)` | `string` | Converts to a UTC ISO string |
| `convertToUTCDate(input)` | `Date` | Converts to a UTC Date object |
| `convertToUTCTimestamp(input, tz)` | `string` | Converts from a given timezone to UTC |

### Formatting Functions

| Function | Return Type | Description |
|----------|-------------|-------------|
| `formatToLocalizedDate(input, lang)` | `string` | Formats based on language code and timezone |

### Date Arithmetic

| Function | Return Type | Description |
|----------|-------------|-------------|
| `addDaysAndConvertToUTC(dateStr, days, tz)` | `string` | Adds days in a timezone, returns UTC string |
| `getEndOfDayUTC(dateStr, tz)` | `string` | End of day in a timezone, as UTC string |
| `getPreviousDay(dateStr, tz)` | `string` | Previous day in a timezone (YYYY-MM-DD) |

## Supported Languages and Timezones

| Code | Locale | Timezone |
|------|--------|----------|
| `en` | en-US | UTC |
| `ja` | ja-JP | Asia/Tokyo |
| `fr` | fr-FR | Europe/Paris |
| `de` | de-DE | Europe/Berlin |
| `es` | es-ES | Europe/Madrid |
| `cn` | zh-CN | Asia/Shanghai |
| `tw` | zh-TW | Asia/Taipei |
| `ko` | ko-KR | Asia/Seoul |
| `default` | ja-JP | Asia/Tokyo |

## Migration from Native Date

### Before (do not use)

```typescript
// Do not use these
const now = new Date();
const isoString = new Date().toISOString();
```

### After (use @vspo-lab/dayjs)

```typescript
import {
  getCurrentUTCDate,
  getCurrentUTCString,
} from "@vspo-lab/dayjs";

const now = getCurrentUTCDate();
const isoString = getCurrentUTCString();
```

## Testing

When testing time-dependent code, use Vitest fake timers.

```typescript
import { beforeEach, afterEach, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-15T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
```

Note: Functions from `@vspo-lab/dayjs` use dayjs internally, which respects the mocked system time. They work correctly with Vitest fake timers.
