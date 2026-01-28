'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session';
import { useBearing } from '@/hooks/useBearing';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

function formatDistance(m: number): string {
  if (m < 10) return 'Right here';
  if (m < 100) return `~${Math.round(m)}m away`;
  if (m < 1000) return `~${Math.round(m / 10) * 10}m away`;
  return `~${(m / 1000).toFixed(1)}km away`;
}

interface OrbFocusViewProps {
  memberId: string;
  myLat: number;
  myLng: number;
  onClose: () => void;
  onSignal: (type: string) => void;
}

export default function OrbFocusView({ memberId, myLat, myLng, onClose, onSignal }: OrbFocusViewProps) {
  const member = useSessionStore((s) => s.members[memberId]);
  const { heading } = useDeviceOrientation();
  const { angle, distance } = useBearing(myLat, myLng, member?.lat ?? null, member?.lng ?? null, heading);

  if (!member) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          background: `radial-gradient(circle at center, ${member.color}20 0%, rgba(0,0,0,0.95) 60%)`,
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-500 text-sm"
        >
          Close
        </button>

        {/* Direction arrow */}
        <div
          className="mb-8"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" className="text-zinc-400">
            <path d="M20 5 L25 15 L20 12 L15 15 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Big orb */}
        <div
          className="w-28 h-28 rounded-full mb-6"
          style={{
            backgroundColor: member.color,
            boxShadow: `0 0 60px ${member.color}50, 0 0 120px ${member.color}20`,
          }}
        />

        {/* Name */}
        <p className="text-white text-2xl font-semibold mb-2">{member.name}</p>

        {/* Distance */}
        <p className="text-zinc-400 text-base mb-10">{formatDistance(distance)}</p>

        {/* Quick signal */}
        <button
          onClick={() => { onSignal('coming'); onClose(); }}
          className="bg-zinc-900 border border-zinc-700 text-white rounded-full px-8 py-3 text-sm active:scale-95 transition-transform"
        >
          Signal: I&apos;m coming
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
