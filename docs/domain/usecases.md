# Use Cases

## Priority Definitions

- **MVP**: Required for initial release
- **Phase 2**: Added after MVP launch
- **Phase 3**: Future extensions

## Use Case Catalog

| ID | Use Case | Primary Actor | Priority | Related Entities |
| --- | --- | --- | --- | --- |
| UC-001 | Browse schedule | Fan | MVP | Stream, Creator |
| UC-002 | View live/upcoming streams | Fan | MVP | Stream |
| UC-003 | Browse clips | Fan | MVP | Clip |
| UC-004 | Browse free chats | Fan | MVP | FreeChat, Creator |
| UC-005 | Browse events | Fan | MVP | Event |
| UC-006 | Search streams by ID | Fan | MVP | Stream |
| UC-007 | View multiview | Fan | Phase 2 | Stream |
| UC-008 | Change locale | Fan | MVP | -- |
| UC-009 | Change timezone display | Fan | MVP | -- |
| UC-010 | Create event | Admin | Phase 2 | Event |

---

## Use Case Details

### UC-001: Browse Schedule

- **Summary**: View a schedule of streams filtered by date, platform, status, and member type.
- **Actor**: Fan
- **Trigger**: User navigates to the schedule page or selects date/filter options.
- **Preconditions**: None.
- **Postconditions**: A list of streams matching the selected filters is displayed.

#### Basic Flow

