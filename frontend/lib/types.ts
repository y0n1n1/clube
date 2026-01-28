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
  type: string;
  message?: string;
  timestamp: number;
}

export interface SessionState {
  code: string;
  myId: string;
  members: Record<string, Member>;
}

export interface SessionEvent {
  type: 'member-joined' | 'member-left' | 'signal';
  memberId: string;
  memberName: string;
  memberColor: string;
  data?: { signalType?: string; message?: string };
  timestamp: number;
}

export interface OrbProps {
  size: number;
  glowIntensity: number;
  pulseSpeed: number;
  showName: boolean;
  label?: string;
}
