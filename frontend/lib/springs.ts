// Phase 1B: Framer Motion spring configs

export const orbSpring = { type: 'spring' as const, stiffness: 100, damping: 15 };

export const signalBarSpring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function pulseTransition(durationSeconds: number) {
  return {
    duration: durationSeconds,
    repeat: Infinity,
    repeatType: 'reverse' as const,
  };
}
