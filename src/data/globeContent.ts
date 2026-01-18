// Import content packs - these would typically be fetched or bundled
import validatorsBrief from '../content-packs/v1/validators/brief.json';
import ilpBrief from '../content-packs/v1/ilp/brief.json';
import corridorsBrief from '../content-packs/v1/corridors/brief.json';
import communityBrief from '../content-packs/v1/community/brief.json';
import regulationBrief from '../content-packs/v1/regulation/brief.json';
import projectsBrief from '../content-packs/v1/projects/brief.json';
import hubsData from '../content-packs/v1/hubs/data.json';
import sourcesData from '../content-packs/v1/meta/sources.json';
import claimsData from '../content-packs/v1/meta/claims.json';
import buildInfo from '../content-packs/v1/meta/build-info.json';

// Import guided steps
import validatorsGuidedSteps from '../content-packs/v1/validators/guided-steps.json';
import ilpGuidedSteps from '../content-packs/v1/ilp/guided-steps.json';
import corridorsGuidedSteps from '../content-packs/v1/corridors/guided-steps.json';
import communityGuidedSteps from '../content-packs/v1/community/guided-steps.json';
import regulationGuidedSteps from '../content-packs/v1/regulation/guided-steps.json';
import projectsGuidedSteps from '../content-packs/v1/projects/guided-steps.json';

import type { 
  GlobeLens, 
  LensBrief, 
  GlobeHub, 
  GlobeCorridor, 
  Source, 
  Claim,
  BriefItem,
  GlobeSelection,
  GuidedStepsData,
  GuidedStep
} from '../types/globe';

// Brief data by lens
const briefsByLens: Record<GlobeLens, LensBrief> = {
  validators: validatorsBrief as LensBrief,
  ilp: ilpBrief as LensBrief,
  corridors: corridorsBrief as LensBrief,
  community: communityBrief as LensBrief,
  regulation: regulationBrief as LensBrief,
  projects: projectsBrief as LensBrief
};

// Guided steps by lens
const guidedStepsByLens: Record<GlobeLens, GuidedStepsData> = {
  validators: validatorsGuidedSteps as GuidedStepsData,
  ilp: ilpGuidedSteps as GuidedStepsData,
  corridors: corridorsGuidedSteps as GuidedStepsData,
  community: communityGuidedSteps as GuidedStepsData,
  regulation: regulationGuidedSteps as GuidedStepsData,
  projects: projectsGuidedSteps as GuidedStepsData
};

// Lens metadata - CYBERPUNK THEMED
export const lensMetadata: Record<GlobeLens, { 
  label: string; 
  description: string; 
  icon: string;
  color: string;
}> = {
  validators: {
    label: 'Validators',
    description: 'Network validators securing the XRP Ledger through consensus',
    icon: 'server',
    color: '#00d4ff' // cyber-glow
  },
  ilp: {
    label: 'ILP Connectors',
    description: 'Interledger Protocol connectors bridging payment networks',
    icon: 'link',
    color: '#a855f7' // cyber-purple
  },
  corridors: {
    label: 'Payment Corridors',
    description: 'Active cross-border payment and remittance routes',
    icon: 'route',
    color: '#00ff88' // cyber-green
  },
  community: {
    label: 'Community',
    description: 'Developer communities, meetups, and ecosystem events',
    icon: 'users',
    color: '#ffd700' // cyber-yellow
  },
  regulation: {
    label: 'Regulation',
    description: 'Regulatory status and policy developments by jurisdiction',
    icon: 'scale',
    color: '#ff4444' // cyber-red
  },
  projects: {
    label: 'Projects',
    description: 'Active projects and companies building on XRPL',
    icon: 'building',
    color: '#00ffff' // cyber-cyan
  }
};

// Get brief for a lens
export function getBriefForLens(lens: GlobeLens): LensBrief {
  return briefsByLens[lens];
}

// Get guided steps for a lens
export function getGuidedStepsForLens(lens: GlobeLens): GuidedStepsData {
  return guidedStepsByLens[lens];
}

// Get a specific guided step by ID
export function getGuidedStepById(lens: GlobeLens, stepId: string): GuidedStep | undefined {
  return guidedStepsByLens[lens].steps.find(s => s.id === stepId);
}

