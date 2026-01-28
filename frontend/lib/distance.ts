// Phase 1B: Distance-to-orb-props mapping

import type { OrbProps } from '@/lib/types';

export function getOrbProps(distanceMeters: number): OrbProps {
  if (distanceMeters < 5) {
    return { size: 80, glowIntensity: 1.0, pulseSpeed: 0.3, showName: true, label: 'HERE' };
  }
  if (distanceMeters < 20) {
    return { size: 80, glowIntensity: 0.7, pulseSpeed: 0.6, showName: true };
  }
  if (distanceMeters < 50) {
    return { size: 64, glowIntensity: 0.5, pulseSpeed: 1.2, showName: true };
  }
  if (distanceMeters <= 100) {
    return { size: 56, glowIntensity: 0.35, pulseSpeed: 2, showName: false };
  }
  return { size: 48, glowIntensity: 0.2, pulseSpeed: 3, showName: false };
}
