import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'mat:';
type Listener = (key: string) => void;
const listeners = new Set<Listener>();

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* armazenamento cheio ou bloqueado: segue sem persistir */
  }
  listeners.forEach((l) => l(key));
}

/** Estado persistido em localStorage, sincronizado entre componentes e abas. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStore(key, initial));
  useEffect(() => {
    const l: Listener = (k) => k === key && setValue(readStore(key, initial));
    listeners.add(l);
    const onStorage = (e: StorageEvent) => e.key === PREFIX + key && setValue(readStore(key, initial));
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStore(key, initial);
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      writeStore(key, v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  return [value, set] as const;
}

/** Lista de ids (favoritos, assistidos...). */
export function useIdSet(key: string) {
  const [ids, setIds] = useStored<string[]>(key, []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(
    (id: string) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    [setIds]
  );
  return { ids, has, toggle, set: setIds };
}

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
