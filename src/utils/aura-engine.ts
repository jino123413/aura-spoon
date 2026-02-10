import { AuraResult, AuraType } from '../types';
import { auraTypes } from '../data/aura-types';
import { dailyQuotes } from '../data/daily-quotes';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getAuraForName(name: string): AuraResult {
  const today = getTodayString();
  const trimmed = name.trim();
  const hash = hashCode(today + trimmed + 'aura-spoon');
  const auraIndex = hash % auraTypes.length;
  const aura = auraTypes[auraIndex];

  return {
    aura,
    name: trimmed,
    date: today,
  };
}

export function getRandomAura(excludeId: number, name: string): AuraResult {
  const today = getTodayString();
  const available = auraTypes.filter(a => a.id !== excludeId);
  const idx = Math.floor(Math.random() * available.length);
  return { aura: available[idx], name, date: today };
}

export function getEnergyPartner(auraId: number): AuraType {
  const today = getTodayString();
  const hash = hashCode(today + String(auraId) + 'partner');
  // Pick a partner that's different from the current aura
  let partnerIdx = hash % (auraTypes.length - 1);
  if (partnerIdx >= auraId - 1) partnerIdx += 1;
  return auraTypes[partnerIdx];
}

export function getDailyQuote(): string {
  const today = getTodayString();
  const idx = hashCode(today + 'aura-quote') % dailyQuotes.length;
  return dailyQuotes[idx];
}
