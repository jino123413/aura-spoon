import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { auraTypes } from '../data/aura-types';
import { EVOLUTION_STAGES } from '../data/evolution-stages';
import { getTimeBasedGreeting } from '../data/mascot-dialogues';
import { getTodayString } from '../utils/storage';
import { FlameIcon } from './BrandIcons';

const HomeScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const { mascot, streak, evolutionLevel, dailyQuote } = state;
  const [name, setName] = useState('');
  const [imgError, setImgError] = useState(false);

  const stage = EVOLUTION_STAGES[evolutionLevel];
  const mascotAura = auraTypes.find(a => a.id === mascot.auraId) || auraTypes[0];
  const hasFedToday = mascot.lastFedDate === getTodayString();
  const hasResultToday = state.result !== null && state.overlay === null;

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    // dispatch happens in App
    const event = new CustomEvent('aura-submit-name', { detail: trimmed });
    window.dispatchEvent(event);
  }, [name]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleMascotTap = () => {
    if (state.result) {
      dispatch({ type: 'SET_OVERLAY', payload: 'result' });
    } else {
      dispatch({ type: 'SELECT_AURA', payload: mascot.auraId });
    }
  };

  const handleViewResult = () => {
    dispatch({ type: 'SET_OVERLAY', payload: 'result' });
  };

  const greeting = getTimeBasedGreeting(mascotAura.name, hasFedToday, streak.currentStreak);

  return (
    <div
      className="font-gmarket flex flex-col items-center px-5"
      style={{ paddingTop: 60, paddingBottom: 80, minHeight: '100vh' }}
    >
      {/* Representative Mascot — tap to see detail */}
      <div className="relative mb-2 cursor-pointer" onClick={handleMascotTap}>
        <div
          className={`mascot-avatar mascot-mood-${mascot.mood}`}
          style={{
            width: 120,
            height: 120,
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
            <span className="text-4xl select-none">{stage.mascotEmoji}</span>
          )}
        </div>

      </div>

      {/* User name label */}
      {state.userName && (
        <p className="text-xs text-[#1A0B3E]/40 mb-1">{state.userName}님의</p>
      )}

      {/* Stage Name + Streak */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-bold" style={{ color: mascotAura.themeColor }}>
          {stage.name} {mascotAura.name}이
        </span>
        {streak.currentStreak > 0 && (
          <span className="streak-chip">
            <FlameIcon size={14} color="var(--primary)" /> 연속 {streak.currentStreak}일째
          </span>
        )}
      </div>

      {/* Greeting */}
      <p className="text-xs text-[#1A0B3E]/50 text-center mb-5 leading-relaxed">
        {greeting}
      </p>

      {/* Name Input or View Result */}
      {hasResultToday ? (
        <button
          onClick={handleViewResult}
          className="w-full max-w-xs py-3.5 rounded-2xl font-bold text-base transition-all duration-200 active:scale-[0.98]"
          style={{
            background: mascotAura.themeColor,
            color: '#fff',
          }}
        >
          오늘의 기운 다시 보기
        </button>
      ) : (
        <>
          <p className="text-sm text-[#1A0B3E]/60 text-center mb-4">
            이름에는 그날의 기운이 깃들어요
          </p>
          <div className="w-full max-w-xs mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이름을 입력하세요"
              maxLength={10}
              className="w-full px-4 py-3.5 rounded-xl bg-bg-card border border-surface text-[#1A0B3E] text-base text-center placeholder:text-[#1A0B3E]/30 outline-none transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 font-gmarket"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={name.trim().length === 0}
            className="w-full max-w-xs py-3.5 rounded-2xl font-bold text-white text-base bg-primary transition-all duration-200 enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            오늘의 기운 확인하기
          </button>
        </>
      )}

      {/* Daily Quote */}
      <div className="mt-auto pt-8 w-full max-w-xs">
        <div className="bg-surface-light rounded-2xl px-5 py-4 text-center">
          <p className="text-xs text-[#1A0B3E]/50 leading-relaxed">
            &ldquo;{dailyQuote}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
