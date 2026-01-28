# Clubbing Compass — Build Plan

## Architecture Overview

- **Frontend**: Next.js 14 (App Router) + Tailwind + Framer Motion + Zustand + Socket.io-client
- **Backend**: Express + Socket.io (in-memory sessions, no DB)

---

## Phase 0: Project Scaffolding (SEQUENTIAL — do this first, alone)

- [ ] `npx create-next-app@14` with App Router + Tailwind
- [ ] Install deps: `framer-motion zustand socket.io-client`
- [ ] Create `/server` dir, init with `express`, `socket.io`, `cors`
- [ ] Set up basic file structure (empty files for all components/hooks/lib/stores)
- [ ] Git commit: "scaffold"

---

## Phase 1: Pure Logic — NO UI dependencies between these (PARALLEL: 4 instances)

### Instance A: Socket.io Server (`/server`)
- [ ] Express + Socket.io server setup (`server/index.ts`)
- [ ] Session manager: create session (generate 6-digit code), join session, leave session
- [ ] Location broadcast handler: receive location, relay to all session members
- [ ] Signal broadcast handler: receive signal type, relay to session
- [ ] Member list management (name, color, id per session, max 12)
- [ ] Auto-cleanup: remove session when empty
- [ ] Test with a simple socket client script

**Files**: `server/index.ts`, `server/sessionManager.ts`
**Depends on**: Phase 0 only
**Interface contract**:
```
Events (client→server):
  create-session { name, color } → { code, memberId }
  join-session { code, name, color } → { members[], memberId }
  update-location { lat, lng } → (broadcast to others)
  send-signal { type: "where" | "coming" } → (broadcast to others)
  disconnect → (auto-leave)

Events (server→client):
  member-joined { id, name, color }
  member-left { id }
  location-update { id, lat, lng }
  signal-received { id, name, color, type }
  error { message }
```

### Instance B: Math & Config Utils (`/lib`)
- [ ] `lib/bearing.ts` — Haversine distance + bearing calculation between two lat/lng pairs
- [ ] `lib/colors.ts` — 12 color definitions (hex + glow rgba), color picker helper
- [ ] `lib/springs.ts` — Framer Motion spring configs (orb movement, signal bar, pulse)
- [ ] `lib/distance.ts` — Distance-to-orb-props mapping (size, glow, pulse speed, show name)

**Files**: `lib/bearing.ts`, `lib/colors.ts`, `lib/springs.ts`, `lib/distance.ts`
**Depends on**: Phase 0 only
**No external deps** — pure functions, fully testable

### Instance C: React Hooks (`/hooks`)
- [ ] `hooks/useGeolocation.ts` — Browser geolocation API, returns `{ lat, lng, error, requestPermission }`
- [ ] `hooks/useDeviceOrientation.ts` — DeviceOrientation API, returns compass heading in degrees, handles iOS permission request
- [ ] `hooks/useSocket.ts` — Socket.io connection manager, exposes `emit` and event listeners, handles connect/disconnect
- [ ] `hooks/useBearing.ts` — Given own lat/lng + friend lat/lng + device heading → screen angle + distance

**Files**: `hooks/useGeolocation.ts`, `hooks/useDeviceOrientation.ts`, `hooks/useSocket.ts`, `hooks/useBearing.ts`
**Depends on**: Phase 0 only. Uses types from lib/bearing.ts but can define inline types first.

### Instance D: Zustand Store (`/stores`)
- [ ] `stores/session.ts` — Full session state:
  - `myId`, `myName`, `myColor`
  - `sessionCode`
  - `members: Map<id, { name, color, lat, lng }>`
  - `signals: { id, name, color, type, timestamp }[]`
  - Actions: `setSession`, `addMember`, `removeMember`, `updateMemberLocation`, `addSignal`, `clearOldSignals`

**Files**: `stores/session.ts`
**Depends on**: Phase 0 only

---

