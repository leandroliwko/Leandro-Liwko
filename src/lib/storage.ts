import { AppState, Medication, AdherenceRecord } from '../types';

const STORAGE_KEY = 'mediglass_state';

const defaultState: AppState = {
  medications: [],
  history: [],
};

export const storage = {
  getState: (): AppState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultState;
    } catch (e) {
      console.error('Error loading state', e);
      return defaultState;
    }
  },

  saveState: (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  addMedication: (med: Medication): AppState => {
    const state = storage.getState();
    const newState = {
      ...state,
      medications: [...state.medications, med],
    };
    storage.saveState(newState);
    return newState;
  },

  deleteMedication: (id: string): AppState => {
    const state = storage.getState();
    const newState = {
      ...state,
      medications: state.medications.filter(m => m.id !== id),
      history: state.history.filter(h => h.medicationId !== id),
    };
    storage.saveState(newState);
    return newState;
  },

  recordAdherence: (record: AdherenceRecord): AppState => {
    const state = storage.getState();
    const newState = {
      ...state,
      history: [record, ...state.history],
    };
    storage.saveState(newState);
    return newState;
  },
};
