'use client';

import { useSessionStore } from '@/stores/session';

export default function MemberDots() {
  const members = useSessionStore((s) => s.members);
  const myId = useSessionStore((s) => s.myId);
  const myColor = useSessionStore((s) => s.myColor);
  const sessionCode = useSessionStore((s) => s.sessionCode);

  const allColors: { id: string; color: string; name: string }[] = [];

  // Add self first
  if (myId && myColor) {
    allColors.push({ id: myId, color: myColor, name: 'You' });
  }

  // Add others
  Object.values(members)
    .filter((m) => m.id !== myId)
    .forEach((m) => allColors.push({ id: m.id, color: m.color, name: m.name }));

  return (
    <div className="absolute top-4 left-4 z-30 flex items-center">
      {/* Overlapping color dots */}
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

      {/* Session code */}
      {sessionCode && (
        <span className="ml-3 text-zinc-500 text-xs font-mono">{sessionCode}</span>
      )}
    </div>
  );
}
