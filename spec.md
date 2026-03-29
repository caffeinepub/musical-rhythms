# Musical Rhythms

## Current State
All app data (songs, albums, social profiles, live stream URL) is stored in `localStorage` — a per-device, per-browser storage bucket. This means data added on one device is invisible to all other devices. The Motoko backend was empty (`actor {}`).

## Requested Changes (Diff)

### Add
- Full Motoko backend with stable storage for songs, albums, social profiles, and live stream URL
- Backend functions: getSongs/addSong/deleteSong, getAlbums/addAlbum/deleteAlbum, getSocialProfiles/addSocialProfile/updateSocialProfile/deleteSocialProfile, getLiveUrl/setLiveUrl/clearLiveUrl
- Data migration: on first load, if localStorage has existing data, migrate it to the backend and clear localStorage

### Modify
- `App.tsx`: load songs, albums, social profiles from backend on mount; all mutations go to backend; remove localStorage sync for these
- `AdminPage.tsx`: addSong/deleteAlbum etc. call backend directly; social profile mutations call backend
- `LivePage.tsx`: already updated in previous fix to use backend
- `HomePage.tsx`: already updated in previous fix to use backend

### Remove
- All `localStorage.setItem/getItem` calls for songs, albums, socialProfiles
- The `loadSongs`, `loadAlbums`, `loadSocialProfiles` functions that read from localStorage

## Implementation Plan
1. Backend already written with all CRUD functions
2. Update App.tsx to load all data from backend on mount using useEffect, show loading state
3. Update App.tsx mutation handlers (setSongs, setAlbums, setSocialProfiles) to call backend
4. Update AdminPage.tsx to call backend directly for add/delete operations
5. Validate and build