## Phase 2: UI Components — no cross-component deps (PARALLEL: 3 instances)

### Instance E: Landing Page + Join Flow (`/app/page.tsx`, `/components/JoinForm.tsx`, `/components/CodeDisplay.tsx`)
- [ ] Landing page: two buttons — "Start Session" / "Join Session"
- [ ] JoinForm: name input + color picker (12 color circles) + code input (for join)
- [ ] CodeDisplay: big 6-digit code display + native share button
- [ ] Wire up socket create/join, navigate to `/session/[code]` on success
- [ ] Request geolocation + device orientation permissions here

**Depends on**: Phase 1 (store, useSocket, colors.ts)

### Instance F: Orb + CompassView (`/components/Orb.tsx`, `/components/CompassView.tsx`)
- [ ] `Orb.tsx`: Radial gradient, glow, lighting effect (top highlight, bottom shadow), pulse animation. Props: `color`, `size`, `glowIntensity`, `pulseSpeed`, `name`, `distance`, `showName`, `angle`
- [ ] `CompassView.tsx`: Container that positions orbs around center based on bearing angle + distance. Center white dot = you. Uses `useBearing` + `useDeviceOrientation` + store members.
- [ ] Orb positioning: convert angle + distance → x,y coords on screen (distance scaled to fit viewport)
- [ ] Framer Motion spring physics for smooth orb movement

**Depends on**: Phase 1 (distance.ts, bearing.ts, springs.ts, store, hooks)

### Instance G: Signal Bar + Signal Overlay (`/components/SignalBar.tsx`, `/components/SignalOverlay.tsx`)
- [ ] `SignalBar.tsx`: Hidden by default, 4px pill at bottom, tap to reveal two buttons (❓ 👋), tap signal to send + auto-hide
- [ ] `SignalOverlay.tsx`: Full-screen overlay when signal received — shows sender name, color, signal type, auto-dismiss after 3s
- [ ] Wire to socket `send-signal` / `signal-received`
- [ ] Framer Motion slide-up animation for bar

**Depends on**: Phase 1 (store, useSocket, springs.ts)

---

## Phase 3: Integration + Session Page (SEQUENTIAL — 1 instance)

### Instance H: Wire Everything Together
- [ ] `/app/session/[code]/page.tsx` — Compose CompassView + SignalBar + SignalOverlay
- [ ] Connect useSocket to store (sync incoming events to Zustand)
- [ ] Connect useGeolocation to socket (broadcast location every 3s)
- [ ] Handle edge cases: session not found, member kicked, location denied
- [ ] Test full flow: create → join → see orbs → send signals

**Depends on**: Phase 2 complete

---

## Phase 4: Deploy (SEQUENTIAL)
- [ ] Backend → Railway (or Render)
- [ ] Frontend → Vercel
- [ ] Set `NEXT_PUBLIC_SOCKET_URL` env var
- [ ] Test on 2-3 real phones
- [ ] Fix bugs
- [ ] Git tag: v1.0

---

## Dependency Graph

```
Phase 0 (scaffold)
    │
    ├──→ Instance A (server)     ─┐
    ├──→ Instance B (lib/math)    ├──→ Phase 2 ──→ Phase 3 ──→ Phase 4
    ├──→ Instance C (hooks)      ─┤
    └──→ Instance D (store)      ─┘
              │
              ├──→ Instance E (landing/join)  ─┐
              ├──→ Instance F (orb/compass)    ├──→ Instance H (integration)
              └──→ Instance G (signals UI)    ─┘
```

## Key Interface Contracts

All instances MUST use these shared types (create `lib/types.ts` in Phase 0):

```typescript
export interface Member {
  id: string;
  name: string;
  color: string;
  lat: number;
  lng: number;
}

export interface Signal {
  id: string;
  name: string;
  color: string;
  type: 'where' | 'coming';
  timestamp: number;
}

export interface SessionState {
  code: string;
  myId: string;
  members: Record<string, Member>;
}
```
