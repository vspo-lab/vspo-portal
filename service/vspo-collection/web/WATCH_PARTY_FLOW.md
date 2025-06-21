# Watch Party Complete Flow Guide

This guide explains the complete flow of the Watch Party feature, from creation to viewing, including OBS integration.

## Table of Contents
1. [Overview](#overview)
2. [Host Flow](#host-flow)
3. [Viewer Flow](#viewer-flow)
4. [OBS Integration](#obs-integration)
5. [Technical Implementation](#technical-implementation)
6. [Troubleshooting](#troubleshooting)

## Overview

The Watch Party feature allows users to watch VTuber content together in real-time with synchronized playback, chat, and reactions.

### Key Features:
- 🎬 Synchronized video playback across all participants
- 💬 Real-time chat with moderation
- 🎯 Reactions and engagement tracking
- 📊 Analytics for hosts
- 🎮 OBS overlay for streamers
- 📱 Mobile-responsive design

## Host Flow

### 1. Creating a Watch Party

1. **Navigate to Watch Party Section**
   - From homepage: Click "パーティーを作成" (Create Party) button
   - From navigation: Go to `/watch-party` and click create button
   - Direct URL: Navigate to `/watch-party/host`

2. **Set Up Room**
   - Enter room details:
     - Room title
     - Select VTuber/content
     - Choose video source (YouTube, Twitch, etc.)
     - Set visibility (public/private)
   - Configure moderation settings
   - Generate room code

3. **Share Room**
   - Copy shareable URL: `https://vspo-colle.com/watch-party/[room-id]`
   - Share room code for quick access
   - Post to social media (built-in sharing)

### 2. Managing the Watch Party

**Host Dashboard Features:**
- 📊 Real-time viewer count and engagement metrics
- 🎮 Playback controls (play/pause/seek)
- 💬 Chat moderation tools
- 👥 Participant management
- 📈 Analytics dashboard
- 🎯 Reaction tracking

**Host Controls:**
```
/watch-party/host
├── Room Setup Tab
├── Video Controls
├── Chat Moderation
├── Viewer Management
├── Analytics
└── OBS Integration Settings
```

## Viewer Flow

### 1. Joining a Watch Party

**Method 1: Browse Active Parties**
1. Go to homepage or `/watch-party`
2. Browse live watch parties
3. Click "参加する" (Join) button

**Method 2: Direct Link**
1. Click shared URL
2. Automatically join the room

**Method 3: Room Code**
1. Enter room code on watch party page
2. Click join

### 2. Participating in Watch Party

**Viewer Features:**
- Synchronized video playback
- Real-time chat
- Emoji reactions
- User badges and levels
- Points system for engagement

**Viewer Interface:**
```
/watch-party/[id]
├── Video Player (synced)
├── Chat Panel
├── Reactions Bar
├── Participant List
└── Room Info
```

## OBS Integration

### Setting Up OBS Overlay

1. **Get Overlay URL**
   - In host dashboard, go to OBS Integration tab
   - Copy overlay URL: `https://vspo-colle.com/watch-party/[id]/obs`

2. **Add to OBS**
   ```
   1. Open OBS Studio
   2. Add Source → Browser Source
   3. Name: "Watch Party Overlay"
   4. URL: [paste overlay URL]
   5. Width: 1920, Height: 1080
   6. Check "Shutdown source when not visible"
   7. Check "Refresh browser when scene becomes active"
   ```

3. **Customize Overlay**
   - Position elements as needed
   - Adjust transparency
   - Configure which elements to show:
     - Chat messages
     - Reactions
     - Viewer count
     - Recent events

### Overlay Features
- Transparent background (chroma key friendly)
- Customizable positioning
- Real-time updates
- Minimal performance impact
- Auto-reconnection

## Technical Implementation

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Host Creates   │────▶│  Sync Service    │────▶│ Viewers Join    │
│   Watch Party    │     │  (WebSocket)     │     │   Real-time     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                          │
         ▼                       ▼                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Video Selection │     │ State Management │     │  Synchronized   │
│   & Controls    │     │   & Sync Logic   │     │    Playback     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Key Components

1. **Sync Service** (`/src/features/watch-party/services/syncService.ts`)
   - WebSocket connection management
   - State synchronization
   - Event broadcasting

2. **Host Dashboard** (`/src/features/watch-party/pages/HostDashboard/`)
   - Room management
   - Moderation tools
   - Analytics

3. **Video Player** (`/src/features/watch-party/components/SyncedVideoPlayer/`)
   - Multi-platform support
   - Synchronization logic
   - Buffering management

4. **OBS Overlay** (`/src/features/watch-party/pages/OBSOverlay/`)
   - Lightweight rendering
   - Real-time updates
   - Customizable layout

### Data Flow

1. **Room Creation**
   ```
   Host → Create Room → Generate ID → Initialize State → Ready
   ```

2. **Viewer Join**
   ```
   Viewer → Enter Room → Connect WebSocket → Receive State → Sync
   ```

3. **Synchronization**
   ```
   Host Action → Broadcast Event → All Clients Update → Confirm Sync
   ```

## Troubleshooting

### Common Issues

**1. Video Not Syncing**
- Check internet connection
- Refresh the page
- Ensure video is supported (YouTube/Twitch)

**2. OBS Overlay Not Showing**
- Verify URL is correct
- Check browser source settings
- Ensure overlay page is loading

**3. Chat Not Working**
- Check if room is still active
- Verify WebSocket connection
- Clear browser cache

**4. Can't Create Room**
- Check if logged in
- Verify permissions
- Try different browser

### Error States

All pages include proper error handling:
- Loading states for data fetching
- Error boundaries for crashes
- User-friendly error messages
- Retry mechanisms

### Support

For additional help:
- Check console for detailed errors
- Report issues with error messages
- Contact support with room ID

## Best Practices

### For Hosts
- Test setup before going live
- Moderate chat actively
- Use high-quality video sources
- Share room link early

### For Viewers
- Use stable internet connection
- Keep browser updated
- Enable notifications
- Participate in chat

### For Streamers (OBS)
- Test overlay before stream
- Position overlay elements carefully
- Monitor performance impact
- Use custom CSS if needed

---

## Quick Start Examples

### Host Quick Start
```bash
1. Go to https://vspo-colle.com/watch-party/host
2. Create room with your settings
3. Share the generated link
4. Start the watch party!
```

### Viewer Quick Start
```bash
1. Click shared link or browse parties
2. Join the room
3. Enjoy synchronized viewing!
```

### OBS Quick Start
```bash
1. Copy overlay URL from host dashboard
2. Add as Browser Source in OBS
3. Position and customize
4. Go live!
```