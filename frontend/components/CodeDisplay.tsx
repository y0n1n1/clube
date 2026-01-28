'use client';

import { useState } from 'react';

interface CodeDisplayProps {
  code: string;
}

export default function CodeDisplay({ code }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `Join my session: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Clubbing Compass', text });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p
        className="text-white font-semibold font-[family-name:var(--font-geist-mono)]"
        style={{ fontSize: 48, letterSpacing: '0.1em' }}
      >
        {code}
      </p>
      <button
        onClick={handleShare}
        className="rounded-full border border-zinc-700 text-white px-8 py-4 text-base transition-colors hover:bg-zinc-900"
      >
        {copied ? 'Copied!' : 'Share Code'}
      </button>
    </div>
  );
}
