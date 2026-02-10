import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { auraTypes } from '../data/aura-types';
import { EVOLUTION_STAGES } from '../data/evolution-stages';
import { getEnergyPartner } from '../utils/aura-engine';
import { getFeedsInLevel, FEEDS_PER_LEVEL, AD_FEED_INDEX, manualFeedMascot, calcEvolutionLevel } from '../utils/storage';
import { EvolutionLevel } from '../types';
import { levelQuotes } from '../data/mascot-dialogues';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { SparkleIcon } from './BrandIcons';

const AD_GROUP_ID = 'ait-ad-test-interstitial-id';

const AuraDetailScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const auraId = state.selectedAuraId;
  if (!auraId) return null;

  const aura = auraTypes.find(a => a.id === auraId);
  if (!aura) return null;

  const isMascotAura = auraId === state.mascot.auraId;
  const auraEntry = state.collection.entries.find(e => e.auraId === auraId);
  const auraExp = auraEntry?.exp ?? 0;
  const auraLevel = calcEvolutionLevel(auraExp);

  const [selectedLevel, setSelectedLevel] = useState<EvolutionLevel>(isMascotAura ? state.evolutionLevel : auraLevel);
  const [feeding, setFeeding] = useState(false);
  const { loading: adLoading, showInterstitialAd } = useInterstitialAd(AD_GROUP_ID);
  const entry = state.collection.entries.find(e => e.auraId === auraId);
  const partner = getEnergyPartner(auraId);

  const feedsInLevel = isMascotAura ? getFeedsInLevel(state.mascot.exp, state.evolutionLevel) : 0;
  const isMaxLevel = isMascotAura ? state.evolutionLevel >= 4 : false;
  const needsAd = feedsInLevel === AD_FEED_INDEX;

  const handleFeed = useCallback(async () => {
    if (feeding || isMaxLevel || !isMascotAura) return;
    const doFeed = async () => {
      setFeeding(true);
      try {
        const result = await manualFeedMascot();
        dispatch({ type: 'MANUAL_FEED', payload: result });
      } finally {
        setFeeding(false);
      }
    };
    if (needsAd) {
      showInterstitialAd({ onDismiss: doFeed });
    } else {
      await doFeed();
    }
  }, [feeding, isMaxLevel, isMascotAura, needsAd, showInterstitialAd, dispatch]);

  const handleBack = () => {
    dispatch({ type: 'SELECT_AURA', payload: null });
  };

  const handlePartnerTap = () => {
    const isDiscovered = state.collection.entries.some(e => e.auraId === partner.id);
    if (isDiscovered) {
      dispatch({ type: 'SELECT_AURA', payload: partner.id });
    }
  };

  return (
    <div
      className="animate-fadeIn font-gmarket fixed inset-0 z-40 overflow-y-auto"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center px-4 py-3 backdrop-blur-sm" style={{ background: 'rgba(248,245,255,0.9)' }}>
        <button onClick={handleBack} className="text-[#1A0B3E]/60 text-sm font-medium">
          &larr; 뒤로
        </button>
        <h2 className="flex-1 text-center text-base font-bold" style={{ color: aura.themeColor }}>
          {aura.name}
        </h2>
        <div className="w-12" />
      </div>

      <div className="flex flex-col items-center px-5 pb-10 pt-2">
        {/* Large Image */}
        <div
          className="w-60 h-60 rounded-full overflow-hidden mb-4 flex items-center justify-center"
          style={{
            background: `${aura.themeColor}15`,
            boxShadow: `0 0 24px 8px ${aura.themeColor}20`,
            border: `3px solid ${aura.themeColor}40`,
          }}
        >
          <img
            src={`/auras/${auraId}/lv${selectedLevel}.png`}
            alt={aura.name}
            className="w-[85%] h-[85%] object-contain"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Name + Energy */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold" style={{ color: aura.themeColor }}>{aura.name}</h2>
          <span
            className="energy-type-chip"
            style={{ backgroundColor: `${aura.themeColor}18`, color: aura.themeColor }}
          >
            {aura.energy}
          </span>
        </div>

        {/* Discovery info */}
        {entry && (
          <p className="text-xs text-[#1A0B3E]/40 mb-3">
            {entry.discoveredDate} 발견 | {entry.discoveredCount}번 만남
          </p>
        )}

        {/* Keywords */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {aura.keywords.map((kw, i) => (
            <span
              key={kw}
              className="text-xs font-medium px-3 py-1 rounded-full border"
              style={{ borderColor: `${aura.themeColor}40`, color: aura.themeColor, background: `${aura.themeColor}08` }}
            >
              {kw}
            </span>
          ))}
        </div>

        {/* Personality */}
        <p className="text-sm leading-relaxed text-center text-[#1A0B3E] mb-6 px-2">
          {aura.personality}
        </p>

        {/* Evolution cards */}
        <div className="w-full mb-6">
          <h3 className="text-xs font-bold text-[#1A0B3E]/50 mb-3 text-center">진화 단계</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 px-2 snap-x snap-mandatory no-scrollbar">
            {([0, 1, 2, 3, 4] as EvolutionLevel[]).map((level) => {
              const evoStage = EVOLUTION_STAGES[level];
              const isUnlocked = level <= auraLevel;
              const isSelected = level === selectedLevel;
              return (
                <button
                  key={level}
                  type="button"
                  className="flex-shrink-0 snap-center flex flex-col items-center"
                  style={{ width: 90 }}
                  onClick={() => isUnlocked && setSelectedLevel(level)}
                  disabled={!isUnlocked}
                >
                  <div
                    className={`w-[72px] h-[72px] rounded-2xl overflow-hidden flex items-center justify-center mb-1 transition-all ${isUnlocked ? '' : 'evo-card-locked'}`}
                    style={{
                      background: isUnlocked ? `${aura.themeColor}15` : 'var(--locked-light, #F1F5F9)',
                      border: isSelected
                        ? `3px solid ${aura.themeColor}`
                        : `2px solid ${isUnlocked ? `${aura.themeColor}40` : '#CBD5E140'}`,
                      boxShadow: isSelected ? `0 0 12px ${aura.themeColor}30` : 'none',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    {isUnlocked ? (
                      <img
                        src={`/auras/${auraId}/lv${level}.png`}
                        alt={`Lv.${level}`}
                        className="w-[85%] h-[85%] object-contain"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-lg text-[#CBD5E1]">🔒</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isSelected ? 'font-bold' : ''} ${isUnlocked ? 'text-primary' : 'text-[#1A0B3E]/25'}`}>
                    Lv.{level} {evoStage.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed section — only for mascot aura */}
        {isMascotAura && !isMaxLevel && (
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary">기운이 진화 게이지</span>
              <span className="text-xs text-[#1A0B3E]/40">{feedsInLevel}/{FEEDS_PER_LEVEL}</span>
            </div>
            <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden mb-3">
              {Array.from({ length: FEEDS_PER_LEVEL }).map((_, i) => (
                <div
                  key={i}
                  className="inline-block h-full transition-all duration-300"
                  style={{
                    width: `${100 / FEEDS_PER_LEVEL}%`,
                    background: i < feedsInLevel ? aura.themeColor : 'transparent',
                    opacity: i < feedsInLevel ? 1 : 0.15,
                    borderRight: i < FEEDS_PER_LEVEL - 1 ? '1.5px solid var(--bg)' : 'none',
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleFeed}
              disabled={feeding || adLoading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-transform active:scale-95 disabled:opacity-50"
              style={{ background: aura.themeColor, fontFamily: 'var(--font)' }}
            >
              {needsAd && <span className="ad-badge mr-1.5">AD</span>}
              {feeding ? '기운 주는 중...' : `기운이에게 기운 주기 (${feedsInLevel}/${FEEDS_PER_LEVEL})`}
            </button>
            <p className="text-center text-[10px] text-[#1A0B3E]/25 mt-1.5">
              기운 모으기 중 1회는 광고가 포함돼요
            </p>
          </div>
        )}
        {isMascotAura && isMaxLevel && (
          <div className="w-full mb-6 text-center">
            <span className="text-xs font-bold text-primary">완성 단계 달성!</span>
          </div>
        )}

        {/* Quote */}
        <div className="w-full rounded-2xl px-5 py-4 mb-6" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-2">
            <SparkleIcon size={14} color={aura.themeColor} />
            <span className="text-xs font-bold text-primary">기운이의 한마디</span>
          </div>
          <p className="text-sm leading-relaxed text-[#1A0B3E]">{levelQuotes[selectedLevel]}</p>
        </div>

        {/* Energy Partner */}
        <div className="w-full">
          <p className="text-xs font-medium mb-3 text-center text-[#1A0B3E]/50">에너지 파트너</p>
          <button
            type="button"
            onClick={handlePartnerTap}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-bg-card border border-surface text-left transition-transform active:scale-[0.98]"
          >
            <div
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{
                background: `${partner.themeColor}15`,
                border: `2px solid ${partner.themeColor}30`,
              }}
            >
              <img
                src={`/auras/${partner.id}/lv0.png`}
                alt={partner.name}
                className="w-full h-full object-contain"
                draggable={false}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold" style={{ color: partner.themeColor }}>{partner.name}</span>
                <span className="text-xs text-[#1A0B3E]/50">{partner.energy}</span>
              </div>
              <p className="text-xs mt-0.5 truncate text-[#1A0B3E]/50">
                {aura.name}과 만나면 시너지 폭발!
              </p>
            </div>
            <SparkleIcon size={16} color={partner.themeColor} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuraDetailScreen;
