// // src/lib/budgeting/server/db.ts
// real DB:
import type { Category } from '$lib/budgeting/defaults';
import type { UserPrefs } from '$lib/budgeting/store';

const inMemory: Record<string, UserPrefs> = {};

export async function getUserCategoryPrefs(userId: string): Promise<UserPrefs> {
  return inMemory[userId] ?? { added: [], removed: [], order: [] };
}

export async function saveUserCategoryPrefs(userId: string, prefs: UserPrefs): Promise<void> {
  inMemory[userId] = prefs;
}

// A very simple in-memory “users table” for demo purposes.
// Replace with your real DB calls later.

import { hash } from '$lib/budgeting/server/auth';

export interface User {
  id:             string;
  username:       string;
  hashedPassword: string;
}

// 1) Seed one demo user. Password is “password”
const users: Record<string, User> = {
  demo: {
    id:             'demo',
    username:       'demo',
    hashedPassword: hash('password')
  }
};

/**
 * Find a user by their username.
 * Returns null if not found.
 */
export async function findUserByName(username: string): Promise<User | null> {
  return users[username] ?? null;
}