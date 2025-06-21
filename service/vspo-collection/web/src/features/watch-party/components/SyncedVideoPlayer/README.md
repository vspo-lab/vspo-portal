# SyncedVideoPlayer Component

A synchronized video player component for watch parties that supports YouTube, Twitch, and other video platforms.

## Features

- **Multi-platform Support**: YouTube, Twitch (with fallback for Twitcasting and Niconico)
- **Host-controlled Playback**: Only hosts can control play/pause/seek
- **Automatic Synchronization**: Viewers automatically sync with host's playback position
- **Custom Controls**: Progress bar, volume, quality selection, playback speed
- **Picture-in-Picture**: Supported on compatible browsers
- **Fullscreen Support**: Native fullscreen mode
- **Buffering Handling**: Visual indicators for buffering state
- **Sync Status**: Shows sync offset and status for viewers

## Usage

### For Host Dashboard

```tsx
import { SyncedVideoPlayer } from './SyncedVideoPlayer';

<SyncedVideoPlayer
  video={currentVideo}
  room={watchPartyRoom}
  isHost={true}
  onPlaybackControl={handlePlaybackControl}
  onSyncUpdate={handleSyncUpdate}
  onQualityChange={handleQualityChange}
/>
```

### For Viewer Page

```tsx
import { ViewerVideoPlayer } from './ViewerVideoPlayer';

<ViewerVideoPlayer
  room={watchPartyRoom}
  currentVideo={currentVideo}
  className="w-full"
/>
```

## Integration with Sync System

The video player integrates with the WebSocket-based sync service:

1. **Host Actions**:
   - Play/pause commands are sent to all viewers
   - Seek operations trigger sync updates
   - Auto-sync sends periodic timestamp updates

2. **Viewer Synchronization**:
   - Receives sync updates via WebSocket
   - Automatically seeks to host's position if >2s out of sync
   - Shows sync status indicator

## Components

- `SyncedVideoPlayer`: Main video player component
- `VideoEmbed`: Platform-specific video embedding (YouTube/Twitch APIs)
- `VideoControls`: Custom control bar with all playback controls
- `VideoOverlay`: Buffering and sync status overlays
- `ViewerVideoPlayer`: Wrapper for viewer-side implementation

## Sync Service Hook

```tsx
const { sendSync, sendPlaybackControl, syncOffset } = useSyncService({
  roomId: room.id,
  isHost: true,
  onRoomUpdate: handleRoomUpdate,
  onSyncRequired: handleSyncRequired,
});
```

## Platform Support

### YouTube
- Uses YouTube IFrame API
- Supports quality selection
- Full playback control

### Twitch
- Uses Twitch Embed API
- VOD support only
- Custom controls overlay

### Twitcasting/Niconico
- Shows fallback UI with link to original platform
- Planned for future implementation