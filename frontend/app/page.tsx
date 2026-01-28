'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import JoinForm from '@/components/JoinForm';

type Mode = 'create' | 'join' | null;

export default function Home() {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {mode === null ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-12"
          >
            <h1 className="text-4xl font-semibold tracking-tight">
              Clubbing Compass
            </h1>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button
                onClick={() => setMode('create')}
                className="rounded-full bg-white text-black font-semibold px-8 py-4 text-base transition-opacity hover:opacity-90"
              >
                Start Session
              </button>
              <button
                onClick={() => setMode('join')}
                className="rounded-full border border-zinc-700 text-white px-8 py-4 text-base transition-colors hover:bg-zinc-900"
              >
                Join Session
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            <button
              onClick={() => setMode(null)}
              className="text-zinc-500 text-sm mb-4"
            >
              &larr; Back
            </button>
            <h2 className="text-2xl font-semibold">
              {mode === 'create' ? 'Start a Session' : 'Join a Session'}
            </h2>
            <JoinForm mode={mode} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
