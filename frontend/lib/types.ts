export interface Member {
  id: string;
  name: string;
  color: string;
  lat: number;
  lng: number;
}

export interface Signal {
  id: string;
  name: string;
  color: string;
  type: 'where' | 'coming';
  timestamp: number;
}

export interface SessionState {
  code: string;
  myId: string;
  members: Record<string, Member>;
}

export interface OrbProps {
  size: number;
  glowIntensity: number;
  pulseSpeed: number;
  showName: boolean;
  label?: string;
}
