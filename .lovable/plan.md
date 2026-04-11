

# Stop-Based Location Detection + Capacitor Native App Setup

## Problem
Browser GPS is unreliable — slow, inaccurate, and throttled when backgrounded. The driver's live location on the passenger's map lags by 30-60 seconds.

## Solution: Two Changes

### 1. Boarding Code = Location Anchor

Instead of relying solely on GPS, use the boarding code verification as a reliable location signal. When a passenger's code is verified at a stop, the system:

- Updates the driver's location to that stop's coordinates in the database and via broadcast
- Tells passengers: "Driver is between Stop X and Stop Y" based on the last verified stop
- On TrackShuttle, shows the driver marker snapped to the last confirmed stop, with a label like "At Stop 3 — Tagamoa" or "Between Stop 3 and Stop 4"

**How it works:**
- In `ActiveRide.tsx`, after `verifyBoarding` succeeds, broadcast and save the current stop's lat/lng as the driver's position
- Keep GPS running as a secondary signal, but the boarding code becomes the primary, trusted location anchor
- In `TrackShuttle.tsx`, display the stop-based location status prominently. The shuttle marker moves to the confirmed stop coordinates. Between stops, show "En route to next stop"
- When the driver advances to the next stop (clicks "Next Stop"), update the status to "Heading to Stop X"

**Files:** `src/pages/ActiveRide.tsx`, `src/pages/TrackShuttle.tsx`

### 2. Capacitor Setup for Native App

Add Capacitor so the app can be packaged as a native iOS/Android app. This also unlocks **native GPS** via `@capacitor/geolocation`, which runs in the foreground reliably without browser throttling.

**Steps:**
- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/geolocation`
- Run `npx cap init` with appId `app.lovable.58eae2d467b44835a74394a6f9cad6dd` and appName `ride-egypt-go`
- Create `capacitor.config.ts` with server URL pointing to sandbox for dev
- Update `ActiveRide.tsx` to detect Capacitor environment and use `@capacitor/geolocation` (native GPS) instead of browser `navigator.geolocation` — this gives accurate, unthrottled GPS even when backgrounded
- Add instructions for the user to run `npx cap add ios/android` and `npx cap sync`

**Files:** `capacitor.config.ts` (new), `package.json`, `src/pages/ActiveRide.tsx`

---

## Technical Summary

| Change | File | What |
|--------|------|------|
| Boarding code → location update | `ActiveRide.tsx` | After code verified, broadcast stop coords as driver location + write to DB |
| Stop-based status display | `TrackShuttle.tsx` | Show "Driver at Stop X" or "Between X and Y" instead of raw GPS dot |
| Capacitor init | `capacitor.config.ts`, `package.json` | Native app shell with geolocation plugin |
| Native GPS fallback | `ActiveRide.tsx` | Use `@capacitor/geolocation` when running as native app for reliable GPS |

