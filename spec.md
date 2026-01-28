# Clubbing Compass — MVP Spec

## The One Use Case

**You're at a venue. You open the app. Glowing orbs point to your friends.**

That's it. Everything else is friction.

---

## Design Principles Applied

### 1. Light Comes From the Sky

Orbs aren't flat circles — they're lit from above:
- Top edge: brighter highlight (reflects sky/ceiling light)
- Bottom edge: subtle shadow/darker gradient
- Glow aura casts downward, not uniformly

```
     ╭─────╮  ← lighter top edge
    │  ◉  │  ← color fills center
     ╰─────╯  ← darker bottom, shadow beneath
        ░░   ← glow diffuses downward
```

### 2. Black and White First

Design the entire UI in grayscale. Color exists ONLY for:
- Friend orbs (their identity)
- Nothing else

Everything else is white text on black:
- Background: `#000000` (OLED true black)
- Primary text: `#FFFFFF`
- Secondary text: `#A1A1AA` (zinc-400)
- Borders/dividers: `#27272A` (zinc-800)

No colored buttons. No accent colors. Friend colors ARE the accent.

### 3. Double Your Whitespace

The original spec crammed too much. Strip it:
- No header
- No visible nav
- No labels unless essential
- Orb names only appear <50m
- Distance is the only text per orb

Screen is 90% black with floating orbs. That's the whitespace.

### 4. Simplify Interactions

Remove gesture complexity for MVP:
- Tap bottom edge → signal bar slides up
- Tap anywhere else → signal bar hides
- That's it

No swipe-from-left drawer. No long press. No shake detection. Add those in v2.

---

## MVP Feature Cut

| Keep | Cut |
|------|-----|
| Create session (6-digit code) | QR code generation |
| Join session | QR scanning |
| Compass view with orbs | Map view |
| Distance + direction | Member drawer |
| 2 signals only | 5 signals |
| Basic proximity scaling | Color meshing effect |
| | Invisible mode |
| | Reconnection flow |
| | SOS/safety features |

### Two Signals Only

| Signal | Meaning |
|--------|---------|
| ❓ | "Where is everyone?" |
| 👋 | "Coming to you" |

That's enough for v1. Two big buttons. No confusion.

---

## Visual Spec

### Orb Design (The Hero Element)

```
Size: 48-80px based on distance
Shape: Circle with radial gradient

Gradient structure:
  - Center: friend color at 100% opacity
  - Edge: friend color at 0% opacity (feathers out)
  
Lighting effect:
  - Inner shadow at bottom (rgba(0,0,0,0.3))
  - Subtle highlight arc at top (rgba(255,255,255,0.15))

Glow:
  - box-shadow: 0 4px 30px {friendColor}40
  - filter: blur() on a separate layer behind orb

Pulse animation:
  - Scale: 1.0 → 1.08 → 1.0
  - Opacity of glow: 0.3 → 0.5 → 0.3
  - Duration: distance-based (far=slow, close=fast)
```

### Typography

```
Font: Inter (system fallback: -apple-system)
Weights: 400 (normal), 600 (semibold)

Hierarchy:
- Session code: 48px, 600 weight, letter-spacing: 0.1em
- Distance: 14px, 600 weight
- Name: 12px, 400 weight, zinc-400
- Signal text: 16px, 400 weight
```

### Distance-Based Orb States

| Distance | Size | Glow Intensity | Pulse Speed | Show Name? |
|----------|------|----------------|-------------|------------|
| >100m | 48px | 20% | 3s | No |
| 50-100m | 56px | 35% | 2s | No |
| 20-50m | 64px | 50% | 1.2s | Yes |
| <20m | 80px | 70% | 0.6s | Yes |
| <5m | 80px | 100% | 0.3s | Yes + "HERE" |

### Screen Layout

```
┌────────────────────────────────┐
│                                │
│                                │
│          ◉                     │  ← Friend orb (positioned by bearing)
│         12m                    │
│                                │
│                                │
│               ●                │  ← You: small white dot, always center
│                                │
│                    ◉           │
│                   47m          │
│                                │
│                                │
│                                │
│         ┌─────┬─────┐          │
│         │  ❓  │  👋  │          │  ← Signal bar (tap to reveal)
│         └─────┴─────┘          │
└────────────────────────────────┘
```

Signal bar:
- Initially hidden (just a subtle 4px pill indicator at bottom)
- Tap indicator → bar slides up (200ms, spring easing)
- Tap signal → sends, bar auto-hides after 300ms
- Tap outside bar → hides

---

## Tech Stack

### Frontend

```
Framework: Next.js 14 (App Router)
Styling: Tailwind CSS
Animation: Motion (Framer Motion v11)
State: Zustand
Real-time: Socket.io-client
```

### Why Motion (Framer Motion)?

