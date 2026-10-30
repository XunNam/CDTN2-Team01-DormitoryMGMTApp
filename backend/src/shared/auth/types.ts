import type { SessionData } from 'express-session';

export type Role = 'SV' | 'BQL' | 'ADMIN';
export type ActorKind = 'STUDENT' | 'STAFF';
export interface SessionIdentity {
  actorKind: ActorKind;
  accountId: string;
  sessionVersion: number;
  lastSeenAt: number;
}
export interface Actor {
  actorKind: ActorKind;
  accountId: string;
  role: Role;
  studentId?: string;
  sessionVersion: number;
}
declare module 'express-session' {
  interface SessionData {
    identity?: SessionIdentity;
    csrfToken?: string;
  }
}
declare global {
  namespace Express {
    interface Locals { actor: Actor }
  }
}

export type AuthSession = SessionData;
