# Playlists Feature

This feature provides a comprehensive playlist management system for the VSPO Portal, allowing users to browse, filter, and interact with VSPO member playlists.

## Structure

```
playlists/
├── components/
│   └── PlaylistCard.tsx           # Reusable playlist card component
├── hooks/
│   ├── usePlaylists.ts           # Main playlists data management
│   └── usePlaylistDetail.ts      # Individual playlist detail management
├── pages/
│   ├── PlaylistsPage/            # Main playlists listing page
│   │   ├── container.tsx         # Business logic container
│   │   ├── presenter.tsx         # UI presentation layer
│   │   └── index.ts              # Export barrel
│   └── PlaylistDetailPage/       # Individual playlist detail page
│       ├── container.tsx         # Business logic container
│       ├── presenter.tsx         # UI presentation layer
│       └── index.ts              # Export barrel
├── types/
│   └── index.ts                  # TypeScript type definitions
├── index.ts                      # Main feature exports
└── README.md                     # This documentation
```

## Features

### Playlists Page (`/playlists`)
- **Grid Layout**: Responsive grid showing playlist cards
- **Category Filtering**: Filter by Gaming, Music, Collab, ASMR, Art, Talk, Cooking, Special
- **Sorting Options**: Popular, Recent, Most Videos, Trending, Alphabetical
- **Search Functionality**: Search by title, creator, or tags
- **Trending Section**: Highlighted trending playlists when viewing all categories
- **Interactive Cards**: Like, join watch parties, view details
- **Responsive Design**: Works on desktop, tablet, and mobile

### Playlist Detail Page (`/playlists/[id]`)
- **Detailed Info Panel**: Thumbnail, description, stats, creator info
- **Video List**: All videos in the playlist with thumbnails and metadata
- **Playback Controls**: Play all, shuffle, next/previous
- **Interactive Features**: Like videos, add to queue, remove videos
- **Follow System**: Follow/unfollow playlist creators
- **Watch Party Integration**: Create watch parties for playlists
- **Sharing**: Share playlists with others
- **Video Details**: Expandable details for each video

## Design Patterns

### Container/Presenter Pattern
Each page follows the container/presenter pattern:
- **Container**: Handles state management, API calls, business logic
- **Presenter**: Pure UI component receiving props and callbacks
- **Benefits**: Separation of concerns, easier testing, reusable presentation logic

### Custom Hooks
- **usePlaylists**: Manages playlist filtering, sorting, and data fetching
- **usePlaylistDetail**: Handles individual playlist operations and video management

## Mock Data

The feature includes comprehensive mock data that represents realistic VSPO content:
- Various playlist categories (Gaming, Music, Collab, etc.)
- Realistic view counts, like counts, and video counts
- Japanese text appropriate for VSPO theme
- Creator badges and levels
- Trending indicators

## Interactive Features

### Point System Integration
- Search: +5 points
- Category change: +2 points
- Playlist view: +10 points
- Video play: +5 points
- Like actions: +3 points
- Follow/unfollow: +10/-5 points
- Watch party creation: +25 points

### Visual Feedback
- Sparkle effects on interactions
- Hover animations
- Loading states
- Empty states
- Responsive transitions

## Usage

### Basic Usage
```tsx
import { PlaylistsPage, PlaylistDetailPage } from '../features/playlists';

// Main playlists page
<PlaylistsPage />

// Individual playlist detail
<PlaylistDetailPage playlistId="123" />
```

### With Custom Filters
```tsx
import { usePlaylists } from '../features/playlists';

const { playlists, updateFilters } = usePlaylists({
  category: 'gaming',
  sortBy: 'popular',
  searchQuery: 'APEX'
});
```

## Responsive Design

The feature is fully responsive with:
- **Mobile**: Single column grid, simplified UI
- **Tablet**: 2-column grid, condensed information
- **Desktop**: 3-4 column grid, full feature set
- **Large screens**: Optimized layout with more content

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance
- Focus management

## Future Enhancements

- Real API integration
- User-created playlists
- Advanced filtering options
- Playlist collaboration features
- Export/import functionality
- Advanced analytics
- Recommendation system improvements