1. User opens the schedule page.
2. System fetches streams from the API (`GET /streams`) with default filters (today's date, all platforms, all statuses).
3. System displays streams grouped or sorted by time.
4. User optionally adjusts filters (date, platform, status, memberType).
5. System re-fetches and updates the displayed list.

#### Exception Flow

1. API returns an error -- system displays an error message and retains previous results if available.
2. No streams match filters -- system displays an empty state message.

#### Input / Output

- **Input**: date (string), platform (enum, optional), status (enum, optional), memberType (enum, optional)
- **Output**: List of Stream entities

---

### UC-002: View Live/Upcoming Streams

- **Summary**: See which streams are currently live or scheduled to start soon.
- **Actor**: Fan
- **Trigger**: User opens the homepage or schedule page.
- **Preconditions**: None.
- **Postconditions**: Live and upcoming streams are prominently displayed.

#### Basic Flow

1. User opens the main page.
2. System fetches streams with `status=live` and `status=upcoming`.
3. System displays live streams first, then upcoming streams sorted by start time.

#### Exception Flow

1. No live streams -- system shows only upcoming streams with appropriate messaging.

#### Input / Output

- **Input**: None (implicit status filter)
- **Output**: List of Stream entities with status `live` or `upcoming`

---

### UC-003: Browse Clips

- **Summary**: Browse fan-made clips and shorts, with filtering and sorting options.
- **Actor**: Fan
- **Trigger**: User navigates to the clips page.
- **Preconditions**: None.
- **Postconditions**: A list of clips matching the selected filters is displayed.

#### Basic Flow

1. User opens the clips page.
2. System fetches clips from the API (`GET /clips`) with default parameters.
3. System displays clips in a grid or list layout.
4. User optionally filters by platform, clip type (clip/short), or changes sort order (by views, by date).
5. System re-fetches and updates the displayed list.

#### Input / Output

- **Input**: platform (enum, optional), clipType (clip/short, optional), order (views/date, optional)
- **Output**: List of Clip entities

---

### UC-004: Browse Free Chats

- **Summary**: View a list of standing free-chat rooms, optionally filtered by member type.
- **Actor**: Fan
- **Trigger**: User navigates to the free chats page.
- **Preconditions**: None.
- **Postconditions**: A list of free chat rooms is displayed.

#### Basic Flow

1. User opens the free chats page.
2. System fetches free chats from the API (`GET /freechats`).
3. System displays free chat rooms with creator information.
4. User optionally filters by memberType (vspo_jp, vspo_en, vspo_ch, general).

#### Input / Output

- **Input**: memberType (enum, optional)
- **Output**: List of FreeChat entities

---

### UC-005: Browse Events

- **Summary**: View scheduled events, filtered by visibility and date range.
- **Actor**: Fan
- **Trigger**: User navigates to the events page.
- **Preconditions**: None.
- **Postconditions**: A list of events matching the filters is displayed.

#### Basic Flow

1. User opens the events page.
2. System fetches events from the API (`GET /events`) with default filters (public visibility).
3. System displays events sorted by start date.
4. User optionally filters by date range or visibility.

#### Input / Output

- **Input**: visibility (enum, optional), startDate (string, optional), endDate (string, optional)
- **Output**: List of Event entities

---

### UC-006: Search Streams by ID

- **Summary**: Look up specific streams by their IDs.
- **Actor**: Fan
- **Trigger**: User submits a stream search request (e.g., via deep link or search form).
- **Preconditions**: User has one or more stream IDs.
- **Postconditions**: Matching streams are returned.

#### Basic Flow

1. User provides one or more stream IDs.
2. System sends a POST request to `/streams/search` with the IDs.
3. System displays the matching stream(s).

#### Exception Flow

1. No streams found for the given IDs -- system displays a "not found" message.

#### Input / Output

- **Input**: Array of stream IDs (string[])
- **Output**: List of matching Stream entities

---

### UC-007: View Multiview

- **Summary**: Watch multiple streams simultaneously in a grid layout.
- **Actor**: Fan
- **Trigger**: User selects multiple streams and opens multiview mode.
- **Preconditions**: At least one stream is selected; streams must have `videoPlayerLink` available.
- **Postconditions**: Multiple stream players are rendered side-by-side.

#### Basic Flow

1. User selects two or more live streams.
2. User activates multiview mode.
3. System renders embedded video players in a grid layout.
4. User can optionally toggle chat players alongside video players.

#### Exception Flow

1. A stream's `videoPlayerLink` is null -- that stream cannot be included in multiview.

#### Input / Output

- **Input**: Array of Stream entities with non-null `videoPlayerLink`
- **Output**: Grid of embedded video/chat players

---

### UC-008: Change Locale

- **Summary**: Switch the application UI language.
- **Actor**: Fan
- **Trigger**: User selects a different language from the locale picker.
- **Preconditions**: None.
- **Postconditions**: UI text updates to the selected language; preference is persisted.

#### Basic Flow

1. User opens the locale picker.
2. User selects a locale (en, ja, cn, tw, ko).
3. System updates UI text to the selected locale.
4. System persists the preference (cookie or local storage).

#### Input / Output

- **Input**: locale (en | ja | cn | tw | ko)
- **Output**: UI re-rendered in the selected language

---

### UC-009: Change Timezone Display

- **Summary**: Adjust the displayed timezone for all date/time values.
- **Actor**: Fan
- **Trigger**: User selects a different timezone from the settings.
- **Preconditions**: None.
- **Postconditions**: All timestamps in the UI are re-rendered in the selected timezone.

#### Basic Flow

1. User opens timezone settings.
2. User selects a timezone.
3. System re-renders all date/time values using the selected timezone via `@vspo-lab/dayjs`.
4. System persists the preference.

#### Input / Output

- **Input**: timezone identifier (e.g., "Asia/Tokyo", "America/New_York")
- **Output**: All timestamps displayed in the chosen timezone

---

### UC-010: Create Event (Admin)

- **Summary**: Create a new event entry via the API.
- **Actor**: Admin
- **Trigger**: Admin submits the event creation form.
- **Preconditions**: User has admin privileges.
- **Postconditions**: A new Event entity is created and visible (based on visibility setting).

#### Basic Flow

1. Admin fills in event details (title, startedDate, visibility, tags).
2. Admin optionally attaches an image (storageFileId).
3. System sends a POST request to `/events`.
4. System confirms creation and redirects to the event list.

#### Exception Flow

1. Validation fails -- system displays field-level error messages.
2. API returns an error -- system displays the error and retains form state.

#### Input / Output

- **Input**: title (string), startedDate (string), visibility (enum), tags (string[]), storageFileId (string, optional)
- **Output**: Created Event entity

---

## Open Items

| Topic | Impact | Next Action | Deadline |
| --- | --- | --- | --- |
| Multiview layout options (grid sizes, PiP) | UC-007 | Design exploration | TBD |
| Admin authentication for event management | UC-010 | Determine auth approach | TBD |
