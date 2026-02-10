import React, { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { useApp } from '../context/AppContext';
import { auraTypes } from '../data/aura-types';
import { EVOLUTION_STAGES } from '../data/evolution-stages';
import { EvolutionComposition, EVOLUTION_DURATION, EVOLUTION_FPS } from './EvolutionComposition';

const EvolutionOverlay: React.FC = () => {
  const { state, dispatch } = useApp();
  const { evolutionLevel, previousEvolutionLevel, mascot } = state;
  const [showDismiss, setShowDismiss] = useState(false);

  const mascotAura = auraTypes.find(a => a.id === mascot.auraId) || auraTypes[0];
  const oldStage = EVOLUTION_STAGES[previousEvolutionLevel];
  const newStage = EVOLUTION_STAGES[evolutionLevel];

  useEffect(() => {
    const timer = setTimeout(() => setShowDismiss(true), (EVOLUTION_DURATION / EVOLUTION_FPS) * 1000 - 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    dispatch({ type: 'DISMISS_EVOLUTION' });
  };

  return (
    <div className="evolution-overlay font-gmarket">
      <div className="evolution-overlay-bg" />

      <div className="evolution-overlay-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Player
          component={EvolutionComposition}
          inputProps={{
            oldImageSrc: `/auras/${mascot.auraId}/lv${previousEvolutionLevel}.png`,
            newImageSrc: `/auras/${mascot.auraId}/lv${evolutionLevel}.png`,
            oldEmoji: oldStage.mascotEmoji,
            newEmoji: newStage.mascotEmoji,
            themeColor: mascotAura.themeColor,
            newStageName: newStage.name,
            mascotName: mascotAura.name,
          }}
          compositionWidth={400}
          compositionHeight={400}
          durationInFrames={EVOLUTION_DURATION}
          fps={EVOLUTION_FPS}
          style={{ width: 380, height: 420 }}
          autoPlay
          controls={false}
        />

        {showDismiss && (
          <button
            onClick={handleDismiss}
            className="mt-4 px-8 py-3 rounded-2xl font-bold text-white text-sm animate-popIn"
            style={{ background: mascotAura.themeColor }}
          >
            확인
          </button>
        )}
      </div>
    </div>
  );
};

export default EvolutionOverlay;
