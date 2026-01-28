'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSessionStore } from '@/stores/session';
import CompassView from '@/components/CompassView';
import SignalBar from '@/components/SignalBar';
import SignalOverlay from '@/components/SignalOverlay';
import MemberDots from '@/components/MemberDots';
import ActivityDrawer from '@/components/ActivityDrawer';
import type { Member, SessionEvent } from '@/lib/types';

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const urlCode = params.code as string;
  const { socket, emit } = useSocket();
  const { lat, lng, error: geoError, loading: geoLoading, requestPermission } = useGeolocation();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const setFullState = useSessionStore((s) => s.setFullState);
  const addMember = useSessionStore((s) => s.addMember);
  const removeMember = useSessionStore((s) => s.removeMember);
  const updateMemberLocation = useSessionStore((s) => s.updateMemberLocation);
  const addSignal = useSessionStore((s) => s.addSignal);
  const addEvent = useSessionStore((s) => s.addEvent);
  const clearOldSignals = useSessionStore((s) => s.clearOldSignals);
  const signals = useSessionStore((s) => s.signals);

  const [rejoining, setRejoining] = useState(false);

  // Auto-rejoin from localStorage if store is empty
  useEffect(() => {
    if (sessionCode) return; // already have a session
    if (!socket) return;

    const saved = localStorage.getItem('cc-session');
    if (!saved) {
      router.push('/');
      return;
    }

    try {
      const { code, memberId } = JSON.parse(saved);
      if (code !== urlCode) {
        localStorage.removeItem('cc-session');
        router.push('/');
        return;
      }

      setRejoining(true);
      emit('rejoin-session', { code, memberId }, (result: { members?: Member[]; events?: SessionEvent[]; memberId?: string; name?: string; color?: string; error?: string }) => {
        if (result.error || !result.memberId) {
          localStorage.removeItem('cc-session');
          router.push('/');
          return;
        }
        setFullState({
          code,
          myId: result.memberId,
          name: result.name || '',
          color: result.color || '',
          members: result.members || [],
          events: result.events || [],
        });
        setRejoining(false);
      });
    } catch {
      localStorage.removeItem('cc-session');
      router.push('/');
    }
  }, [sessionCode, socket, urlCode, router, emit, setFullState]);

  // Socket-to-store sync
  useEffect(() => {
    if (!socket) return;

    const onMemberJoined = (data: { id: string; name: string; color: string }) => {
      addMember({ id: data.id, name: data.name, color: data.color, lat: 0, lng: 0 });
      addEvent({ type: 'member-joined', memberId: data.id, memberName: data.name, memberColor: data.color, timestamp: Date.now() });
    };
    const onMemberLeft = (data: { id: string }) => {
      const members = useSessionStore.getState().members;
      const member = members[data.id];
      removeMember(data.id);
      if (member) {
        addEvent({ type: 'member-left', memberId: data.id, memberName: member.name, memberColor: member.color, timestamp: Date.now() });
      }
    };
    const onLocationUpdate = (data: { id: string; lat: number; lng: number }) => {
      updateMemberLocation(data.id, data.lat, data.lng);
    };
    const onSignalReceived = (data: { id: string; name: string; color: string; type: 'where' | 'coming' }) => {
      addSignal({ id: data.id, name: data.name, color: data.color, type: data.type, timestamp: Date.now() });
      addEvent({ type: 'signal', memberId: data.id, memberName: data.name, memberColor: data.color, data: { signalType: data.type }, timestamp: Date.now() });
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
  }, [socket, addMember, removeMember, updateMemberLocation, addSignal, addEvent]);

  // Location broadcasting every 3s
  useEffect(() => {
    if (lat == null || lng == null || !socket) return;

    const interval = setInterval(() => {
      emit('update-location', { lat, lng });
    }, 3000);

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

  // Signal overlay
  const latestSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  const handleDismissSignal = useCallback(() => {
    clearOldSignals(0);
  }, [clearOldSignals]);

  if (!sessionCode && !rejoining) return null;

  if (rejoining) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Reconnecting...</p>
      </div>
    );
  }

  if (geoLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Getting your location...</p>
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-zinc-300 text-center text-sm max-w-xs">
          Location access is required to see your friends.
        </p>
        <p className="text-zinc-500 text-center text-xs max-w-xs">
          {geoError}
        </p>
        <button
          onClick={requestPermission}
          className="rounded-full bg-white text-black font-semibold px-8 py-3 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CompassView myLat={lat!} myLng={lng!} />
      <MemberDots />
      <ActivityDrawer />
      <SignalBar onSendSignal={handleSendSignal} />
      <SignalOverlay signal={latestSignal} onDismiss={handleDismissSignal} />
    </div>
  );
}
