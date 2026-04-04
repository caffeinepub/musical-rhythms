# Musical Rhythms

## Current State
- LivePage.tsx: Shows live stream embed, comments, hearts/likes. Admin comments show 'S' avatar and label 'Musical Rhythms (Admin)'. No live duration timer.
- AdminPage.tsx: Has a recording panel with handleStartRecording (screen capture via getDisplayMedia + canvas composite with comments). Recording UI shows Start Recording / Stop & Download buttons. Currently the code may fail silently because getDisplayMedia requires user gesture and browser support varies; errors are caught silently.
- Admin comments in LivePage use hardcoded 'S' as the avatar letter, and label is 'Musical Rhythms (Admin)'.

## Requested Changes (Diff)

### Add
- Live duration timer at top of the live stream panel (both LivePage and Admin live tab), counting up from 00:00 like Instagram/YouTube Live. Timer starts when live becomes active and the user joins, shown as a red LIVE badge + elapsed time e.g. "LIVE  00:14:32".
- Timer in both LivePage (viewer side) and AdminPage (admin live preview section).

### Modify
- Admin comment avatar: replace the hardcoded 'S' letter with the MR logo image (`/assets/unnamed-019d39d0-d234-7035-b935-2f8115eca61d.png`) in a circle for admin comments in LivePage.
- Admin comment display name: change from 'Musical Rhythms (Admin)' to 'Sohan Jagtap (Admin)' everywhere it appears in LivePage and AdminPage (submitComment, comment rendering, pinned comment rendering, input placeholder).
- Recording fix in AdminPage: the current canvas-based composite approach is complex and may fail. Simplify to direct MediaRecorder on the screen stream (getDisplayMedia). Show two clear buttons: "Start Recording" (before recording) and when recording is active show only "Stop & Download Recording" button. Download the .webm file to the user's Downloads folder automatically on stop.

### Remove
- Nothing removed.

## Implementation Plan
1. In LivePage.tsx:
   a. Add a `liveStartTime` state that records `Date.now()` when `isLive` transitions from false to true (or when the user joins). 
   b. Add a `liveElapsed` state that increments every second via setInterval while live and joined.
   c. Render the timer as a red pill overlay at the top of the stream panel: "🔴 LIVE  MM:SS" or "HH:MM:SS".
   d. Change admin comment avatar from 'S' text to MR logo `<img>` in a circle.
   e. Change all occurrences of 'Musical Rhythms (Admin)' display name to 'Sohan Jagtap (Admin)'.
2. In AdminPage.tsx:
   a. Add live elapsed timer in the admin live preview section.
   b. Change admin comment display name to 'Sohan Jagtap (Admin)'.
   c. Fix recording: simplify handleStartRecording to use getDisplayMedia directly, pipe to MediaRecorder, on stop create blob URL and trigger download. Make error visible with alert/state. Keep the two-button UI (Start Recording / Stop & Download).
