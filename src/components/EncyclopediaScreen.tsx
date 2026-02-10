import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { auraTypes } from '../data/aura-types';
import { getCollectionTitle } from '../data/mascot-dialogues';
import { AuraSilhouetteIcon } from './BrandIcons';
import { useInterstitialAd } from '../hooks/useInterstitialAd';

const EncyclopediaScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const { collection } = state;
  const discoveredIds = new Set(collection.entries.map(e => e.auraId));
  const discoveredCount = discoveredIds.size;
  const title = getCollectionTitle(discoveredCount);
  const progressPercent = (discoveredCount / 20) * 100;

  const handleAuraTap = (auraId: number) => {
    if (discoveredIds.has(auraId)) {
      dispatch({ type: 'SELECT_AURA', payload: auraId });
    }
  };

  return (
    <div
      className="font-gmarket flex flex-col items-center px-5"
      style={{ paddingTop: 60, paddingBottom: 80, minHeight: '100vh' }}
    >
      {/* Progress header */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex flex-col items-center mb-4">
          {/* Donut progress */}
          <div className="relative w-20 h-20 mb-2">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--surface)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeDasharray={`${progressPercent}, 100`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{discoveredCount}/20</span>
            </div>
          </div>
          <span className="text-xs font-medium text-[#1A0B3E]/50">{title}</span>
        </div>
      </div>

      {/* 4x5 Grid */}
      <div className="w-full max-w-sm grid grid-cols-4 gap-3">
        {auraTypes.map((aura, idx) => {
          const isDiscovered = discoveredIds.has(aura.id);
          const entry = collection.entries.find(e => e.auraId === aura.id);
          const isNew = entry && entry.discoveredCount === 1 &&
            entry.discoveredDate === new Date().toISOString().split('T')[0];

          return (
            <button
              key={aura.id}
              type="button"
              className="aura-grid-cell"
              style={{
                animationDelay: `${idx * 0.04}s`,
                '--cell-color': isDiscovered ? aura.themeColor : 'var(--locked)',
              } as React.CSSProperties}
              onClick={() => handleAuraTap(aura.id)}
            >
              <div className={`aura-grid-img-wrap ${isDiscovered ? '' : 'aura-grid-locked'}`}>
                {isDiscovered ? (
                  <LazyAuraImage auraId={aura.id} evolutionLevel={state.evolutionLevel} />
                ) : (
                  <div className="aura-grid-silhouette">
                    <AuraSilhouetteIcon size={36} color="var(--locked)" />
                  </div>
                )}
              </div>
              <span className={`aura-grid-name ${isDiscovered ? '' : 'opacity-30'}`}>
                {isDiscovered ? aura.name : '???'}
              </span>
              {isNew && <span className="aura-grid-new-badge">NEW</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

function LazyAuraImage({ auraId, evolutionLevel }: { auraId: number; evolutionLevel: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setLoaded(true); },
      { rootMargin: '200px' },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full flex items-center justify-center">
      {loaded && !error ? (
        <img
          src={`/auras/${auraId}/lv${evolutionLevel}.png`}
          alt=""
          className="w-full h-full object-contain"
          onError={() => setError(true)}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-surface rounded-xl animate-shimmer" />
      )}
    </div>
  );
}

export default EncyclopediaScreen;
