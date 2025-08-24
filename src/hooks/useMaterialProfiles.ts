import { useState, useEffect } from 'react';
import { MaterialProfile } from '../types';
import { number } from '../utils';

const STORAGE_KEY = 'print-cost-calc:material-profiles:v1';

export function useMaterialProfiles() {
  const [profiles, setProfiles] = useState<MaterialProfile[]>(() => {
    // Initialize state from localStorage during initial render
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((profile: any) => ({
          ...profile,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt)
        }));
      }
    } catch (error) {
      console.warn('Error loading material profiles from localStorage:', error);
    }
    return [];
  });

  // Save profiles to localStorage whenever profiles change (but not on initial load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.warn('Error saving material profiles to localStorage:', error);
    }
  }, [profiles]);

  const addProfile = (profileData: Omit<MaterialProfile, 'id' | 'createdAt' | 'updatedAt' | 'costPerGram'>) => {
    const now = new Date();
    const id = `profile-${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate cost per gram - ensure pricePerKg is converted to number
    const priceKg = number(profileData.pricePerKg, 0);
    const costPerGram = priceKg > 0 ? priceKg / 1000 : 0;

    const newProfile: MaterialProfile = {
      ...profileData,
      // Ensure all numeric fields are properly converted
      pricePerKg: priceKg,
      totalSpoolWeight: number(profileData.totalSpoolWeight, 0),
      emptySpoolWeight: number(profileData.emptySpoolWeight, 0),
      filamentWeight: number(profileData.filamentWeight, 0),
      density: number(profileData.density, 1.24),
      diameter: number(profileData.diameter, 1.75),
      id,
      costPerGram,
      createdAt: now,
      updatedAt: now
    };

    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  };

  const updateProfile = (id: string, updates: Partial<MaterialProfile>) => {
    setProfiles(prev => prev.map(profile => {
      if (profile.id !== id) return profile;

      const updatedProfile = { ...profile, ...updates, updatedAt: new Date() };
      
      // Recalculate cost per gram if price changed
      if ('pricePerKg' in updates) {
        const priceKg = number(updatedProfile.pricePerKg, 0);
        updatedProfile.costPerGram = priceKg > 0 ? priceKg / 1000 : 0;
      }

      return updatedProfile;
    }));
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(profile => profile.id !== id));
  };

  const getProfile = (id: string) => {
    return profiles.find(profile => profile.id === id);
  };

  const duplicateProfile = (id: string, newName?: string) => {
    const profile = getProfile(id);
    if (!profile) return null;

    const { id: _, createdAt: __, updatedAt: ___, ...profileData } = profile;
    return addProfile({
      ...profileData,
      name: newName || `${profile.name} (Kopie)`
    });
  };

  return {
    profiles,
    addProfile,
    updateProfile,
    deleteProfile,
    getProfile,
    duplicateProfile
  };
}