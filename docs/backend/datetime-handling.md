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
  getCurrentTimestamp,
  formatToJST,
  formatToLocalizedDate,
} from "@vspo-lab/dayjs";
```

## Frontend (Client-Side)

### Getting the Current Time

```typescript
import { getCurrentUTCDate, getCurrentTimestamp } from "@vspo-lab/dayjs";

// Get the current time as a Date object (UTC)
const now = getCurrentUTCDate();

// Get the current timestamp in milliseconds (replacement for Date.now())
const timestamp = getCurrentTimestamp();
```

### Displaying Dates to Users

For Japanese users, use the JST format:

```typescript
import { formatToJST, formatToJSTShort } from "@vspo-lab/dayjs";

// Full format: "2024年1月15日 10時30分00秒"
const fullDate = formatToJST(utcDate);

// Short format: "2024/01/15"
const shortDate = formatToJSTShort(utcDate);
```

For multilingual support:

```typescript
import { formatToLocalizedDate } from "@vspo-lab/dayjs";

// Automatically formats based on language code
const localizedDate = formatToLocalizedDate(utcDate, "ja"); // Japanese
const localizedDate = formatToLocalizedDate(utcDate, "en"); // English
const localizedDate = formatToLocalizedDate(utcDate, "ko"); // Korean
const localizedDate = formatToLocalizedDate(utcDate, "cn"); // Simplified Chinese
const localizedDate = formatToLocalizedDate(utcDate, "tw"); // Traditional Chinese
```

### Generating Filenames

```typescript
import { formatToISODate, formatToFilenameSafeISO, getCurrentUTCDate } from "@vspo-lab/dayjs";

// Date-only filename: "2024-01-15"
const dateStr = formatToISODate(getCurrentUTCDate());
const filename = `export-${sessionId}-${dateStr}.webm`;

// Filename with timestamp: "2024-01-15T10-30-00-000Z"
const timestamp = formatToFilenameSafeISO(getCurrentUTCDate());
const filename = `recording-${timestamp}.webm`;
```

### Date Filtering

```typescript
import {
  getCurrentUTCDate,
  subtractDays,
  convertToUTCDate,
  isBefore,
} from "@vspo-lab/dayjs";

// Filter items from the last 7 days
const now = getCurrentUTCDate();
const cutoffDate = subtractDays(now, 7);
const filteredItems = items.filter(
  (item) => !isBefore(convertToUTCDate(item.date), cutoffDate)
);
```

## Available Functions

### Time Retrieval

| Function | Return Type | Description |
|----------|-------------|-------------|
| `getCurrentUTCDate()` | `Date` | Returns the current UTC time as a Date object |
| `getCurrentUTCString()` | `string` | Returns the current UTC time as an ISO string |
| `getCurrentTimestamp()` | `number` | Returns the current UTC timestamp in milliseconds |
| `getCurrentYear()` | `number` | Returns the current year (UTC) |

### Conversion Functions

| Function | Return Type | Description |
|----------|-------------|-------------|
| `convertToUTC(input)` | `string` | Converts to a UTC ISO string |
| `convertToUTCDate(input)` | `Date` | Converts to a UTC Date object |
| `convertToUTCTimestamp(input, tz)` | `string` | Converts from a given timezone to UTC |

### Formatting Functions

| Function | Return Type | Description |
|----------|-------------|-------------|
| `formatToISODate(input)` | `string` | Formats as "YYYY-MM-DD" |
| `formatToFilenameSafeISO(input)` | `string` | Formats as "YYYY-MM-DDTHH-mm-ss-SSSZ" |
| `formatToJST(input)` | `string` | Formats for JST display (full) |
| `formatToJSTShort(input)` | `string` | Formats for JST display (YYYY/MM/DD) |
| `formatToLocalizedDate(input, lang)` | `string` | Formats based on language code |

### Date Arithmetic

| Function | Return Type | Description |
|----------|-------------|-------------|
| `addMillisecondsFromNow(ms)` | `Date` | Adds milliseconds to the current time |
| `addMinutes(input, minutes)` | `Date` | Adds minutes to a given date |
| `subtractDays(input, days)` | `Date` | Subtracts days from a given date |
| `subtractMinutes(input, minutes)` | `Date` | Subtracts minutes from a given date |

### Comparison Functions

| Function | Return Type | Description |
|----------|-------------|-------------|
| `isBefore(date1, date2)` | `boolean` | Returns whether date1 is before date2 |

## Supported Languages and Timezones

| Code | Locale | Timezone |
|------|--------|----------|
| `ja` | ja-JP | Asia/Tokyo |
| `en` | en-US | UTC |
| `ko` | ko-KR | Asia/Seoul |
| `cn` | zh-CN | Asia/Shanghai |
| `tw` | zh-TW | Asia/Taipei |
| `default` | ja-JP | Asia/Tokyo |

## Migration from Native Date

### Before (do not use)

```typescript
// Do not use these
const now = new Date();
const timestamp = Date.now();
const year = new Date().getFullYear();
const isoString = new Date().toISOString();
```

### After (use @vspo-lab/dayjs)

```typescript
import {
  getCurrentUTCDate,
  getCurrentTimestamp,
  getCurrentYear,
  getCurrentUTCString,
} from "@vspo-lab/dayjs";

const now = getCurrentUTCDate();
const timestamp = getCurrentTimestamp();
const year = getCurrentYear();
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
