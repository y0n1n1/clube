'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Signal } from '@/lib/types';

interface SignalOverlayProps {
  signal: Signal | null;
  onDismiss: () => void;
}

const EMOJI: Record<Signal['type'], string> = {
  where: '❓',
  coming: '👋',
};

export default function SignalOverlay({ signal, onDismiss }: SignalOverlayProps) {
  useEffect(() => {
    if (!signal) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [signal, onDismiss]);

  return (
    <AnimatePresence>
      {signal && (
        <motion.div
          key={signal.timestamp}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
          style={{
            background: `radial-gradient(circle at center, ${signal.color}30 0%, rgba(0,0,0,0.85) 70%)`,
          }}
        >
          <span className="text-6xl mb-4">{EMOJI[signal.type]}</span>
          <p className="text-white text-2xl font-semibold">{signal.name}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
