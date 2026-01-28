'use client';

import { motion } from 'framer-motion';
import { pulseTransition } from '@/lib/springs';

interface OrbProps {
  color: string;
  size: number;
  glowIntensity: number;
  pulseSpeed: number;
  name: string;
  distance: number;
  showName: boolean;
  angle: number;
  label?: string;
}

export default function Orb({
  color,
  size,
  glowIntensity,
  pulseSpeed,
  name,
  distance,
  showName,
  label,
}: OrbProps) {
  const glowAlpha = Math.round(glowIntensity * 255)
    .toString(16)
    .padStart(2, '0');

  return (
    <div className="absolute flex flex-col items-center" style={{ transform: 'translate(-50%, -50%)' }}>
      {/* Glow layer */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.8,
          height: size * 1.8,
          left: -(size * 1.8 - size) / 2,
          top: -(size * 1.8 - size) / 2,
          background: `radial-gradient(circle, ${color}${glowAlpha} 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.08, 1] }}
        transition={pulseTransition(pulseSpeed)}
      />

      {/* Orb body */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 50% 35%, ${color} 0%, transparent 70%)`,
          boxShadow: `0 4px 30px ${color}${glowAlpha}`,
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={pulseTransition(pulseSpeed)}
      >
        {/* Top highlight */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }}
        />
        {/* Bottom shadow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)',
          }}
        />
      </motion.div>

      {/* Distance label */}
      <span className="mt-1 text-sm font-semibold text-white">
        {label ?? `${Math.round(distance)}m`}
      </span>

      {/* Name label */}
      {showName && <span className="text-xs text-zinc-400">{name}</span>}
    </div>
  );
}