Perfect for this use case:
- Spring physics for orb movement (feels organic, not robotic)
- `layout` prop for automatic position transitions
- `AnimatePresence` for orbs entering/leaving
- Built-in gesture handling for signal bar

```tsx
// Orb movement with spring physics
<motion.div
  animate={{ 
    x: orbPosition.x, 
    y: orbPosition.y,
    scale: proximityScale 
  }}
  transition={{ 
    type: "spring", 
    stiffness: 100, 
    damping: 15 
  }}
/>
```

### Why NOT React Three Fiber?

Overkill. We're not doing:
- 3D objects
- Complex lighting
- Physics simulations

CSS + Motion can achieve the orb glow effect with:
- Radial gradients
- Box shadows
- CSS filters (blur)

Save R3F for v2 AR mode.

### Backend

```
Runtime: Node.js
Framework: Express
WebSocket: Socket.io
Hosting: Railway (free tier)
```

No database. Sessions in memory. Simple.

---

## File Structure

```
/app
  page.tsx                 — Landing (create/join)
  /session/[code]
    page.tsx               — Compass view
    
/components
  Orb.tsx                  — Single friend orb
  CompassView.tsx          — Orb container + positioning logic
  SignalBar.tsx            — Bottom signal picker
  SignalOverlay.tsx        — Full-screen signal received
  JoinForm.tsx             — Name + color picker
  CodeDisplay.tsx          — Big 6-digit code for sharing

/hooks
  useGeolocation.ts        — Browser location
  useDeviceOrientation.ts  — Compass heading
  useSocket.ts             — WebSocket connection
  useBearing.ts            — Calculate bearing to friends

/lib
  bearing.ts               — Haversine math
  colors.ts                — 12 color definitions
  springs.ts               — Motion spring configs

/stores
  session.ts               — Zustand store
```

---

## Color Palette (12 Friends)

Designed for OLED black background, passing WCAG AA:

| Name | Hex | Glow (40% opacity) |
|------|-----|-----|
| Blue | #60A5FA | rgba(96,165,250,0.4) |
| Green | #4ADE80 | rgba(74,222,128,0.4) |
| Pink | #F472B6 | rgba(244,114,182,0.4) |
| Purple | #A78BFA | rgba(167,139,250,0.4) |
| Amber | #FBBF24 | rgba(251,191,36,0.4) |
| Cyan | #22D3EE | rgba(34,211,238,0.4) |
| Rose | #FB7185 | rgba(251,113,133,0.4) |
| Lime | #A3E635 | rgba(163,230,53,0.4) |
| Orange | #FB923C | rgba(251,146,60,0.4) |
| Teal | #2DD4BF | rgba(45,212,191,0.4) |
| Indigo | #818CF8 | rgba(129,140,248,0.4) |
| Fuchsia | #E879F9 | rgba(232,121,249,0.4) |

Note: Using Tailwind's 400-weight variants (brighter) rather than 500, because they pop better on pure black.

---

## User Flow (Simplified)

### Host

```
1. Open app
2. Tap "Start"
3. Allow location + motion
4. Enter name, pick color
5. See 6-digit code + share button
6. Wait for friends (see them appear as orbs)
```

### Guest

```
1. Get code from friend
2. Open app
3. Tap "Join", enter code
4. Allow location + motion
5. Enter name, pick color
6. See host + other friends as orbs
```

### During Session

```
1. Walk around
2. Watch orbs move in real-time
3. Tap bottom to reveal signals
4. Tap ❓ to ask "where is everyone?"
5. See overlay when someone signals
6. Find friends
```

---

## Implementation Order

### Day 1: Foundation
- [ ] Next.js project setup with Tailwind
- [ ] Landing page (create/join buttons)
- [ ] Join form (name + color picker)
- [ ] Code display component
- [ ] Socket.io server (create/join/leave)

### Day 2: Core Loop
- [ ] useGeolocation hook
- [ ] useDeviceOrientation hook
- [ ] Bearing calculation
- [ ] Basic orb rendering (position by bearing)
- [ ] Location broadcasting every 3s

### Day 3: Polish
- [ ] Orb styling (gradients, glow, shadows)
- [ ] Motion animations (spring physics)
- [ ] Distance-based orb scaling
- [ ] Pulse animation
- [ ] Signal bar + overlay

### Day 4: Ship
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway
- [ ] Test with 2-3 phones
- [ ] Fix bugs
- [ ] Share with friends

---

## What "Done" Looks Like

You can:
1. Create a session, get a code
2. Friend joins with the code
3. You both see each other as colored orbs
4. Orbs point in the right direction
5. Distance updates as you walk
6. Orbs get bigger/brighter as you get closer
7. You can tap to send "where is everyone?"
8. They see the signal and can respond

That's the MVP. Everything else is v2.