import { useState } from 'react';
import { SavedProject } from '../types';

const STORAGE_KEY = 'print-cost-calc:history:v1';

export function useSavedProjects() {
  const [projects, setProjects] = useState<SavedProject[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedProject[]) : [];
    } catch {
      return [];
    }
  });

  function persist(next: SavedProject[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { /* storage full — silent */ }
    setProjects(next);
  }

  function saveProject(project: SavedProject): void {
    persist([project, ...projects]);
  }

  function deleteProject(id: string): void {
    persist(projects.filter(p => p.id !== id));
  }

  return { projects, saveProject, deleteProject };
}
