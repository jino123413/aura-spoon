import { Storage as NativeStorage } from '@apps-in-toss/web-framework';
import {
  TodayRecord, CollectionData, StreakData, EvolutionLevel,
  ExtendedCollection, CollectionEntry, Mascot, FeedingLog, ProfileMeta, MascotMood,
} from '../types';

// localStorage fallback for browser testing
const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const val = await NativeStorage.getItem(key);
      return val;
    } catch {
      try { return localStorage.getItem(key); } catch { return null; }
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await NativeStorage.setItem(key, value);
    } catch {
      try { localStorage.setItem(key, value); } catch {}
    }
  },
};

const USERNAME_KEY = 'aura-spoon-username';
const TODAY_KEY = 'aura-spoon-today';
const COLLECTION_KEY = 'aura-spoon-collection';
const STREAK_KEY = 'aura-spoon-streak';
const COLLECTION_V2_KEY = 'aura-spoon-collection-v2';
const MASCOT_KEY = 'aura-spoon-mascot';
const FEEDING_LOG_KEY = 'aura-spoon-feeding-log';
const PROFILE_KEY = 'aura-spoon-profile';

// ── Date helpers ──

// ── User name persistence ──
export async function saveUserName(name: string): Promise<void> {
  await Storage.setItem(USERNAME_KEY, name);
}
export async function getUserName(): Promise<string> {
  return (await Storage.getItem(USERNAME_KEY)) || '';
}

export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Legacy functions (still used) ──

