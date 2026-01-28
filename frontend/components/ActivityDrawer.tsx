'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session';

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const SIGNAL_LABELS: Record<string, string> = {
  where: 'Where is everyone?',
  coming: "I'm coming",
  bar: 'At the bar',
  help: 'Need help',
  outside: 'Outside',
  leaving: 'Leaving soon',
};

function eventText(event: { type: string; memberName: string; data?: { signalType?: string; message?: string } }): string {
  switch (event.type) {
    case 'member-joined':
      return `${event.memberName} joined`;
    case 'member-left':
      return `${event.memberName} left`;
    case 'signal': {
      const st = event.data?.signalType;
      if (st === 'custom' && event.data?.message) {
        return `${event.memberName}: ${event.data.message}`;
      }
      const label = st ? SIGNAL_LABELS[st] || st : 'signal';
      return `${event.memberName}: ${label}`;
    }
    default:
      return event.memberName;
  }
}

export default function ActivityDrawer() {
  const [open, setOpen] = useState(false);
  const events = useSessionStore((s) => s.events);
  const scrollRef = useRef<HTMLDivElement>(null);

  const recentCount = events.filter((e) => Date.now() - e.timestamp < 300_000).length;

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, events.length]);

  return (
    <>
      {/* Pill trigger — top right */}
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-full px-3 py-1.5 text-xs text-zinc-400"
      >
        Activity
        {recentCount > 0 && (
          <span className="bg-white text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
            {recentCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl max-h-[60vh] flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-zinc-700" />
              </div>

              {/* Timeline */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-6">
                {events.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-8">No activity yet</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {events.map((event, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: event.memberColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300">{eventText(event)}</p>
                          <p className="text-[10px] text-zinc-600">{timeAgo(event.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
