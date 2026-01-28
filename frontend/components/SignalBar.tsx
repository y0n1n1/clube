'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signalBarSpring } from '@/lib/springs';

interface SignalBarProps {
  onSendSignal: (type: 'where' | 'coming') => void;
}

export default function SignalBar({ onSendSignal }: SignalBarProps) {
  const [open, setOpen] = useState(false);

  const handleSignal = useCallback(
    (type: 'where' | 'coming') => {
      onSendSignal(type);
      setTimeout(() => setOpen(false), 300);
    },
    [onSendSignal],
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex gap-3 mb-4 pointer-events-auto"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={signalBarSpring}
            >
              <button
                onClick={() => handleSignal('where')}
                className="bg-zinc-900 border border-zinc-800 text-white rounded-full px-6 py-4 text-base font-[family-name:var(--font-geist-sans)] active:scale-95 transition-transform"
              >
                ❓ Where is everyone?
              </button>
              <button
                onClick={() => handleSignal('coming')}
                className="bg-zinc-900 border border-zinc-800 text-white rounded-full px-6 py-4 text-base font-[family-name:var(--font-geist-sans)] active:scale-95 transition-transform"
              >
                👋 Coming to you
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((o) => !o)}
          className="mb-3 pointer-events-auto"
          aria-label="Toggle signal bar"
        >
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </button>
      </div>
    </>
  );
}
