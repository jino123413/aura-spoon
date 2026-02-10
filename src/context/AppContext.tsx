import React, { createContext, useContext, useReducer } from 'react';
import { AppState, AppAction } from '../types';

const initialState: AppState = {
  activeTab: 'home',
  overlay: null,
  result: null,
  streak: { currentStreak: 0, lastDate: '' },
  mascot: { auraId: 1, mood: 'sleepy', lastFedDate: '', totalFeedings: 0, exp: 0 },
  collection: { entries: [] },
  feedingHistory: [],
  evolutionLevel: 0,
  dailyQuote: '',
  isReady: false,
  selectedAuraId: null,
  isNewDiscovery: false,
  previousEvolutionLevel: 0,
  showOnboarding: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT': {
      const p = action.payload;
      return {
        ...state,
        streak: p.streak,
        mascot: p.mascot,
        collection: p.collection,
        feedingHistory: p.feedingHistory,
        evolutionLevel: p.evolutionLevel,
        previousEvolutionLevel: p.evolutionLevel,
        dailyQuote: p.dailyQuote,
        result: p.result,
        isReady: true,
        showOnboarding: p.showOnboarding,
        overlay: p.result ? 'result' : null,
      };
    }

    case 'SUBMIT_NAME':
      return {
        ...state,
        result: action.payload.result,
        isNewDiscovery: action.payload.isNewDiscovery,
        overlay: 'reveal',
      };

    case 'REVEAL_COMPLETE':
      return { ...state, overlay: 'result' };

    case 'FEED_MASCOT': {
      const p = action.payload;
      const evolved = p.evolutionLevel > state.evolutionLevel;
      return {
        ...state,
        streak: p.streak,
        collection: p.collection,
        mascot: p.mascot,
        feedingHistory: p.feedingHistory,
        previousEvolutionLevel: state.evolutionLevel,
        evolutionLevel: p.evolutionLevel,
        overlay: evolved ? 'evolution-event' : state.overlay,
      };
    }

    case 'MANUAL_FEED': {
      const mf = action.payload;
      const manualEvolved = mf.evolutionLevel > state.evolutionLevel;
      return {
        ...state,
        mascot: mf.mascot,
        previousEvolutionLevel: manualEvolved ? state.evolutionLevel : state.previousEvolutionLevel,
        evolutionLevel: mf.evolutionLevel,
        overlay: manualEvolved ? 'evolution-event' : state.overlay,
      };
    }

    case 'SET_TAB':
      return { ...state, activeTab: action.payload, overlay: null, selectedAuraId: null };

    case 'SET_OVERLAY':
      return { ...state, overlay: action.payload };

    case 'SELECT_AURA':
      return {
        ...state,
        selectedAuraId: action.payload,
        overlay: action.payload !== null ? 'aura-detail' : null,
      };

    case 'DISMISS_EVOLUTION':
      return {
        ...state,
        overlay: state.selectedAuraId ? 'aura-detail' : 'result',
        previousEvolutionLevel: state.evolutionLevel,
      };

    case 'DISMISS_ONBOARDING':
      return { ...state, showOnboarding: false };

    case 'REROLL':
      return {
        ...state,
        result: action.payload.result,
        collection: action.payload.collection,
        mascot: action.payload.mascot,
        previousEvolutionLevel: state.evolutionLevel,
        evolutionLevel: action.payload.evolutionLevel,
        isNewDiscovery: action.payload.isNewDiscovery,
        overlay: 'reveal',
      };

    case 'CHANGE_MASCOT_AURA':
      return {
        ...state,
        mascot: action.payload.mascot,
        previousEvolutionLevel: state.evolutionLevel,
        evolutionLevel: action.payload.evolutionLevel,
      };

    case 'RETRY_HOME':
      return { ...state, result: null, overlay: null, isNewDiscovery: false };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue>({
  state: initialState,
  dispatch: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
