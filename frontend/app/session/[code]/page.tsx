'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSessionStore } from '@/stores/session';
import CompassView from '@/components/CompassView';
import SignalBar from '@/components/SignalBar';
import SignalOverlay from '@/components/SignalOverlay';

export default function SessionPage() {
  const router = useRouter();
  const { socket, emit } = useSocket();
  const { lat, lng, error: geoError, loading: geoLoading } = useGeolocation();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const addMember = useSessionStore((s) => s.addMember);
  const removeMember = useSessionStore((s) => s.removeMember);
  const updateMemberLocation = useSessionStore((s) => s.updateMemberLocation);
  const addSignal = useSessionStore((s) => s.addSignal);
  const clearOldSignals = useSessionStore((s) => s.clearOldSignals);
  const signals = useSessionStore((s) => s.signals);

  // Redirect if no session in store
  useEffect(() => {
    if (!sessionCode) {
      router.push('/');
    }
  }, [sessionCode, router]);

  // Socket-to-store sync
  useEffect(() => {
    if (!socket) return;

    const onMemberJoined = (data: { id: string; name: string; color: string }) => {
      addMember({ id: data.id, name: data.name, color: data.color, lat: 0, lng: 0 });
    };
    const onMemberLeft = (data: { id: string }) => {
      removeMember(data.id);
    };
    const onLocationUpdate = (data: { id: string; lat: number; lng: number }) => {
      updateMemberLocation(data.id, data.lat, data.lng);
    };
    const onSignalReceived = (data: { id: string; name: string; color: string; type: 'where' | 'coming' }) => {
      addSignal({ id: data.id, name: data.name, color: data.color, type: data.type, timestamp: Date.now() });
    };

    socket.on('member-joined', onMemberJoined);
    socket.on('member-left', onMemberLeft);
    socket.on('location-update', onLocationUpdate);
    socket.on('signal-received', onSignalReceived);

    return () => {
      socket.off('member-joined', onMemberJoined);
      socket.off('member-left', onMemberLeft);
      socket.off('location-update', onLocationUpdate);
      socket.off('signal-received', onSignalReceived);
    };
  }, [socket, addMember, removeMember, updateMemberLocation, addSignal]);

  // Location broadcasting every 3s
  useEffect(() => {
    if (lat == null || lng == null || !socket) return;

    const interval = setInterval(() => {
      emit('update-location', { lat, lng });
    }, 3000);

    // Send immediately on first fix
    emit('update-location', { lat, lng });

    return () => clearInterval(interval);
  }, [lat, lng, socket, emit]);

  // Signal sending
  const handleSendSignal = useCallback(
    (type: 'where' | 'coming') => {
      emit('send-signal', { type });
    },
    [emit],
  );

  // Signal overlay — show latest signal
  const latestSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  const handleDismissSignal = useCallback(() => {
    clearOldSignals(0);
  }, [clearOldSignals]);

  if (!sessionCode) return null;

  if (geoLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Getting your location...</p>
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <p className="text-red-400 text-center">{geoError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CompassView myLat={lat!} myLng={lng!} />
      <SignalBar onSendSignal={handleSendSignal} />
      <SignalOverlay signal={latestSignal} onDismiss={handleDismissSignal} />
    </div>
  );
}
