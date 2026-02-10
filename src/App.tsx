import React, { useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { getAuraForName, getDailyQuote } from './utils/aura-engine';
import { loadAllState, saveTodayAndFeed } from './utils/storage';
import { EVOLUTION_STAGES } from './data/evolution-stages';
import { DeviceViewport } from './components/DeviceViewport';
import TabBar from './components/TabBar';
import HomeScreen from './components/HomeScreen';
import EncyclopediaScreen from './components/EncyclopediaScreen';
import MascotScreen from './components/MascotScreen';
import RevealScreen from './components/RevealScreen';
import ResultScreen from './components/ResultScreen';
import AuraDetailScreen from './components/AuraDetailScreen';
import EvolutionOverlay from './components/EvolutionOverlay';

function AppInner() {
  const { state, dispatch } = useApp();

  const particleCount = state.isReady ? EVOLUTION_STAGES[state.evolutionLevel].particleCount : 8;

  // Init
  useEffect(() => {
    const init = async () => {
      const data = await loadAllState();
      const dailyQuote = getDailyQuote();

      let result = null;
      if (data.todayRecord) {
        result = getAuraForName(data.todayRecord.name);
      }

      dispatch({
        type: 'INIT',
        payload: {
          streak: data.streak,
          mascot: data.mascot,
          collection: data.collection,
          feedingHistory: data.feedingHistory,
          evolutionLevel: data.evolutionLevel,
          dailyQuote,
          result,
          isReady: true,
          showOnboarding: data.isFirstVisit,
        },
      });
    };
    init();
  }, [dispatch]);

  // Listen for name submission from HomeScreen
  useEffect(() => {
    const handler = async (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      const auraResult = getAuraForName(name);

      // Dispatch to show reveal
      dispatch({ type: 'SUBMIT_NAME', payload: { result: auraResult, isNewDiscovery: false } });

      // Save and feed
      const feedResult = await saveTodayAndFeed(name, auraResult.aura.id);

      // Update state with feed results after a slight delay (reveal is playing)
      setTimeout(() => {
        dispatch({
          type: 'FEED_MASCOT',
          payload: {
            streak: feedResult.streak,
            collection: feedResult.collection,
            mascot: feedResult.mascot,
            feedingHistory: feedResult.feedingHistory,
            evolutionLevel: feedResult.evolutionLevel,
          },
        });
        // Update isNewDiscovery
        if (feedResult.isNewDiscovery) {
          dispatch({ type: 'SUBMIT_NAME', payload: { result: auraResult, isNewDiscovery: true } });
        }
      }, 100);
    };

    window.addEventListener('aura-submit-name', handler);
    return () => window.removeEventListener('aura-submit-name', handler);
  }, [dispatch]);

  const handleRevealComplete = useCallback(() => {
    dispatch({ type: 'REVEAL_COMPLETE' });
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY_HOME' });
  }, [dispatch]);

  if (!state.isReady) {
    return (
      <>
        <DeviceViewport />
        <div className="app">
          <div className="loading-screen">
            <div className="loading-spinner" />
            <p className="loading-text font-gmarket">기운을 모으고 있어요...</p>
          </div>
        </div>
      </>
    );
  }

  const showTabBar = !state.overlay;

  return (
    <>
      <DeviceViewport />
      <div className="app">
        {/* Floating particles */}
        <div className="particles-bg">
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="floating-particle"
              style={{
                left: `${(i * 23.7 + 5) % 100}%`,
                top: `${(i * 17.3 + 8) % 100}%`,
                '--delay': `${(i * 0.9) % 6}s`,
                '--duration': `${4 + (i * 1.1) % 5}s`,
                '--max-opacity': `${0.15 + (i * 0.04) % 0.2}`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Header — hidden during overlays so overlay headers are clickable */}
        {!state.overlay && (
          <header className="app-header">
            <h1 className="app-title">나만의 기운이</h1>
          </header>
        )}

        {/* Tab content — kept mounted for scroll position preservation */}
        <div style={{ display: state.activeTab === 'home' && !state.overlay ? 'block' : 'none' }}>
          <HomeScreen />
        </div>
        <div style={{ display: state.activeTab === 'collection' && !state.overlay ? 'block' : 'none' }}>
          <EncyclopediaScreen />
        </div>
        <div style={{ display: state.activeTab === 'mascot' && !state.overlay ? 'block' : 'none' }}>
          <MascotScreen />
        </div>

        {/* Overlays */}
        {state.overlay === 'reveal' && state.result && (
          <RevealScreen
            name={state.result.name}
            auraName={state.result.aura.name}
            auraColor={state.result.aura.themeColor}
            onRevealComplete={handleRevealComplete}
          />
        )}

        {state.overlay === 'result' && state.result && (
          <ResultScreen onRetry={handleRetry} />
        )}

        {state.overlay === 'aura-detail' && (
          <AuraDetailScreen />
        )}

        {state.overlay === 'evolution-event' && (
          <EvolutionOverlay />
        )}

        {/* Tab bar */}
        {showTabBar && (
          <TabBar
            activeTab={state.activeTab}
            onChangeTab={(tab) => dispatch({ type: 'SET_TAB', payload: tab })}
          />
        )}
      </div>
    </>
  );
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
};

export default App;
