export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string; // HH:mm
  frequency: Frequency;
  daysOfWeek?: number[]; // 0-6 for weekly
  color: string;
  icon: string;
  createdAt: number;
}

export interface AdherenceRecord {
  id: string;
  medicationId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'taken' | 'skipped';
  timestamp: number;
}

export interface AppState {
  medications: Medication[];
  history: AdherenceRecord[];
}
