'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailableColors } from '@/lib/colors';
import { useSocket } from '@/hooks/useSocket';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useSessionStore } from '@/stores/session';

interface JoinFormProps {
  mode: 'create' | 'join';
}

export default function JoinForm({ mode }: JoinFormProps) {
  const router = useRouter();
  const { emit } = useSocket();
  const { requestPermission: requestGeo } = useGeolocation();
  const { requestPermission: requestOrientation } = useDeviceOrientation();
  const setSession = useSessionStore((s) => s.setSession);

  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const colors = getAvailableColors([]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!color) return;
    if (mode === 'join' && code.length !== 6) return;

    setLoading(true);
    setError('');

    // Request permissions
    requestGeo();
    await requestOrientation();

    const event = mode === 'create' ? 'create-session' : 'join-session';
    const payload =
      mode === 'create'
        ? { name: name.trim(), color }
        : { name: name.trim(), color, code };

    emit(event, payload, (result: { code: string; memberId: string }) => {
      setSession(result.code, result.memberId, name.trim(), color);
      router.push(`/session/${result.code}`);
    });
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      {/* Name input */}
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-5 py-4 text-base outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-500"
      />

      {/* Color picker */}
      <div className="flex flex-wrap justify-center gap-3">
        {colors.map((c) => (
          <button
            key={c.hex}
            onClick={() => setColor(c.hex)}
            className="w-10 h-10 rounded-full transition-all"
            style={{
              backgroundColor: c.hex,
              boxShadow:
                color === c.hex
                  ? `0 0 0 3px #000, 0 0 0 5px #fff`
                  : 'none',
            }}
            aria-label={c.name}
          />
        ))}
      </div>

      {/* Code input for join mode */}
      {mode === 'join' && (
        <input
          type="text"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-5 py-4 text-center text-2xl font-semibold font-[family-name:var(--font-geist-mono)] outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
          style={{ letterSpacing: '0.2em' }}
        />
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !name.trim() || !color || (mode === 'join' && code.length !== 6)}
        className="w-full rounded-full bg-white text-black font-semibold px-8 py-4 text-base transition-opacity disabled:opacity-40"
      >
        {loading
          ? 'Connecting...'
          : mode === 'create'
            ? 'Create Session'
            : 'Join Session'}
      </button>
    </div>
  );
}
