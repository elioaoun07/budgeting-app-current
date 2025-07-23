import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { App } from '$app/types';

// — password helpers —
export const hash = (plain: string) => bcrypt.hashSync(plain, 10);
export const verify = (plain: string, hashed: string) =>
  bcrypt.compareSync(plain, hashed);

// — JWT secret (move to .env in prod) —
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-secure-secret';

// — issue a token after login —
export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// — verify & decode a token from the cookie —
export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string };
}

// — auth helper for API routes —
//    reads event.locals.user set in hooks.server.ts
export function getUserIdFromLocals(locals: App.Locals): string | null {
  return locals.user?.id ?? null;
}