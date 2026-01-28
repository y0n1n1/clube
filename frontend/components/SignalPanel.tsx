'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignalPanelProps {
  onSendSignal: (type: string, message?: string) => void;
}

const PRESETS = [
  { type: 'where', label: 'Where is everyone?' },
  { type: 'coming', label: "I'm coming" },
  { type: 'bar', label: 'At the bar' },
  { type: 'help', label: 'Need help' },
  { type: 'outside', label: 'Outside' },
  { type: 'leaving', label: 'Leaving soon' },
];

export default function SignalPanel({ onSendSignal }: SignalPanelProps) {
  const [open, setOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = useCallback(
    (type: string, message?: string) => {
      onSendSignal(type, message);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setOpen(false);
        setCustomText('');
      }, 600);
    },
    [onSendSignal],
  );

  const handleCustomSend = useCallback(() => {
    if (!customText.trim()) return;
    handleSend('custom', customText.trim());
  }, [customText, handleSend]);

  return (
    <>
      {/* Trigger button — always visible at bottom */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 text-white rounded-full px-8 py-3 text-sm font-semibold active:scale-95 transition-transform"
      >
        Signal
      </button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close area */}
            <button
              onClick={() => { setOpen(false); setCustomText(''); }}
              className="absolute top-5 right-5 text-zinc-500 text-sm z-10"
            >
              Close
            </button>

            {/* Sent confirmation */}
            <AnimatePresence>
              {sent && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center z-20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-white text-2xl font-semibold">Sent!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            {!sent && (
              <div className="flex-1 flex flex-col justify-center px-6 gap-3 max-w-sm mx-auto w-full">
                <p className="text-zinc-400 text-sm text-center mb-4">Send a signal to your group</p>

                {PRESETS.map((preset) => (
                  <button
                    key={preset.type}
                    onClick={() => handleSend(preset.type)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-6 py-4 text-base text-left active:scale-[0.98] active:bg-zinc-800 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}

                {/* Custom message */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    placeholder="Custom message..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    maxLength={100}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSend()}
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-5 py-4 text-base outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                  />
                  <button
                    onClick={handleCustomSend}
                    disabled={!customText.trim()}
                    className="bg-white text-black rounded-2xl px-5 py-4 text-sm font-semibold disabled:opacity-30 active:scale-95 transition-all"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
