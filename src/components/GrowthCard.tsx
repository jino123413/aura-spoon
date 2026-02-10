import React from 'react';
import { EvolutionLevel } from '../types';
import { auraTypes } from '../data/aura-types';
import { EVOLUTION_STAGES } from '../data/evolution-stages';
import { feedingReactions } from '../data/mascot-dialogues';
import { calcExpForLevel } from '../utils/storage';
import { SparkleIcon } from './BrandIcons';

interface GrowthCardProps {
  auraId: number;
  mascotAuraId: number;
  exp: number;
  evolutionLevel: EvolutionLevel;
}

const GrowthCard: React.FC<GrowthCardProps> = ({ auraId, mascotAuraId, exp, evolutionLevel }) => {
  const aura = auraTypes.find(a => a.id === auraId);
  const stage = EVOLUTION_STAGES[evolutionLevel];
  const reaction = feedingReactions[mascotAuraId] || '냠냠! 맛있어요!';
  const nextLevel = Math.min(evolutionLevel + 1, 4) as EvolutionLevel;
  const nextExp = calcExpForLevel(nextLevel);
  const currentExp = calcExpForLevel(evolutionLevel);
  const expInLevel = exp - currentExp;
  const expNeeded = nextExp - currentExp;
  const percent = evolutionLevel >= 4 ? 100 : Math.min((expInLevel / expNeeded) * 100, 100);
  const isSameType = auraId === mascotAuraId;

  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        background: 'var(--bg-card)',
        borderColor: `${aura?.themeColor || 'var(--surface)'}30`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <SparkleIcon size={14} color="var(--primary)" />
        <span className="text-xs font-bold text-primary">기운이 성장 현황</span>
        {isSameType && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-medium">
            x2 보너스!
          </span>
        )}
      </div>

      {/* Exp bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(percent, 3)}%`,
              background: 'var(--primary)',
            }}
          />
        </div>
        <span className="text-[10px] font-medium text-primary">Lv.{evolutionLevel}</span>
      </div>

      {/* Reaction */}
      <p className="text-xs text-[#1A0B3E]/70 leading-relaxed">
        &ldquo;{reaction}&rdquo;
      </p>
    </div>
  );
};

export default GrowthCard;
