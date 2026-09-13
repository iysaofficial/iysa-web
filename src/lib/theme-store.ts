/**
 * Penyimpan tema kecil untuk useSyncExternalStore.
 *
 * Kenapa bukan useState + useEffect: membaca localStorage di dalam efek lalu
 * memanggil setState memicu render berantai, dan React 19 menandainya sebagai
 * galat. useSyncExternalStore adalah primitif yang memang dibuat untuk ini —
 * berlangganan ke penyimpanan di luar React, dengan snapshot server yang
 * terpisah supaya hidrasi tidak bentrok.
 *
 * localStorage tidak memancarkan event `storage` di tab yang sama, jadi
 * penyimpan ini memancarkannya sendiri saat tema diubah dari tab ini.
 */

export type ThemeMode = "light" | "dark" | "system";

const KEY = "iysa-theme";
const listeners = new Set<() => void>();

let cache: ThemeMode | null = null;

function readStorage(): ThemeMode {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "dark" || saved === "light" ? saved : "system";
  } catch {
    // Mode privat atau penyimpanan diblokir.
    return "system";
  }
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  // Tab lain yang mengubah tema.
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function onStorage(e: StorageEvent) {
  if (e.key === KEY || e.key === null) emit();
}

function emit() {
  cache = null;
  for (const cb of listeners) cb();
}

/** Snapshot harus stabil antar panggilan, atau React akan berputar terus. */
export function getSnapshot(): ThemeMode {
  if (cache === null) cache = readStorage();
  return cache;
}

/** Di server tema belum diketahui; ThemeScript yang menerapkannya sebelum lukis. */
export function getServerSnapshot(): ThemeMode {
  return "system";
}

export function setTheme(next: ThemeMode) {
  const root = document.documentElement;
  try {
    if (next === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Penyimpanan diblokir: tema tetap berubah untuk sesi ini.
  }
  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);
  emit();
}
