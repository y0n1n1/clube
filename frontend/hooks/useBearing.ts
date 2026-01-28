'use client';

import { useMemo } from 'react';
import { haversineDistance, calculateBearing } from '@/lib/bearing';

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
