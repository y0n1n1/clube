'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceOrientationState {
  heading: number | null;
  error: string | null;
  requestPermission: () => Promise<void>;
}

export function useDeviceOrientation(): DeviceOrientationState {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permitted, setPermitted] = useState(false);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // iOS provides webkitCompassHeading directly
    if ('webkitCompassHeading' in event) {
      setHeading((event as DeviceOrientationEvent & { webkitCompassHeading: number }).webkitCompassHeading);
    } else if (event.alpha !== null) {
      // Android: heading = 360 - alpha
      setHeading(360 - event.alpha);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    // iOS 13+ requires explicit permission request
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (permission === 'granted') {
          setPermitted(true);
          setError(null);
        } else {
          setError('Device orientation permission denied.');
        }
      } catch {
        setError('Failed to request device orientation permission.');
      }
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      // Non-iOS or older iOS — no permission needed
      setPermitted(true);
    } else {
      setError('Device orientation is not supported.');
    }
  }, []);

  useEffect(() => {
    if (!permitted) return;

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [permitted, handleOrientation]);

  return { heading, error, requestPermission };
}
