import { EvolutionLevel } from '../types';

export interface EvolutionStage {
  level: EvolutionLevel;
  name: string;
  description: string;
  mascotEmoji: string;
  mascotImage: string;
  glowIntensity: number;
  particleCount: number;
  ringColor: string;
}

export const EVOLUTION_STAGES: Record<EvolutionLevel, EvolutionStage> = {
  0: {
    level: 0,
    name: '씨앗',
    description: '기운이가 막 태어났어요',
    mascotEmoji: '🌫️',
    mascotImage: '/evolution/lv0.png',
    glowIntensity: 0.15,
    particleCount: 8,
    ringColor: 'rgba(180, 160, 255, 0.2)',
  },
  1: {
    level: 1,
    name: '새싹',
    description: '기운이에게 눈이 생겼어요!',
    mascotEmoji: '🌱',
    mascotImage: '/evolution/lv1.png',
    glowIntensity: 0.3,
    particleCount: 12,
    ringColor: 'rgba(134, 239, 172, 0.4)',
  },
  2: {
    level: 2,
    name: '성장',
    description: '기운이가 날개를 펼쳤어요',
    mascotEmoji: '🦋',
    mascotImage: '/evolution/lv2.png',
    glowIntensity: 0.5,
    particleCount: 18,
    ringColor: 'rgba(123, 97, 255, 0.4)',
  },
  3: {
    level: 3,
    name: '빛남',
    description: '기운이가 빛나고 있어요!',
    mascotEmoji: '✨',
    mascotImage: '/evolution/lv3.png',
    glowIntensity: 0.75,
    particleCount: 24,
    ringColor: 'rgba(251, 191, 36, 0.5)',
  },
  4: {
    level: 4,
    name: '완성',
    description: '기운이가 완전체가 되었어요!',
    mascotEmoji: '👑',
    mascotImage: '/evolution/lv4.png',
    glowIntensity: 1.0,
    particleCount: 30,
    ringColor: 'rgba(251, 191, 36, 0.7)',
  },
};
