'use client';

import { create } from 'zustand';
import type { Member, Signal } from '@/lib/types';

interface SessionStore {
  myId: string | null;
  myName: string | null;
  myColor: string | null;
  sessionCode: string | null;
  members: Record<string, Member>;
  signals: Signal[];

  setSession: (code: string, myId: string, name: string, color: string) => void;
  addMember: (member: Member) => void;
  removeMember: (id: string) => void;
  updateMemberLocation: (id: string, lat: number, lng: number) => void;
  addSignal: (signal: Signal) => void;
  clearOldSignals: (maxAgeMs?: number) => void;
  reset: () => void;
}

const initialState = {
  myId: null,
  myName: null,
  myColor: null,
  sessionCode: null,
  members: {} as Record<string, Member>,
  signals: [] as Signal[],
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setSession: (code, myId, name, color) =>
    set({ sessionCode: code, myId, myName: name, myColor: color }),

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

  reset: () => set(initialState),
}));
