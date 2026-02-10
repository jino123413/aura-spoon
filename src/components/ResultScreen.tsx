import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getEnergyPartner } from '../utils/aura-engine';
import { getFeedsInLevel, FEEDS_PER_LEVEL, AD_FEED_INDEX, manualFeedMascot, saveRerollResult } from '../utils/storage';
import { getRandomAura } from '../utils/aura-engine';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { levelQuotes } from '../data/mascot-dialogues';
import { SparkleIcon, ShareIcon } from './BrandIcons';
import GrowthCard from './GrowthCard';

const AD_GROUP_ID = 'ait-ad-test-interstitial-id';

const ResultScreen: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { state, dispatch } = useApp();
  const result = state.result;
  if (!result) return null;

  const [imgError, setImgError] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const { loading: adLoading, showInterstitialAd } = useInterstitialAd(AD_GROUP_ID);
  const { aura, name } = result;
  const { evolutionLevel, mascot, isNewDiscovery } = state;

  const partner = useMemo(() => getEnergyPartner(aura.id), [aura.id]);

  const feedsInLevel = getFeedsInLevel(mascot.exp, evolutionLevel);
  const isMaxLevel = evolutionLevel >= 4;
  const needsAd = feedsInLevel === AD_FEED_INDEX;

  const handleFeed = useCallback(async () => {
    if (feeding || isMaxLevel) return;
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
  }, [feeding, isMaxLevel, needsAd, showInterstitialAd, dispatch]);

  const handleReroll = useCallback(async () => {
    const doReroll = async () => {
      const newResult = getRandomAura(aura.id, name);
      const saveResult = await saveRerollResult(name, newResult.aura.id);
      dispatch({ type: 'REROLL', payload: saveResult.isNewDiscovery
        ? { result: newResult, collection: saveResult.collection, mascot: saveResult.mascot, evolutionLevel: saveResult.evolutionLevel, isNewDiscovery: true }
        : { result: newResult, collection: saveResult.collection, mascot: saveResult.mascot, evolutionLevel: saveResult.evolutionLevel, isNewDiscovery: false }
      });
    };
    showInterstitialAd({ onDismiss: doReroll });
  }, [aura.id, name, showInterstitialAd, dispatch]);

  const handleShare = async () => {
    const shareText = `${name}님의 오늘 기운은 "${aura.name}"이래!\n${aura.keywords.join(' · ')}\n너의 기운도 확인해봐!`;
    try {
      const { share, getTossShareLink } = await import('@apps-in-toss/web-framework');
      const tossLink = await getTossShareLink('intoss://aura-spoon/home');
      await share({ message: `${shareText}\n${tossLink}` });
    } catch {
      try {
        await navigator.share?.({
          title: '나만의 기운이',
          text: shareText,
        });
      } catch {}
    }
  };

  const handlePartnerTap = () => {
    const isDiscovered = state.collection.entries.some(e => e.auraId === partner.id);
    if (isDiscovered) {
      dispatch({ type: 'SELECT_AURA', payload: partner.id });
    }
  };

  return (
    <div
      className="animate-fadeIn font-gmarket fixed inset-0 z-30 overflow-y-auto"
      style={{ background: 'var(--bg)' }}
    >
      <div className="flex flex-col items-center px-5 pb-10" style={{ paddingTop: 56 }}>

        {/* New discovery badge */}
        {isNewDiscovery && (
          <div className="mb-2 animate-popIn">
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: 'var(--primary)' }}>
              NEW! 새로운 기운이 발견!
            </span>
          </div>
        )}

        {/* Circular Orb Image */}
        <div className="energy-orb-container relative mb-2">
          <div
            className="energy-orb-ring absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${aura.themeColor}40, ${aura.themeColor}10, ${aura.themeColor}40, ${aura.themeColor}10, ${aura.themeColor}40)`,
              filter: `blur(8px)`,
            }}
          />
          <div
            className="energy-orb-inner relative rounded-full overflow-hidden"
            style={{
              boxShadow: `0 0 24px 8px ${aura.themeColor}30, 0 4px 16px rgba(0,0,0,0.08)`,
              border: `3px solid ${aura.themeColor}50`,
            }}
          >
            {imgError ? (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `${aura.themeColor}15` }}
              >
                <span className="text-6xl select-none">✨</span>
              </div>
            ) : (
              <img
                src={`/auras/${aura.id}/lv${evolutionLevel}.png`}
                alt={aura.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                draggable={false}
              />
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {aura.keywords.map((kw, i) => (
            <span
              key={kw}
              className="keyword-tag"
              style={{
                animationDelay: `${0.3 + i * 0.15}s`,
                borderColor: `${aura.themeColor}40`,
                color: aura.themeColor,
              }}
            >
              {kw}
            </span>
          ))}
        </div>

        {/* Aura Name + Energy */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold" style={{ color: aura.themeColor }}>{aura.name}</h2>
          <span
            className="energy-type-chip"
            style={{ backgroundColor: `${aura.themeColor}18`, color: aura.themeColor }}
          >
            {aura.energy}
          </span>
        </div>

        <p className="text-sm mb-5 text-[#6B5B8D]">{name}님의 오늘의 기운</p>

        {/* Personality */}
        <div className="w-full mb-6 px-1">
          <p className="text-base leading-relaxed text-center text-[#1A0B3E]">{aura.personality}</p>
        </div>

        {/* Speech Bubble */}
        <div className="w-full mb-6">
          <div className="speech-bubble" style={{ borderColor: `${aura.themeColor}30` }}>
            <div className="speech-bubble-arrow" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${aura.themeColor}15` }}>
                <SparkleIcon size={16} color={aura.themeColor} />
              </div>
              <span className="text-xs font-bold text-primary">기운이의 한마디</span>
            </div>
            <p className="text-sm leading-relaxed text-[#1A0B3E]">{levelQuotes[evolutionLevel]}</p>
          </div>
        </div>

        {/* Energy Partner */}
        <div className="w-full mb-4">
          <p className="text-xs font-medium mb-3 text-center text-[#6B5B8D]">오늘의 에너지 파트너</p>
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
                <span className="text-xs text-[#6B5B8D]">{partner.energy}</span>
              </div>
              <p className="text-xs mt-0.5 truncate text-[#6B5B8D]">{aura.name}과 만나면 시너지 폭발!</p>
            </div>
            <SparkleIcon size={16} color={partner.themeColor} />
          </button>
        </div>

        {/* Growth Card */}
        <div className="w-full mb-4">
          <GrowthCard
            auraId={aura.id}
            mascotAuraId={mascot.auraId}
            exp={mascot.exp}
            evolutionLevel={evolutionLevel}
          />
        </div>

        {/* Feed / Evolution Button */}
        {!isMaxLevel ? (
          <div className="w-full mb-4">
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
        ) : (
          <div className="w-full mb-4 text-center">
            <span className="text-xs font-bold text-primary">완성 단계 달성!</span>
          </div>
        )}

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base text-white transition-transform active:scale-95"
          style={{
            background: aura.themeColor,
            fontFamily: 'var(--font)',
          }}
        >
          <ShareIcon size={18} color="#ffffff" />
          친구에게 공유하기
        </button>

        {/* Reroll (with ad) */}
        <button
          type="button"
          onClick={handleReroll}
          disabled={adLoading}
          className="w-full mt-3 flex items-center justify-center gap-1 py-3 rounded-2xl font-bold text-base transition-transform active:scale-95 disabled:opacity-50"
          style={{ background: `${aura.themeColor}15`, color: aura.themeColor, border: `1.5px solid ${aura.themeColor}30`, fontFamily: 'var(--font)' }}
        >
          <span className="ad-badge mr-1.5">AD</span>
          새로 뽑기
        </button>
        <p className="text-center text-[10px] text-[#1A0B3E]/25 mt-1">
          광고 시청 후 새로운 기운이를 뽑을 수 있어요 (진화 초기화)
        </p>

        {/* Retry (no ad) */}
        <button
          type="button"
          onClick={onRetry}
          className="w-full mt-2 flex items-center justify-center gap-1 py-3 rounded-2xl font-bold text-base transition-transform active:scale-95"
          style={{ background: '#f3f4f6', color: 'var(--text-primary)', border: 'none', fontFamily: 'var(--font)' }}
        >
          다른 이름 기운 보기
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
