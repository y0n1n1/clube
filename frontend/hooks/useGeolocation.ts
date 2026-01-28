'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => void;
}

export function useGeolocation(): GeolocationState {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const retryRef = useRef<number>(0);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Try high accuracy first, fall back to low accuracy on failure
    const highAccuracy = retryRef.current === 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setError(null);
        setLoading(false);
        retryRef.current = 0;
      },
      (err) => {
        // POSITION_UNAVAILABLE — retry with low accuracy
        if (err.code === 2 && retryRef.current < 2) {
          retryRef.current++;
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
          // Retry with low accuracy and longer timeout
          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              setLat(position.coords.latitude);
              setLng(position.coords.longitude);
              setError(null);
              setLoading(false);
            },
            (retryErr) => {
              setError(retryErr.code === 1
                ? 'Location permission denied. Please enable location in your browser settings.'
                : 'Could not determine your location. Make sure location services are enabled.');
              setLoading(false);
            },
            { enableHighAccuracy: false, maximumAge: 30000, timeout: 30000 },
          );
          return;
        }

        setError(err.code === 1
          ? 'Location permission denied. Please enable location in your browser settings.'
          : 'Could not determine your location. Make sure location services are enabled.');
        setLoading(false);
      },
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: 5000,
        timeout: 15000,
      },
    );
  }, []);

  const requestPermission = useCallback(() => {
    retryRef.current = 0;
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatching]);

  return { lat, lng, error, loading, requestPermission };
}
