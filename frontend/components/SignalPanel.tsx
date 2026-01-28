'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignalPanelProps {
  onSendSignal: (type: string, message?: string) => void;
}

const LOCATION_PRESETS = [
  { type: 'bar', label: 'Bar', color: '#F59E0B' },
  { type: 'smoking', label: 'Smoking', color: '#6B7280' },
  { type: 'main', label: 'Main Room', color: '#8B5CF6' },
  { type: 'outside', label: 'Outside', color: '#3B82F6' },
  { type: 'bathroom', label: 'Bathroom', color: '#06B6D4' },
  { type: 'entrance', label: 'Entrance', color: '#10B981' },
];

const ACTION_PRESETS = [
  { type: 'coming', label: 'Coming', color: '#22C55E' },
  { type: 'leaving', label: 'Leaving', color: '#EF4444' },
  { type: 'where', label: 'Where?', color: '#F97316' },
  { type: 'help', label: 'Help', color: '#EC4899' },
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
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 text-white rounded-full px-8 py-3 text-sm font-semibold active:scale-95 transition-transform"
      >
        Signal
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => { setOpen(false); setCustomText(''); }}
              className="absolute top-5 right-5 text-zinc-500 text-sm z-10"
            >
              Close
            </button>

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

            {!sent && (
              <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
                {/* Location grid */}
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">I&apos;m at</p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {LOCATION_PRESETS.map((p) => (
                    <button
                      key={p.type}
                      onClick={() => handleSend(p.type)}
                      className="rounded-2xl py-4 text-sm font-semibold text-white active:scale-95 transition-transform"
                      style={{ backgroundColor: `${p.color}25`, border: `1px solid ${p.color}40` }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Action grid */}
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Status</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {ACTION_PRESETS.map((p) => (
                    <button
                      key={p.type}
                      onClick={() => handleSend(p.type)}
                      className="rounded-2xl py-4 text-sm font-semibold text-white active:scale-95 transition-transform"
                      style={{ backgroundColor: `${p.color}25`, border: `1px solid ${p.color}40` }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Custom..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    maxLength={100}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSend()}
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-5 py-3 text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                  />
                  <button
                    onClick={handleCustomSend}
                    disabled={!customText.trim()}
                    className="bg-white text-black rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-30 active:scale-95 transition-all"
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
