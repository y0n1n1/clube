import { randomBytes } from 'crypto';

export interface Member {
  id: string;
  name: string;
  color: string;
  lat: number;
  lng: number;
  socketId: string;
}

export interface Session {
  code: string;
  members: Map<string, Member>;
}

const sessions = new Map<string, Session>();
const memberToSession = new Map<string, string>();

const MAX_MEMBERS = 12;

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

export function createSession(socketId: string, name: string, color: string): { code: string; memberId: string } {
  const code = generateCode();
  const memberId = generateMemberId();
  const member: Member = { id: memberId, name, color, lat: 0, lng: 0, socketId };
  const session: Session = { code, members: new Map([[memberId, member]]) };
  sessions.set(code, session);
  memberToSession.set(memberId, code);
  return { code, memberId };
}

export function joinSession(code: string, socketId: string, name: string, color: string): { members: Omit<Member, 'socketId'>[]; memberId: string } {
  const session = sessions.get(code);
  if (!session) throw new Error('Session not found');
  if (session.members.size >= MAX_MEMBERS) throw new Error('Session is full');

  const memberId = generateMemberId();
  const member: Member = { id: memberId, name, color, lat: 0, lng: 0, socketId };
  session.members.set(memberId, member);
  memberToSession.set(memberId, code);

  const members = Array.from(session.members.values()).map(({ socketId: _, ...rest }) => rest);
  return { members, memberId };
}

export function leaveSession(memberId: string): { code: string; isEmpty: boolean } | null {
  const code = memberToSession.get(memberId);
  if (!code) return null;
  const session = sessions.get(code);
  if (!session) return null;

  session.members.delete(memberId);
  memberToSession.delete(memberId);

  if (session.members.size === 0) {
    sessions.delete(code);
    return { code, isEmpty: true };
  }
  return { code, isEmpty: false };
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
