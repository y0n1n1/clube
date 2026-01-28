'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useSessionStore } from '@/stores/session';
import { getAvailableColors } from '@/lib/colors';
import CompassView from '@/components/CompassView';
import SignalPanel from '@/components/SignalPanel';
import OrbFocusView from '@/components/OrbFocusView';
import SignalOverlay from '@/components/SignalOverlay';
import MemberDots from '@/components/MemberDots';
import ActivityDrawer from '@/components/ActivityDrawer';
import PulseLoader from '@/components/PulseLoader';
import type { Member, SessionEvent } from '@/lib/types';

type PageState = 'loading' | 'quick-join' | 'active' | 'error';

export default function SessionPage() {
  const params = useParams();
  const urlCode = params.code as string;
  const { socket, emit, connected } = useSocket();
  const { lat, lng, error: geoError, loading: geoLoading, requestPermission } = useGeolocation();
  const { requestPermission: requestOrientation } = useDeviceOrientation();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const setSession = useSessionStore((s) => s.setSession);
  const setFullState = useSessionStore((s) => s.setFullState);
  const addMember = useSessionStore((s) => s.addMember);
  const removeMember = useSessionStore((s) => s.removeMember);
  const updateMemberLocation = useSessionStore((s) => s.updateMemberLocation);
  const addSignal = useSessionStore((s) => s.addSignal);
  const addEvent = useSessionStore((s) => s.addEvent);
  const clearOldSignals = useSessionStore((s) => s.clearOldSignals);
  const signals = useSessionStore((s) => s.signals);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const attemptedRef = useRef(false);

  // Quick-join form state
  const [joinName, setJoinName] = useState('');
  const [joinColor, setJoinColor] = useState('');

  // Load saved profile
  useEffect(() => {
    const saved = localStorage.getItem('cc-profile');
    if (saved) {
      try {
        const { name, color } = JSON.parse(saved);
        if (name) setJoinName(name);
        if (color) setJoinColor(color);
      } catch { /* ignore */ }
    }
  }, []);

  // Auto-rejoin or show quick-join
  useEffect(() => {
    if (sessionCode) { setPageState('active'); return; }
    if (!socket || !connected) return;
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const saved = localStorage.getItem('cc-session');
    if (saved) {
      try {
        const { code, memberId } = JSON.parse(saved);
        if (code === urlCode) {
          setPageState('loading');
          emit('rejoin-session', { code, memberId }, (result: { members?: Member[]; events?: SessionEvent[]; memberId?: string; name?: string; color?: string; error?: string }) => {
            if (result.error || !result.memberId) {
              localStorage.removeItem('cc-session');
              setPageState('quick-join');
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
            setPageState('active');
          });
          return;
        }
      } catch { /* ignore */ }
    }

    setPageState('quick-join');
  }, [sessionCode, socket, connected, urlCode, emit, setFullState]);

  // Quick join handler
  const handleQuickJoin = useCallback(async () => {
    if (!joinName.trim() || !joinColor || !connected) return;

    setPageState('loading');
    requestPermission();
    await requestOrientation();

    const timeout = setTimeout(() => {
      setPageState('error');
      setErrorMsg('Connection timed out');
    }, 10000);

    emit('join-session', { code: urlCode, name: joinName.trim(), color: joinColor }, (result: { code: string; memberId: string; members?: Member[] }) => {
      clearTimeout(timeout);
      setSession(result.code, result.memberId, joinName.trim(), joinColor);
      if (result.members) {
        result.members.forEach((m) => addMember(m));
      }
      localStorage.setItem('cc-session', JSON.stringify({ code: result.code, memberId: result.memberId }));
      localStorage.setItem('cc-profile', JSON.stringify({ name: joinName.trim(), color: joinColor }));
      setPageState('active');
    });
  }, [joinName, joinColor, connected, urlCode, emit, setSession, addMember, requestPermission, requestOrientation]);

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
    const onSignalReceived = (data: { id: string; name: string; color: string; type: string; message?: string }) => {
      addSignal({ id: data.id, name: data.name, color: data.color, type: data.type, message: data.message, timestamp: Date.now() });
      addEvent({ type: 'signal', memberId: data.id, memberName: data.name, memberColor: data.color, data: { signalType: data.type, message: data.message }, timestamp: Date.now() });
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

  // Location broadcasting
  useEffect(() => {
    if (lat == null || lng == null || !socket) return;
    const interval = setInterval(() => emit('update-location', { lat, lng }), 3000);
    emit('update-location', { lat, lng });
    return () => clearInterval(interval);
  }, [lat, lng, socket, emit]);

  const focusedMemberId = useSessionStore((s) => s.focusedMemberId);
  const setFocusedMember = useSessionStore((s) => s.setFocusedMember);

  const handleSendSignal = useCallback(
    (type: string, message?: string) => { emit('send-signal', { type, message }); },
    [emit],
  );

  const latestSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  const handleDismissSignal = useCallback(() => { clearOldSignals(0); }, [clearOldSignals]);

  // --- RENDER ---

  if (pageState === 'loading') {
    return <PulseLoader text="Connecting..." />;
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-zinc-400 text-sm">{errorMsg}</p>
        <button onClick={() => setPageState('quick-join')} className="rounded-full bg-white text-black font-semibold px-8 py-3 text-sm">
          Try Again
        </button>
      </div>
    );
  }

  if (pageState === 'quick-join') {
    const colors = getAvailableColors([]);
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-zinc-400 text-sm">Join session <span className="font-mono text-white">{urlCode}</span></p>

        <input
          type="text"
          placeholder="Your name"
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
          maxLength={20}
          autoFocus
          className="w-full max-w-xs bg-zinc-900 border border-zinc-800 text-white rounded-xl px-5 py-4 text-base outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-500"
        />

        <div className="flex flex-wrap justify-center gap-3 max-w-xs">
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => setJoinColor(c.hex)}
              className="w-10 h-10 rounded-full transition-all"
              style={{
                backgroundColor: c.hex,
                boxShadow: joinColor === c.hex ? '0 0 0 3px #000, 0 0 0 5px #fff' : 'none',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleQuickJoin}
          disabled={!joinName.trim() || !joinColor || !connected}
          className="w-full max-w-xs rounded-full bg-white text-black font-semibold px-8 py-4 text-base transition-opacity disabled:opacity-40"
        >
          Join
        </button>

        {!connected && <p className="text-zinc-600 text-xs">Connecting to server...</p>}
      </div>
    );
  }

  // Active session
  if (geoLoading) {
    return <PulseLoader text="Getting your location..." />;
  }

  if (geoError) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-zinc-300 text-center text-sm max-w-xs">Location access is required to see your friends.</p>
        <p className="text-zinc-500 text-center text-xs max-w-xs">{geoError}</p>
        <button onClick={requestPermission} className="rounded-full bg-white text-black font-semibold px-8 py-3 text-sm">
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
      <SignalPanel onSendSignal={handleSendSignal} />
      <SignalOverlay signal={latestSignal} onDismiss={handleDismissSignal} />
      {focusedMemberId && lat != null && lng != null && (
        <OrbFocusView
          memberId={focusedMemberId}
          myLat={lat}
          myLng={lng}
          onClose={() => setFocusedMember(null)}
          onSignal={(type) => handleSendSignal(type)}
        />
      )}
    </div>
  );
}
