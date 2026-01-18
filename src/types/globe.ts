// Globe/Overworld Type Definitions

export type GlobeLens = 
  | 'validators'
  | 'ilp'
  | 'corridors'
  | 'community'
  | 'regulation'
  | 'projects';

export interface GlobeHub {
  id: string;
  name: string;
  city: string;
  countryIso2: string;
  coordinates: [number, number]; // [lng, lat]
  type: 'headquarters' | 'financial' | 'validator' | 'development' | 'partnership' | 'regional_hq' | 'emerging' | 'academic' | 'exchange';
  description: string;
  validators: number;
  projects: number;
}

export interface GlobeCorridor {
  id: string;
  name: string;
  from: string | { countryIso2: string; coordinates: [number, number] };
  to: string | { countryIso2: string; coordinates: [number, number] };
  type: 'remittance' | 'business' | 'mixed';
  volume: 'high' | 'medium' | 'low';
  description: string;
}

export interface BriefItem {
  id: string;
  title: string;
  summary: string;
  tag: string;
  date: string;
  sourceIds: string[];
  related: {
    countryIso2: string | null;
    hubId: string | null;
    corridorId: string | null;
  };
}

export interface LensBrief {
  lens: GlobeLens;
  asOf: string;
  globalSummary: string;
  items: BriefItem[];
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  type: 'registry' | 'documentation' | 'corporate' | 'statistics' | 'analytics' | 'blog' | 'government' | 'foundation' | 'events' | 'repository' | 'social' | 'education' | 'testnet';
  reliability: 'high' | 'medium' | 'low';
}

export interface Claim {
  id: string;
  claimType: string;
  claim: string;
  evidenceLevel: 'high' | 'medium' | 'low';
  sourceIds: string[];
  jurisdiction: string | null;
  limitations: string[];
  asOf: string;
}

export interface GlobeSelection {
  type: 'none' | 'country' | 'hub' | 'corridor';
  id: string | null;
  countryIso2?: string;
}

export interface GlobeState {
  activeLens: GlobeLens;
  selection: GlobeSelection;
  sidebarExpanded: boolean;
}

// Content pack types
export interface HubsData {
  hubs: GlobeHub[];
  corridors: GlobeCorridor[];
}

export interface SourcesData {
  sources: Source[];
}

export interface ClaimsData {
  claims: Claim[];
  evidenceLevels: Record<string, string>;
  notClaiming: string[];
}

export interface BuildInfo {
  version: string;
  buildDate: string;
  dataFreshness: Record<string, string>;
  updatePolicy: {
    frequency: string;
    process: string;
    disclaimer: string;
  };
  coverage: {
    countries: number;
    hubs: number;
    corridors: number;
    validators: number;
    projects: number;
  };
}

// Pinned item reference (stored in browser storage)
export interface PinnedItemRef {
  type: 'hub' | 'corridor' | 'country' | 'brief-item';
  id: string;
  lens: GlobeLens;
  pinnedAt: string; // ISO date
  label: string; // Display label for quick reference
}

// Guided step definition (from content packs)
export interface GuidedStep {
  id: string;
  title: string;
  prompt: string;
  exampleRefs: Array<{ type: string; id: string }>;
  proofClaimIds: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

// Guided steps content pack
export interface GuidedStepsData {
  lens: GlobeLens;
  asOf: string;
  steps: GuidedStep[];
}

// User's guided step completion state (stored in browser storage)
export interface GuidedStepCompletion {
  stepId: string;
  completed: boolean;
  teachBackResponse?: string;
  completedAt?: string;
}
