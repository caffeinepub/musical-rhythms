# Musical Rhythms

## Current State
- Live page has comment box, floating heart animation, and 'Send Heart' button
- Admin panel has screen recording via `getDisplayMedia` (screen only, no comment overlay)
- When live ends, `clearAllLiveComments()` is called — but hearts (liveHearts doc) are NOT reset
- Admin commenter displays as 'Soham (Creator)' in some places, but 'admin' label appears elsewhere
- 'Send Heart' / like button is visible even when live is off
- Hearts from previous live sessions persist in Firestore
- Screen recording only captures the screen, not the in-app comment overlay

## Requested Changes (Diff)

### Add
- `resetLiveHearts()` function in firebaseService to zero-out the liveHearts document
- Screen recording that composites the live video iframe + comment overlay onto a canvas so the downloaded recording includes comments

### Modify
- When admin ends live (`handleClearLiveUrl`): also call `clearAllLiveComments()` AND `resetLiveHearts()` so Firebase is fully cleaned up
- Rename 'Send Heart' button label to 'Like' everywhere (LivePage and AdminPage)
- Hide the Like button entirely when live is NOT active (both user LivePage and admin LivePage section)
- Admin comment author name: use 'Musical Rhythms (Admin)' consistently everywhere
- Screen recording in AdminPage: use canvas-based compositing — capture the live iframe + comments panel as a canvas stream so the recording includes comments

### Remove
- Nothing removed

## Implementation Plan
1. Add `resetLiveHearts()` to firebaseService.ts — sets the liveHearts doc count and lastAt to 0
2. In AdminPage `handleClearLiveUrl`: after clearLiveUrl(), also call clearAllLiveComments() and resetLiveHearts()
3. In LivePage: rename all 'Send Heart' / heart button labels to 'Like'; hide the button when `!isLive`
4. In AdminPage live section: same rename and hide-when-not-live
5. Fix admin comment author: ensure 'Musical Rhythms (Admin)' is used in both LivePage and AdminPage when isAdmin=true
6. Fix screen recording: use `getDisplayMedia` with a canvas overlay approach — capture the entire app tab/window so comments are naturally included in the recording (simplest reliable approach)
