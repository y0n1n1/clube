'use client';

import { useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/session';

export default function MemberDots() {
  const members = useSessionStore((s) => s.members);
  const myId = useSessionStore((s) => s.myId);
  const myColor = useSessionStore((s) => s.myColor);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (!sessionCode) return;

    const url = `${window.location.origin}/session/${sessionCode}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Clubbing Compass', text: `Join my session: ${sessionCode}`, url });
        return;
      } catch { /* user cancelled or not supported */ }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sessionCode]);

  const allColors: { id: string; color: string; name: string }[] = [];

  if (myId && myColor) {
    allColors.push({ id: myId, color: myColor, name: 'You' });
  }

  Object.values(members)
    .filter((m) => m.id !== myId)
    .forEach((m) => allColors.push({ id: m.id, color: m.color, name: m.name }));

  return (
    <div className="absolute top-4 left-4 z-30 flex items-center">
      <div className="flex -space-x-2">
        {allColors.map((m) => (
          <div
            key={m.id}
            className="w-8 h-8 rounded-full border-2 border-black"
            style={{ backgroundColor: m.color }}
            title={m.name}
          />
        ))}
      </div>

      {sessionCode && (
        <button
          onClick={handleShare}
          className="ml-3 text-zinc-500 text-xs font-mono active:text-white transition-colors"
        >
          {copied ? 'Copied!' : sessionCode}
        </button>
      )}
    </div>
  );
}
