// Minimal sessions helper for server-side logout.
// This implementation is intentionally small: it exports a `destroy` function
// used by the logout handler. Replace with your real session-store integration
// (Redis, database, etc.) as needed.

const inMemorySessions: Record<string, { created: number }> = {};

export function create(sessionId: string) {
  inMemorySessions[sessionId] = { created: Date.now() };
}

export function destroy(sessionId: string | null | undefined) {
  if (!sessionId) return false;
  if (inMemorySessions[sessionId]) {
    delete inMemorySessions[sessionId];
    console.log(`[sessions] destroyed session ${sessionId}`);
    return true;
  }
  // If you have an external session store, hook it up here.
  console.warn(`[sessions] session ${sessionId} not found (no-op)`);
  return false;
}

export function exists(sessionId: string) {
  return !!inMemorySessions[sessionId];
}

export default { create, destroy, exists };