export async function getTodayRecord(): Promise<TodayRecord | null> {
  try {
    const stored = await Storage.getItem(TODAY_KEY);
    if (stored) {
      const parsed: TodayRecord = JSON.parse(stored);
      if (parsed.date === getTodayString()) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

export async function getStreak(): Promise<StreakData> {
  try {
    const stored = await Storage.getItem(STREAK_KEY);
    if (stored) {
      const data: StreakData = JSON.parse(stored);
      const today = getTodayString();
      const yesterday = getYesterdayString();
      if (data.lastDate === today) return data;
      if (data.lastDate === yesterday) return { currentStreak: data.currentStreak, lastDate: data.lastDate };
    }
  } catch {}
  return { currentStreak: 0, lastDate: '' };
}

export async function getCollection(): Promise<CollectionData> {
  try {
    const stored = await Storage.getItem(COLLECTION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { discovered: [] };
}

// ── Evolution Level calc ──

export function calcEvolutionLevel(exp: number): EvolutionLevel {
  if (exp >= 20) return 4;
  if (exp >= 15) return 3;
  if (exp >= 10) return 2;
  if (exp >= 5) return 1;
  return 0;
}

// ── Exp system ──

export function calcExpForLevel(level: EvolutionLevel): number {
  const thresholds: Record<EvolutionLevel, number> = { 0: 0, 1: 5, 2: 10, 3: 15, 4: 20 };
  return thresholds[level];
}

export function calcExpGain(_streak: number, _isNewDiscovery: boolean): number {
  return 1; // 1 feeding = 1 exp, 5 per level
}

export function getFeedsInLevel(exp: number, level: EvolutionLevel): number {
  const threshold = calcExpForLevel(level);
  return exp - threshold;
}

export const FEEDS_PER_LEVEL = 5;
export const AD_FEED_INDEX = 2; // 3rd feed (0-indexed) triggers ad

// ── V2 Extended Collection ──

export async function getExtendedCollection(): Promise<ExtendedCollection> {
  try {
    const stored = await Storage.getItem(COLLECTION_V2_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { entries: [] };
}

export async function saveExtendedCollection(collection: ExtendedCollection): Promise<void> {
  try {
    await Storage.setItem(COLLECTION_V2_KEY, JSON.stringify(collection));
  } catch {}
}

// ── Mascot ──

export async function getMascot(): Promise<Mascot | null> {
  try {
    const stored = await Storage.getItem(MASCOT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export async function saveMascot(mascot: Mascot): Promise<void> {
  try {
    await Storage.setItem(MASCOT_KEY, JSON.stringify(mascot));
  } catch {}
}

export function calcMascotMood(lastFedDate: string): MascotMood {
  const today = getTodayString();
  const yesterday = getYesterdayString();
  if (lastFedDate === today) return 'happy';
  if (lastFedDate === yesterday) return 'neutral';
  return 'sleepy';
}

// ── Feeding Log ──

export async function getFeedingHistory(): Promise<FeedingLog[]> {
  try {
    const stored = await Storage.getItem(FEEDING_LOG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export async function saveFeedingHistory(logs: FeedingLog[]): Promise<void> {
  try {
    // Keep only last 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoff = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
    const trimmed = logs.filter(l => l.date >= cutoff);
    await Storage.setItem(FEEDING_LOG_KEY, JSON.stringify(trimmed));
  } catch {}
}

// ── Profile ──

export async function getProfile(): Promise<ProfileMeta | null> {
  try {
    const stored = await Storage.getItem(PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export async function saveProfile(profile: ProfileMeta): Promise<void> {
  try {
    await Storage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

// ── Determine representative mascot auraId from feeding history ──

export function calcRepresentativeAuraId(feedingHistory: FeedingLog[], collection: ExtendedCollection): number {
  if (feedingHistory.length === 0) {
    return collection.entries.length > 0 ? collection.entries[0].auraId : 1;
  }
  const counts = new Map<number, number>();
  let latestDate = '';
  let latestId = 1;
  for (const log of feedingHistory) {
    counts.set(log.auraId, (counts.get(log.auraId) || 0) + 1);
    if (log.date >= latestDate) {
      latestDate = log.date;
      latestId = log.auraId;
    }
  }
  let maxCount = 0;
  let maxId = latestId;
  for (const [id, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxId = id;
    }
  }
  return maxId;
}

// ── Full save after name submission (SUBMIT + FEED combined) ──

export async function saveTodayAndFeed(
  name: string,
  auraId: number,
): Promise<{
  streak: StreakData;
  collection: ExtendedCollection;
  mascot: Mascot;
  feedingHistory: FeedingLog[];
  isNewDiscovery: boolean;
  evolutionLevel: EvolutionLevel;
}> {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  // 1. Save today record
  await Storage.setItem(TODAY_KEY, JSON.stringify({ date: today, name, auraId } as TodayRecord));

  // 2. Update legacy collection (backward compat)
  const oldCol = await getCollection();
  if (!oldCol.discovered.includes(auraId)) {
    oldCol.discovered.push(auraId);
    await Storage.setItem(COLLECTION_KEY, JSON.stringify(oldCol));
  }

  // 3. Update streak
  const currentStreak = await getStreak();
  let newStreakVal: number;
  if (currentStreak.lastDate === today) {
    newStreakVal = currentStreak.currentStreak;
  } else if (currentStreak.lastDate === yesterday) {
    newStreakVal = currentStreak.currentStreak + 1;
  } else {
    newStreakVal = 1;
  }
  const newStreak: StreakData = { currentStreak: newStreakVal, lastDate: today };
  await Storage.setItem(STREAK_KEY, JSON.stringify(newStreak));

  // 4. Update extended collection
  const extCol = await getExtendedCollection();
  let isNewDiscovery = false;
  let resultEntry = extCol.entries.find(e => e.auraId === auraId);
  if (resultEntry) {
    resultEntry.discoveredCount += 1;
  } else {
    isNewDiscovery = true;
    resultEntry = {
      auraId,
      discoveredDate: today,
      discoveredCount: 1,
      highestEvolutionViewed: 0 as EvolutionLevel,
      exp: 0,
      totalFeedings: 0,
    };
    extCol.entries.push(resultEntry);
  }

  // Per-aura exp: feed goes to the result aura's entry
  const expGain = calcExpGain(newStreakVal, isNewDiscovery);
  resultEntry.exp = (resultEntry.exp ?? 0) + expGain;
  resultEntry.totalFeedings = (resultEntry.totalFeedings ?? 0) + 1;
  await saveExtendedCollection(extCol);

  // 5. Update feeding history
  const history = await getFeedingHistory();
  history.push({ date: today, name, auraId, fedToMascot: true });
  await saveFeedingHistory(history);

  // 6. Mascot becomes the result aura (with per-aura exp)
  let mascot = await getMascot();
  if (!mascot) {
    mascot = { auraId, mood: 'happy', lastFedDate: today, totalFeedings: resultEntry.totalFeedings, exp: resultEntry.exp };
  } else {
    // Save current mascot's exp back to its collection entry
    if (mascot.auraId !== auraId) {
      const oldEntry = extCol.entries.find(e => e.auraId === mascot.auraId);
      if (oldEntry) {
        oldEntry.exp = mascot.exp;
        oldEntry.totalFeedings = mascot.totalFeedings;
        await saveExtendedCollection(extCol);
      }
    }
    mascot.auraId = auraId;
    mascot.mood = 'happy';
    mascot.lastFedDate = today;
    mascot.totalFeedings = resultEntry.totalFeedings;
    mascot.exp = resultEntry.exp;
  }
  await saveMascot(mascot);

  // 7. Calc evolution level from per-aura exp
  const evolutionLevel = calcEvolutionLevel(mascot.exp);

  return { streak: newStreak, collection: extCol, mascot, feedingHistory: history, isNewDiscovery, evolutionLevel };
}

// ── Migration: v1 → v2 ──

export async function migrateIfNeeded(): Promise<boolean> {
  const profile = await getProfile();
  if (profile && profile.version >= 2) return false; // already migrated

  const today = getTodayString();
  let isFirstVisit = true;

  // Migrate collection
  const oldCol = await getCollection();
  if (oldCol.discovered.length > 0) {
    isFirstVisit = false;
    const entries: CollectionEntry[] = oldCol.discovered.map(auraId => ({
      auraId,
      discoveredDate: today,
      discoveredCount: 1,
      highestEvolutionViewed: 0 as EvolutionLevel,
      exp: 0,
      totalFeedings: 0,
    }));
    await saveExtendedCollection({ entries });
  }

  // Init mascot
  const streak = await getStreak();
  const extCol = await getExtendedCollection();
  const history = await getFeedingHistory();
  const repId = calcRepresentativeAuraId(history, extCol);
  const mascot: Mascot = {
    auraId: repId,
    mood: calcMascotMood(streak.lastDate),
    lastFedDate: streak.lastDate || '',
    totalFeedings: extCol.entries.reduce((sum, e) => sum + e.discoveredCount, 0),
    exp: 0,
  };
  await saveMascot(mascot);

  if (streak.lastDate) isFirstVisit = false;

  // Save profile marker
  await saveProfile({ firstVisitDate: streak.lastDate || today, version: 2 });

  return isFirstVisit;
}

// ── Load all state for init ──

export async function loadAllState(): Promise<{
  streak: StreakData;
  collection: ExtendedCollection;
  mascot: Mascot;
  feedingHistory: FeedingLog[];
  evolutionLevel: EvolutionLevel;
  todayRecord: TodayRecord | null;
  isFirstVisit: boolean;
  userName: string;
}> {
  const isFirstVisit = await migrateIfNeeded();

  const streak = await getStreak();
  const collection = await getExtendedCollection();
  let mascot = await getMascot();
  if (!mascot) {
    mascot = { auraId: 1, mood: 'sleepy', lastFedDate: '', totalFeedings: 0, exp: 0 };
    await saveMascot(mascot);
  }
  // Recalc mood based on current date
  mascot.mood = calcMascotMood(mascot.lastFedDate);

  // Sync mascot exp from per-aura collection entry
  const activeEntry = collection.entries.find(e => e.auraId === mascot.auraId);
  if (activeEntry) {
    mascot.exp = activeEntry.exp ?? 0;
    mascot.totalFeedings = activeEntry.totalFeedings ?? 0;
  }

  const feedingHistory = await getFeedingHistory();
  const evolutionLevel = calcEvolutionLevel(mascot.exp);
  const todayRecord = await getTodayRecord();
  const userName = await getUserName();

  return { streak, collection, mascot, feedingHistory, evolutionLevel, todayRecord, isFirstVisit, userName };
}

// ── Reroll (pick different aura, no exp change) ──

export async function saveRerollResult(name: string, auraId: number): Promise<{
  collection: ExtendedCollection;
  mascot: Mascot;
  evolutionLevel: EvolutionLevel;
  isNewDiscovery: boolean;
}> {
  const today = getTodayString();

  // 1. Update today record
  const record: TodayRecord = { date: today, name, auraId };
  await Storage.setItem(TODAY_KEY, JSON.stringify(record));

  // 2. Update collection
  const extCol = await getExtendedCollection();
  let isNewDiscovery = false;
  const existing = extCol.entries.find(e => e.auraId === auraId);
  if (existing) {
    existing.discoveredCount += 1;
    existing.exp = 0;
    existing.totalFeedings = 0;
  } else {
    isNewDiscovery = true;
    extCol.entries.push({
      auraId,
      discoveredDate: today,
      discoveredCount: 1,
      highestEvolutionViewed: 0 as EvolutionLevel,
      exp: 0,
      totalFeedings: 0,
    });
  }
  await saveExtendedCollection(extCol);

  // 3. Reset mascot to new aura at lv0
  const mascot: Mascot = {
    auraId,
    mood: 'happy',
    lastFedDate: today,
    totalFeedings: 0,
    exp: 0,
  };
  await saveMascot(mascot);

  return { collection: extCol, mascot, evolutionLevel: 0, isNewDiscovery };
}

// ── Change mascot aura (from mascot tab selection) ──

export async function changeMascotAura(auraId: number): Promise<{ mascot: Mascot; evolutionLevel: EvolutionLevel }> {
  let mascot = await getMascot();
  const extCol = await getExtendedCollection();

  if (mascot) {
    // Save current mascot's exp back to its collection entry
    const oldEntry = extCol.entries.find(e => e.auraId === mascot.auraId);
    if (oldEntry) {
      oldEntry.exp = mascot.exp;
      oldEntry.totalFeedings = mascot.totalFeedings;
    }

    // Load new aura's exp from its collection entry
    const newEntry = extCol.entries.find(e => e.auraId === auraId);
    mascot.auraId = auraId;
    mascot.exp = newEntry?.exp ?? 0;
    mascot.totalFeedings = newEntry?.totalFeedings ?? 0;

    await saveExtendedCollection(extCol);
  } else {
    mascot = { auraId, mood: 'happy', lastFedDate: '', totalFeedings: 0, exp: 0 };
  }

  await saveMascot(mascot);
  const evolutionLevel = calcEvolutionLevel(mascot.exp);
  return { mascot, evolutionLevel };
}

// ── Manual feed (button press on result screen) ──

export async function manualFeedMascot(): Promise<{
  mascot: Mascot;
  evolutionLevel: EvolutionLevel;
}> {
  let mascot = await getMascot();
  if (!mascot) {
    mascot = { auraId: 1, mood: 'happy', lastFedDate: getTodayString(), totalFeedings: 0, exp: 0 };
  }
  mascot.exp += 1;
  mascot.totalFeedings += 1;
  await saveMascot(mascot);

  // Sync per-aura exp to collection entry
  const extCol = await getExtendedCollection();
  const entry = extCol.entries.find(e => e.auraId === mascot.auraId);
  if (entry) {
    entry.exp = mascot.exp;
    entry.totalFeedings = mascot.totalFeedings;
    await saveExtendedCollection(extCol);
  }

  const evolutionLevel = calcEvolutionLevel(mascot.exp);
  return { mascot, evolutionLevel };
}
