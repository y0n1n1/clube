# Phase 1C: React Hooks

Implemented the four core React hooks for the Clubbing Compass frontend. `useGeolocation` wraps the browser Geolocation API with high-accuracy `watchPosition` and cleanup on unmount. `useDeviceOrientation` handles compass heading with iOS permission gating and Android alpha-based fallback. `useSocket` manages a singleton Socket.io connection with ref-counted lifecycle so the socket disconnects only when the last consumer unmounts. `useBearing` computes haversine distance and screen-relative bearing angle between two coordinates, adjusted for device heading.
