// Tiny generic collection store backed by localStorage, used only when
// VITE_DEMO_MODE=true. Lets demo visitors create/edit/delete data (inquiries,
// favorites, listings...) and have it persist across reloads within their
// own browser, without any server involved.

const PREFIX = "estatein-demo:";

function readCollection<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) {
      localStorage.setItem(PREFIX + key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
}

function writeCollection<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(items));
  } catch {
    // storage unavailable (private browsing quota, etc.) — demo degrades to in-memory-only for this call
  }
}

export function getCollection<T extends { id: string }>(key: string, seed: T[]): T[] {
  return readCollection(key, seed);
}

export function setCollection<T extends { id: string }>(key: string, items: T[]) {
  writeCollection(key, items);
}

export function insertItem<T extends { id: string }>(key: string, seed: T[], item: T): T {
  const items = readCollection(key, seed);
  const next = [...items, item];
  writeCollection(key, next);
  return item;
}

export function updateItem<T extends { id: string }>(
  key: string,
  seed: T[],
  id: string,
  patch: Partial<T>
): T | undefined {
  const items = readCollection(key, seed);
  let updated: T | undefined;
  const next = items.map((it) => {
    if (it.id === id) {
      updated = { ...it, ...patch };
      return updated;
    }
    return it;
  });
  writeCollection(key, next);
  return updated;
}

export function deleteItem<T extends { id: string }>(key: string, seed: T[], id: string) {
  const items = readCollection(key, seed);
  writeCollection(
    key,
    items.filter((it) => it.id !== id)
  );
}

export function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getSession(): { userId: string } | null {
  try {
    const raw = localStorage.getItem(PREFIX + "session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(userId: string | null) {
  try {
    if (userId) localStorage.setItem(PREFIX + "session", JSON.stringify({ userId }));
    else localStorage.removeItem(PREFIX + "session");
  } catch {
    // ignore
  }
}
