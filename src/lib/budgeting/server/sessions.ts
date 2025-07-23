import { v4 as uuid } from 'uuid';

const sessions = new Map<string, string>(); // sessionId → username

export function create(username: string) {
  const id = uuid();
  sessions.set(id, username);
  return id;
}

export function getUser(id?: string): string | undefined {
  return id ? sessions.get(id) : undefined;
}

export function destroy(id: string) {
  sessions.delete(id);
}