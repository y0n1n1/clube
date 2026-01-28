'use client';

import { motion } from 'framer-motion';

interface PulseLoaderProps {
  text?: string;
}

export default function PulseLoader({ text }: PulseLoaderProps) {
  // Music equalizer bars animation
  const bars = [0, 1, 2, 3, 4];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8">
      {/* Equalizer bars */}
      <div className="flex items-end gap-1 h-12">
        {bars.map((i) => (
          <motion.div
            key={i}
            className="w-1 bg-white rounded-full"
            animate={{
              height: [8, 32 + Math.random() * 16, 12, 40 + Math.random() * 8, 8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {text && (
        <motion.p
          className="text-zinc-500 text-sm"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
