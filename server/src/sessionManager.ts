import { randomBytes } from 'crypto';

export interface SessionEvent {
  type: 'member-joined' | 'member-left' | 'signal';
  memberId: string;
  memberName: string;
  memberColor: string;
  data?: { signalType?: 'where' | 'coming' };
  timestamp: number;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  lat: number;
  lng: number;
  socketId: string;
  disconnectedAt?: number;
}

export interface Session {
  code: string;
  members: Map<string, Member>;
  events: SessionEvent[];
}

const sessions = new Map<string, Session>();
const memberToSession = new Map<string, string>();

const MAX_MEMBERS = 12;
const DISCONNECT_GRACE_MS = 60_000;

function generateCode(): string {
  let code: string;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (sessions.has(code));
  return code;
}

function generateMemberId(): string {
  return randomBytes(8).toString('hex');
}

function addEvent(session: Session, event: Omit<SessionEvent, 'timestamp'>): void {
  session.events.push({ ...event, timestamp: Date.now() });
}

export function createSession(socketId: string, name: string, color: string): { code: string; memberId: string } {
  const code = generateCode();
  const memberId = generateMemberId();
  const member: Member = { id: memberId, name, color, lat: 0, lng: 0, socketId };
  const session: Session = { code, members: new Map([[memberId, member]]), events: [] };
  addEvent(session, { type: 'member-joined', memberId, memberName: name, memberColor: color });
  sessions.set(code, session);
  memberToSession.set(memberId, code);
  return { code, memberId };
}

export function joinSession(code: string, socketId: string, name: string, color: string): { members: Omit<Member, 'socketId' | 'disconnectedAt'>[]; memberId: string; events: SessionEvent[] } {
  const session = sessions.get(code);
  if (!session) throw new Error('Session not found');
  const activeCount = Array.from(session.members.values()).filter(m => !m.disconnectedAt).length;
  if (activeCount >= MAX_MEMBERS) throw new Error('Session is full');

  const memberId = generateMemberId();
  const member: Member = { id: memberId, name, color, lat: 0, lng: 0, socketId };
  session.members.set(memberId, member);
  memberToSession.set(memberId, code);
  addEvent(session, { type: 'member-joined', memberId, memberName: name, memberColor: color });

  const members = Array.from(session.members.values())
    .filter(m => !m.disconnectedAt)
    .map(({ socketId: _, disconnectedAt: _d, ...rest }) => rest);
  return { members, memberId, events: session.events };
}

export function rejoinSession(code: string, memberId: string, newSocketId: string): { members: Omit<Member, 'socketId' | 'disconnectedAt'>[]; events: SessionEvent[]; memberId: string; name: string; color: string } {
  const session = sessions.get(code);
  if (!session) throw new Error('Session not found');
  const member = session.members.get(memberId);
  if (!member) throw new Error('Member not found in session');

  member.socketId = newSocketId;
  member.disconnectedAt = undefined;
  memberToSession.set(memberId, code);

  const members = Array.from(session.members.values())
    .filter(m => !m.disconnectedAt)
    .map(({ socketId: _, disconnectedAt: _d, ...rest }) => rest);
  return { members, events: session.events, memberId, name: member.name, color: member.color };
}

export function markDisconnected(memberId: string): { code: string; member: Member } | null {
  const code = memberToSession.get(memberId);
  if (!code) return null;
  const session = sessions.get(code);
  if (!session) return null;
  const member = session.members.get(memberId);
  if (!member) return null;

  member.disconnectedAt = Date.now();
  return { code, member };
}

export function leaveSession(memberId: string): { code: string; isEmpty: boolean } | null {
  const code = memberToSession.get(memberId);
  if (!code) return null;
  const session = sessions.get(code);
  if (!session) return null;
  const member = session.members.get(memberId);

  if (member) {
    addEvent(session, { type: 'member-left', memberId, memberName: member.name, memberColor: member.color });
  }

  session.members.delete(memberId);
  memberToSession.delete(memberId);

  const activeCount = Array.from(session.members.values()).filter(m => !m.disconnectedAt).length;
  if (session.members.size === 0 || activeCount === 0) {
    sessions.delete(code);
    return { code, isEmpty: true };
  }
  return { code, isEmpty: false };
}

export function cleanupDisconnected(): Array<{ code: string; memberId: string; memberName: string }> {
  const removed: Array<{ code: string; memberId: string; memberName: string }> = [];
  const now = Date.now();

  for (const session of sessions.values()) {
    for (const member of session.members.values()) {
      if (member.disconnectedAt && now - member.disconnectedAt > DISCONNECT_GRACE_MS) {
        removed.push({ code: session.code, memberId: member.id, memberName: member.name });
        leaveSession(member.id);
      }
    }
  }
  return removed;
}

export function addSignalEvent(memberId: string, signalType: 'where' | 'coming'): string | null {
  const code = memberToSession.get(memberId);
  if (!code) return null;
  const session = sessions.get(code);
  if (!session) return null;
  const member = session.members.get(memberId);
  if (!member) return null;
  addEvent(session, { type: 'signal', memberId, memberName: member.name, memberColor: member.color, data: { signalType } });
  return code;
}

export function updateLocation(memberId: string, lat: number, lng: number): { code: string; member: Member } | null {
  const code = memberToSession.get(memberId);
  if (!code) return null;
  const session = sessions.get(code);
  if (!session) return null;
  const member = session.members.get(memberId);
  if (!member) return null;

  member.lat = lat;
  member.lng = lng;
  return { code, member };
}

export function getSession(code: string): Session | undefined {
  return sessions.get(code);
}

export function getMemberSession(memberId: string): string | undefined {
  return memberToSession.get(memberId);
}

export function findMemberBySocketId(socketId: string): Member | undefined {
  for (const session of sessions.values()) {
    for (const member of session.members.values()) {
      if (member.socketId === socketId) return member;
    }
  }
  return undefined;
}
