'use client';

import { create } from 'zustand';
import type { Member, Signal, SessionEvent } from '@/lib/types';

interface SessionStore {
  myId: string | null;
  myName: string | null;
  myColor: string | null;
  sessionCode: string | null;
  members: Record<string, Member>;
  signals: Signal[];
  events: SessionEvent[];

  setSession: (code: string, myId: string, name: string, color: string) => void;
  setFullState: (data: { code: string; myId: string; name: string; color: string; members: Member[]; events: SessionEvent[] }) => void;
  addMember: (member: Member) => void;
  removeMember: (id: string) => void;
  updateMemberLocation: (id: string, lat: number, lng: number) => void;
  addSignal: (signal: Signal) => void;
  clearOldSignals: (maxAgeMs?: number) => void;
  addEvent: (event: SessionEvent) => void;
  focusedMemberId: string | null;
  setFocusedMember: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  myId: null as string | null,
  myName: null as string | null,
  myColor: null as string | null,
  sessionCode: null as string | null,
  members: {} as Record<string, Member>,
  signals: [] as Signal[],
  events: [] as SessionEvent[],
  focusedMemberId: null as string | null,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setSession: (code, myId, name, color) =>
    set({ sessionCode: code, myId, myName: name, myColor: color }),

  setFullState: (data) =>
    set({
      sessionCode: data.code,
      myId: data.myId,
      myName: data.name,
      myColor: data.color,
      members: Object.fromEntries(data.members.map(m => [m.id, m])),
      events: data.events,
    }),

  addMember: (member) =>
    set((s) => ({ members: { ...s.members, [member.id]: member } })),

  removeMember: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.members;
      return { members: rest };
    }),

  updateMemberLocation: (id, lat, lng) =>
    set((s) => {
      if (!s.members[id]) return s;
      return {
        members: { ...s.members, [id]: { ...s.members[id], lat, lng } },
      };
    }),

  addSignal: (signal) =>
    set((s) => ({ signals: [...s.signals, signal] })),

  clearOldSignals: (maxAgeMs = 5000) =>
    set((s) => ({
      signals: s.signals.filter((sig) => Date.now() - sig.timestamp < maxAgeMs),
    })),

  addEvent: (event) =>
    set((s) => ({ events: [...s.events, event] })),

  focusedMemberId: null,
  setFocusedMember: (id) => set({ focusedMemberId: id }),

  reset: () => set(initialState),
}));
