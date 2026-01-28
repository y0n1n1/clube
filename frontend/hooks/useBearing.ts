'use client';

import { useMemo } from 'react';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

interface BearingResult {
  angle: number;
  distance: number;
}

export function useBearing(
  myLat: number | null,
  myLng: number | null,
  friendLat: number | null,
  friendLng: number | null,
  deviceHeading: number | null,
): BearingResult {
  return useMemo(() => {
    if (myLat == null || myLng == null || friendLat == null || friendLng == null) {
      return { angle: 0, distance: 0 };
    }

    const distance = haversineDistance(myLat, myLng, friendLat, friendLng);
    const geoBearing = calculateBearing(myLat, myLng, friendLat, friendLng);
    const heading = deviceHeading ?? 0;
    const angle = (geoBearing - heading + 360) % 360;

    return { angle, distance };
  }, [myLat, myLng, friendLat, friendLng, deviceHeading]);
}
