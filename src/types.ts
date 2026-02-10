export type EvolutionLevel = 0 | 1 | 2 | 3 | 4;

export type TabId = 'home' | 'collection' | 'mascot';

export type OverlayScreen = 'reveal' | 'result' | 'aura-detail' | 'evolution-event';

export type MascotMood = 'happy' | 'neutral' | 'sleepy';

export interface AuraType {
  id: number;
  name: string;
  energy: string;
  themeColor: string;
  mascotFeature: string;
  keywords: [string, string, string];
  personality: string;
  quote: string;
  fluxPrompt: string;
}

export interface AuraResult {
  aura: AuraType;
  name: string;
  date: string;
}

export interface TodayRecord {
  date: string;
  name: string;
  auraId: number;
}

export interface CollectionData {
  discovered: number[];
}

export interface StreakData {
  currentStreak: number;
  lastDate: string;
}

// ── Extended models for v2 ──

export interface CollectionEntry {
  auraId: number;
  discoveredDate: string;
  discoveredCount: number;
  highestEvolutionViewed: EvolutionLevel;
  exp: number;
  totalFeedings: number;
}

export interface ExtendedCollection {
  entries: CollectionEntry[];
}

export interface Mascot {
  auraId: number;
  mood: MascotMood;
  lastFedDate: string;
  totalFeedings: number;
  exp: number;
}

export interface FeedingLog {
  date: string;
  name: string;
  auraId: number;
  fedToMascot: boolean;
}

export interface ProfileMeta {
  firstVisitDate: string;
  version: number;
}

// ── App State (useReducer) ──

export interface AppState {
  activeTab: TabId;
  overlay: OverlayScreen | null;
  result: AuraResult | null;
  streak: StreakData;
  mascot: Mascot;
  collection: ExtendedCollection;
  feedingHistory: FeedingLog[];
  evolutionLevel: EvolutionLevel;
  dailyQuote: string;
  isReady: boolean;
  selectedAuraId: number | null;
  isNewDiscovery: boolean;
  previousEvolutionLevel: EvolutionLevel;
  showOnboarding: boolean;
  userName: string;
}

export type AppAction =
  | { type: 'INIT'; payload: Omit<AppState, 'activeTab' | 'overlay' | 'selectedAuraId' | 'isNewDiscovery' | 'previousEvolutionLevel' | 'showOnboarding' | 'userName'> & { showOnboarding: boolean; userName: string } }
  | { type: 'SUBMIT_NAME'; payload: { result: AuraResult; isNewDiscovery: boolean } }
  | { type: 'REVEAL_COMPLETE' }
  | { type: 'FEED_MASCOT'; payload: { streak: StreakData; collection: ExtendedCollection; mascot: Mascot; feedingHistory: FeedingLog[]; evolutionLevel: EvolutionLevel } }
  | { type: 'MANUAL_FEED'; payload: { mascot: Mascot; evolutionLevel: EvolutionLevel } }
  | { type: 'SET_TAB'; payload: TabId }
  | { type: 'SET_OVERLAY'; payload: OverlayScreen | null }
  | { type: 'SELECT_AURA'; payload: number | null }
  | { type: 'DISMISS_EVOLUTION' }
  | { type: 'DISMISS_ONBOARDING' }
  | { type: 'REROLL'; payload: { result: AuraResult; collection: ExtendedCollection; mascot: Mascot; evolutionLevel: EvolutionLevel; isNewDiscovery: boolean } }
  | { type: 'CHANGE_MASCOT_AURA'; payload: { mascot: Mascot; evolutionLevel: EvolutionLevel } }
  | { type: 'RETRY_HOME' };
