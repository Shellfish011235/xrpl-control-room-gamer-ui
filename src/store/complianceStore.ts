/**
 * Compliance Guard — profile + derived permission set. Client-only; not a legal engine.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type BotMode,
  type CompliancePermissionSet,
  type ComplianceProfile,
  type IntendedUse,
  type UserType,
  DEFAULT_FLORIDA_PROFILE,
  getCompliancePermissionSet,
} from '../compliance/jurisdictionRules';

function recompute(profile: ComplianceProfile): { profile: ComplianceProfile; permissionSet: CompliancePermissionSet } {
  return {
    profile: { ...profile },
    permissionSet: getCompliancePermissionSet(profile),
  };
}

export interface ComplianceState {
  profile: ComplianceProfile;
  permissionSet: CompliancePermissionSet;
}

export interface ComplianceActions {
  setCountry: (country: string) => void;
  setRegion: (region: string) => void;
  setUserType: (userType: UserType) => void;
  setIntendedUse: (intendedUse: IntendedUse) => void;
  setBotMode: (botMode: BotMode) => void;
  resetToFloridaDefault: () => void;
}

const init = recompute({ ...DEFAULT_FLORIDA_PROFILE });

export const useComplianceStore = create<ComplianceState & ComplianceActions>()(
  persist(
    (set) => ({
      ...init,

      setCountry: (country) => set((s) => recompute({ ...s.profile, country })),
      setRegion: (region) => set((s) => recompute({ ...s.profile, region })),
      setUserType: (userType) => set((s) => recompute({ ...s.profile, userType })),
      setIntendedUse: (intendedUse) => set((s) => recompute({ ...s.profile, intendedUse })),
      setBotMode: (botMode) => set((s) => recompute({ ...s.profile, botMode })),

      resetToFloridaDefault: () => set(recompute({ ...DEFAULT_FLORIDA_PROFILE })),
    }),
    { name: 'xrpl-compliance-guard-v0-1' }
  )
);
