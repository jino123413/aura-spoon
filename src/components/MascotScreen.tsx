import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { auraTypes } from '../data/aura-types';
import { EVOLUTION_STAGES } from '../data/evolution-stages';
import { getTodayString, calcExpForLevel, changeMascotAura } from '../utils/storage';
import { EvolutionLevel } from '../types';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { SparkleIcon, FlameIcon } from './BrandIcons';
import GrowthCard from './GrowthCard';

const AD_GROUP_ID = 'ait.v2.live.d247867a61d14ac9';

const MascotScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const { mascot, streak, evolutionLevel, feedingHistory } = state;
  const [imgError, setImgError] = useState(false);
  const [showNextPreview, setShowNextPreview] = useState(false);
  const { loading: adLoading, showInterstitialAd } = useInterstitialAd(AD_GROUP_ID);

  const stage = EVOLUTION_STAGES[evolutionLevel];
  const mascotAura = auraTypes.find(a => a.id === mascot.auraId) || auraTypes[0];
  const canPreviewNext = evolutionLevel < 4;
  const nextLevel = Math.min(evolutionLevel + 1, 4) as EvolutionLevel;
  const nextStage = EVOLUTION_STAGES[nextLevel];

  // Exp progress
  const currentLevelExp = calcExpForLevel(evolutionLevel);
  const nextLevelExp = calcExpForLevel(nextLevel);
  const expInLevel = mascot.exp - currentLevelExp;
  const expNeeded = nextLevelExp - currentLevelExp;
  const expPercent = evolutionLevel >= 4 ? 100 : Math.min((expInLevel / expNeeded) * 100, 100);

  // Today's feeding log
  const today = getTodayString();
  const todayLog = feedingHistory.find(l => l.date === today);

  const handleMascotTap = () => {
    if (state.result) {
      dispatch({ type: 'SET_OVERLAY', payload: 'result' });
    } else {
      dispatch({ type: 'SELECT_AURA', payload: mascot.auraId });
    }
  };

  const discoveredAuras = state.collection.entries
    .map(e => auraTypes.find(a => a.id === e.auraId))
    .filter((a): a is typeof auraTypes[0] => !!a);

  const handleSelectAura = useCallback(async (auraId: number) => {
    if (auraId === mascot.auraId) return;
    const { mascot: updated, evolutionLevel: newLevel } = await changeMascotAura(auraId);
    dispatch({ type: 'CHANGE_MASCOT_AURA', payload: { mascot: updated, evolutionLevel: newLevel } });
    setImgError(false);
  }, [mascot.auraId, dispatch]);

  const handlePreviewNextEvolution = useCallback(() => {
    showInterstitialAd({
      onDismiss: () => {
        setShowNextPreview(true);
      },
    });
  }, [showInterstitialAd]);

  return (
    <div
      className="font-gmarket flex flex-col items-center px-5"
      style={{ paddingTop: 60, paddingBottom: 80, minHeight: '100vh' }}
    >
      {/* Large Mascot — tap to see detail */}
      <div className="relative mb-3 cursor-pointer" onClick={handleMascotTap}>
        <div
          className={`mascot-avatar mascot-avatar-large mascot-mood-${mascot.mood}`}
          style={{
            width: 160,
            height: 160,
            '--theme-color': mascotAura.themeColor,
          } as React.CSSProperties}
        >
          {!imgError ? (
            <img
              src={`/auras/${mascot.auraId}/lv${evolutionLevel}.png`}
              alt={`${mascotAura.name} Lv.${evolutionLevel}`}
              className="w-[85%] h-[85%] object-contain select-none"
              draggable={false}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-5xl select-none">{stage.mascotEmoji}</span>
          )}
        </div>

      </div>

      {/* User name + Stage name */}
      {state.userName && (
        <p className="text-xs text-[#1A0B3E]/40 mb-0.5">{state.userName}님의</p>
      )}
      <h2 className="text-lg font-bold mb-1" style={{ color: mascotAura.themeColor }}>
        {stage.name} {mascotAura.name}이
      </h2>
      <p className="text-xs text-[#1A0B3E]/50 mb-4">{stage.description}</p>

      {/* Exp progress */}
      <div className="w-full max-w-xs mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-medium text-primary">Lv.{evolutionLevel} {stage.name}</span>
          {evolutionLevel < 4 && (
            <span className="text-[10px] text-[#1A0B3E]/30">Lv.{nextLevel} {EVOLUTION_STAGES[nextLevel].name}</span>
          )}
        </div>
        <div className="relative w-full h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(expPercent, 3)}%`,
              background: mascotAura.themeColor,
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-[#1A0B3E]/40">
            경험치 {mascot.exp}/{evolutionLevel >= 4 ? 'MAX' : nextLevelExp}
          </span>
          <span className="text-[10px] text-[#1A0B3E]/40">
            총 {mascot.totalFeedings}회 먹이기
          </span>
        </div>
      </div>

      {/* Today's record */}
      {todayLog ? (
        <div className="w-full max-w-xs mb-4">
          <GrowthCard
            auraId={todayLog.auraId}
            mascotAuraId={mascot.auraId}
            exp={mascot.exp}
            evolutionLevel={evolutionLevel}
          />
        </div>
      ) : (
        <div className="w-full max-w-xs rounded-2xl bg-bg-card border border-surface px-5 py-4 text-center mb-4">
          <p className="text-sm text-[#1A0B3E]/40">
            오늘의 기운을 아직 확인하지 않았어요
          </p>
          <p className="text-xs text-[#1A0B3E]/25 mt-1">
            홈에서 이름을 입력해 보세요
          </p>
        </div>
      )}

      {/* Aura selection */}
      {discoveredAuras.length > 1 && (
        <div className="w-full max-w-xs mb-4">
          <p className="text-xs font-bold text-[#1A0B3E]/50 mb-2 text-center">나의 기운이 변경</p>
          <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
            {discoveredAuras.map(a => {
              const isActive = a.id === mascot.auraId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSelectAura(a.id)}
                  className="flex-shrink-0 flex flex-col items-center transition-all"
                  style={{ width: 64 }}
                >
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center mb-1 transition-all"
                    style={{
                      background: `${a.themeColor}15`,
                      border: isActive ? `3px solid ${a.themeColor}` : `2px solid ${a.themeColor}30`,
                      boxShadow: isActive ? `0 0 10px ${a.themeColor}30` : 'none',
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <img
                      src={`/auras/${a.id}/lv${evolutionLevel}.png`}
                      alt={a.name}
                      className="w-[80%] h-[80%] object-contain"
                      draggable={false}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <span
                    className={`text-[10px] text-center leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}
                    style={{ color: isActive ? a.themeColor : '#1A0B3E80' }}
                  >
                    {a.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Streak visualization */}
      {streak.currentStreak > 0 && (
        <div className="w-full max-w-xs rounded-2xl bg-bg-card border border-surface px-5 py-3 flex items-center gap-3 mb-4">
          <FlameIcon size={22} color="var(--primary)" />
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: Math.min(streak.currentStreak, 7) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                  style={{ opacity: 0.4 + (i / 7) * 0.6 }}
                />
              ))}
              {streak.currentStreak > 7 && (
                <span className="text-[10px] text-[#1A0B3E]/40 ml-1">+{streak.currentStreak - 7}</span>
              )}
            </div>
            <span className="text-xs text-[#1A0B3E]/50">연속 {streak.currentStreak}일째 기운 주기</span>
          </div>
        </div>
      )}

      {/* Next evolution preview (after ad) */}
      {showNextPreview && canPreviewNext && (
        <div className="w-full max-w-xs rounded-2xl bg-bg-card border border-surface px-5 py-4 mb-4 animate-popIn">
          <div className="flex items-center gap-2 mb-3">
            <SparkleIcon size={14} color="var(--primary)" />
            <span className="text-xs font-bold text-primary">다음 진화 미리보기</span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)', boxShadow: `0 0 16px 4px ${nextStage.ringColor}` }}
            >
              <img
                src={`/auras/${mascot.auraId}/lv${nextLevel}.png`}
                alt={nextStage.name}
                className="w-[80%] h-[80%] object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: mascotAura.themeColor }}>
                Lv.{nextLevel} {nextStage.name}
              </span>
              <p className="text-xs text-[#1A0B3E]/50 mt-1">{nextStage.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ad: next evolution preview */}
      {canPreviewNext && !showNextPreview && (
        <div className="w-full max-w-xs mt-2">
          <button
            type="button"
            onClick={handlePreviewNextEvolution}
            disabled={adLoading}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}
          >
            <span className="ad-badge mr-1">AD</span>
            {adLoading ? '광고 로딩 중...' : '다음 진화 미리보기'}
          </button>
          <p className="ad-notice">광고 시청 후 다음 단계를 미리 볼 수 있어요</p>
        </div>
      )}
    </div>
  );
};

export default MascotScreen;
