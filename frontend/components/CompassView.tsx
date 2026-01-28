'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useBearing } from '@/hooks/useBearing';
import { getOrbProps } from '@/lib/distance';
import { orbSpring } from '@/lib/springs';
import Orb from './Orb';

/** Convert polar (angle in degrees, distance in meters) to x,y pixel offsets from center */
function polarToXY(
  angleDeg: number,
  distanceM: number,
  radiusPx: number,
): { x: number; y: number } {
  // Scale distance: use log scale so nearby friends spread out, far ones compress
  // Max useful range ~500m, clamp at 95% of radius
  const maxDistance = 500;
  const clamped = Math.min(distanceM, maxDistance);
  const normalized = Math.log1p(clamped) / Math.log1p(maxDistance);
  const r = normalized * radiusPx * 0.95;

  const rad = ((angleDeg - 90) * Math.PI) / 180; // -90 so 0° = up
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
}

function MemberOrb({
  memberId,
  myLat,
  myLng,
  heading,
  radiusPx,
}: {
  memberId: string;
  myLat: number;
  myLng: number;
  heading: number | null;
  radiusPx: number;
}) {
  const member = useSessionStore((s) => s.members[memberId]);
  const { angle, distance } = useBearing(myLat, myLng, member.lat, member.lng, heading);
  const props = getOrbProps(distance);
  const { x, y } = polarToXY(angle, distance, radiusPx);

  return (
    <motion.div
      className="absolute"
      style={{ left: '50%', top: '50%' }}
      animate={{ x, y }}
      transition={orbSpring}
    >
      <Orb
        color={member.color}
        size={props.size}
        glowIntensity={props.glowIntensity}
        pulseSpeed={props.pulseSpeed}
        name={member.name}
        distance={distance}
        showName={props.showName}
        angle={angle}
        label={props.label}
      />
    </motion.div>
  );
}

export default function CompassView({
  myLat,
  myLng,
}: {
  myLat: number;
  myLng: number;
}) {
  const myId = useSessionStore((s) => s.myId);
  const members = useSessionStore((s) => s.members);
  const { heading } = useDeviceOrientation();

  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const radiusPx = Math.min(viewportSize.w, viewportSize.h) / 2;

  const otherIds = useMemo(
    () => Object.keys(members).filter((id) => id !== myId),
    [members, myId],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          boxShadow: 'inset 0 0 80px 30px rgba(255,255,255,0.04)',
        }}
      />

      {/* Center dot — you */}
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />

      {/* Friend orbs — only render after viewport is measured */}
      <AnimatePresence>
        {viewportSize.w > 0 && otherIds.map((id) => (
          <MemberOrb
            key={id}
            memberId={id}
            myLat={myLat}
            myLng={myLng}
            heading={heading}
            radiusPx={radiusPx}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
