import type { PinnedMarketInstrument } from "@/types/Market";
import { loadSession } from "@/utils/storage";

const PINNED_MARKETS_STORAGE_KEY_PREFIX = "finus-pinned-markets";
const LEGACY_PINNED_MARKETS_STORAGE_KEY = PINNED_MARKETS_STORAGE_KEY_PREFIX;
const SERVER_RESET_KEY_STORAGE_KEY = "finus-server-reset-key";
const PINNED_MARKETS_CLEARED_EVENT = "finus:pinned-markets-cleared";

function resolvePinnedMarketsStorageKey(): string | null {
  const session = loadSession();
  const userId = session?.user.id;
  const userEmail = session?.user.email?.trim().toLowerCase();

  if (typeof userId === "number" && Number.isFinite(userId)) {
    return `${PINNED_MARKETS_STORAGE_KEY_PREFIX}:id:${userId}`;
  }

  if (userEmail) {
    return `${PINNED_MARKETS_STORAGE_KEY_PREFIX}:email:${userEmail}`;
  }

  return null;
}

function clearLegacyPinnedMarkets() {
  localStorage.removeItem(LEGACY_PINNED_MARKETS_STORAGE_KEY);
}

function clearAllPinnedMarkets() {
  clearLegacyPinnedMarkets();

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key) {
      continue;
    }

    if (key.startsWith(`${PINNED_MARKETS_STORAGE_KEY_PREFIX}:`)) {
      localStorage.removeItem(key);
    }
  }
}

function loadPinnedMarkets(): PinnedMarketInstrument[] {
  clearLegacyPinnedMarkets();

  const storageKey = resolvePinnedMarketsStorageKey();
  if (!storageKey) {
    return [];
  }

  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PinnedMarketInstrument[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        typeof item?.symbol === "string" &&
        typeof item?.displaySymbol === "string" &&
        typeof item?.name === "string" &&
        (item?.type === "stock" || item?.type === "forex") &&
        typeof item?.currency === "string",
    );
  } catch {
    return [];
  }
}

function savePinnedMarkets(items: PinnedMarketInstrument[]) {
  clearLegacyPinnedMarkets();

  const storageKey = resolvePinnedMarketsStorageKey();
  if (!storageKey) {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(items));
}

function syncPinnedMarketsResetKey(resetKey: string): boolean {
  const previousResetKey = localStorage.getItem(SERVER_RESET_KEY_STORAGE_KEY);
  if (previousResetKey === resetKey) {
    return false;
  }

  clearAllPinnedMarkets();
  localStorage.setItem(SERVER_RESET_KEY_STORAGE_KEY, resetKey);
  window.dispatchEvent(new Event(PINNED_MARKETS_CLEARED_EVENT));
  return true;
}

export {
  clearAllPinnedMarkets,
  loadPinnedMarkets,
  PINNED_MARKETS_CLEARED_EVENT,
  savePinnedMarkets,
  PINNED_MARKETS_STORAGE_KEY_PREFIX,
  syncPinnedMarketsResetKey,
};
