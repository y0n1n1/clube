'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Signal } from '@/lib/types';

interface SignalOverlayProps {
  signal: Signal | null;
  onDismiss: () => void;
}

const PRESET_LABELS: Record<string, string> = {
  where: 'Where is everyone?',
  coming: "I'm coming",
  bar: 'At the bar',
  help: 'Need help',
  outside: 'Outside',
  leaving: 'Leaving soon',
};

function getSignalText(signal: Signal): string {
  if (signal.type === 'custom' && signal.message) {
    return signal.message;
  }
  return PRESET_LABELS[signal.type] || signal.type;
}

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
          <div
            className="w-16 h-16 rounded-full mb-6"
            style={{ backgroundColor: signal.color, boxShadow: `0 0 40px ${signal.color}60` }}
          />
          <p className="text-white text-xl font-semibold mb-2">{signal.name}</p>
          <p className="text-zinc-300 text-base text-center px-8">{getSignalText(signal)}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
