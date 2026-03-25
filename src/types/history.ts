import { AppState } from './app-state';

export interface SavedProject {
  id: string;
  name: string;
  savedAt: string; // ISO string
  appState: AppState;
  total: number;
  currency: string;
  mode: 'hobby' | 'business';
}