// Get brief item by ID (for example refs)
export function getBriefItemById(itemId: string): BriefItem | undefined {
  for (const lens of Object.keys(briefsByLens) as GlobeLens[]) {
    const item = briefsByLens[lens].items.find(i => i.id === itemId);
    if (item) return item;
  }
  return undefined;
}

// Get all hubs
export function getHubs(): GlobeHub[] {
  return hubsData.hubs as GlobeHub[];
}

// Get all corridors
export function getCorridors(): GlobeCorridor[] {
  return hubsData.corridors as GlobeCorridor[];
}

// Get hub by ID
export function getHubById(id: string): GlobeHub | undefined {
  return hubsData.hubs.find(h => h.id === id) as GlobeHub | undefined;
}

// Get corridor by ID
export function getCorridorById(id: string): GlobeCorridor | undefined {
  return hubsData.corridors.find(c => c.id === id) as GlobeCorridor | undefined;
}

// Get source by ID
export function getSourceById(id: string): Source | undefined {
  return sourcesData.sources.find(s => s.id === id) as Source | undefined;
}

// Get sources by IDs
export function getSourcesByIds(ids: string[]): Source[] {
  return ids
    .map(id => getSourceById(id))
    .filter((s): s is Source => s !== undefined);
}

// Get claims related to a selection
export function getClaimsForSelection(selection: GlobeSelection): Claim[] {
  if (selection.type === 'none') return [];
  
  // Filter claims by jurisdiction if country selected
  if (selection.type === 'country' && selection.countryIso2) {
    return (claimsData.claims as Claim[]).filter(
      c => c.jurisdiction === selection.countryIso2 || c.jurisdiction === null
    );
  }
  
  return claimsData.claims as Claim[];
}

// Get brief items filtered by selection
export function getFilteredBriefItems(
  lens: GlobeLens, 
  selection: GlobeSelection
): BriefItem[] {
  const brief = getBriefForLens(lens);
  
  if (selection.type === 'none') {
    return brief.items;
  }
  
  if (selection.type === 'country' && selection.countryIso2) {
    return brief.items.filter(
      item => item.related.countryIso2 === selection.countryIso2 || 
              item.related.countryIso2 === null
    );
  }
  
  if (selection.type === 'hub' && selection.id) {
    return brief.items.filter(
      item => item.related.hubId === selection.id || 
              item.related.hubId === null
    );
  }
  
  if (selection.type === 'corridor' && selection.id) {
    return brief.items.filter(
      item => item.related.corridorId === selection.id || 
              item.related.corridorId === null
    );
  }
  
  return brief.items;
}

// Get build info
export function getBuildInfo() {
  return buildInfo;
}

// Evidence level descriptions
export function getEvidenceLevelDescription(level: 'high' | 'medium' | 'low'): string {
  return (claimsData as { evidenceLevels: Record<string, string> }).evidenceLevels[level] || '';
}

// What we don't claim
export function getNotClaimingList(): string[] {
  return (claimsData as { notClaiming: string[] }).notClaiming || [];
}

// Country regulatory status (simplified) - CYBERPUNK COLORS
export const countryRegulatoryStatus: Record<string, {
  status: 'favorable' | 'regulated' | 'developing' | 'restricted' | 'unclear';
  label: string;
}> = {
  US: { status: 'favorable', label: 'Favorable (post-EO 14178)' },
  JP: { status: 'regulated', label: 'Regulated (JFSA)' },
  SG: { status: 'favorable', label: 'Favorable (MAS)' },
  AE: { status: 'favorable', label: 'Very Favorable (VARA)' },
  GB: { status: 'developing', label: 'Developing (FCA)' },
  DE: { status: 'regulated', label: 'Regulated (MiCA)' },
  FR: { status: 'regulated', label: 'Regulated (MiCA)' },
  NL: { status: 'regulated', label: 'Regulated (MiCA)' },
  CH: { status: 'favorable', label: 'Favorable (FINMA)' },
  AU: { status: 'developing', label: 'Developing' },
  CA: { status: 'developing', label: 'Developing' },
  KR: { status: 'regulated', label: 'Regulated' },
  IN: { status: 'unclear', label: 'Unclear' },
  BR: { status: 'developing', label: 'Developing' },
  MX: { status: 'developing', label: 'Developing' },
  PH: { status: 'developing', label: 'Developing (BSP)' }
};
