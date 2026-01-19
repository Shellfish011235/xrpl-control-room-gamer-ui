// XRPScan API Service - Fetches live validator and node data
// Documentation: https://docs.xrpscan.com

const XRPSCAN_API_BASE = 'https://api.xrpscan.com/api/v1';

// ==================== TYPES ====================

export interface XRPScanValidator {
  master_key: string;
  ephemeral_key?: string;
  domain?: string;
  domain_verified?: boolean;
  server_version?: {
    version_full?: string;
    first_seen?: string;
  };
  last_seen?: string;
  last_seen_unix?: number;
  agreement_1h?: {
    score?: number;
    total?: number;
    missed?: number;
  };
  agreement_24h?: {
    score?: number;
    total?: number;
    missed?: number;
  };
  agreement_30d?: {
    score?: number;
    total?: number;
    missed?: number;
  };
  unl?: boolean;
  unl_publisher?: string[];
  chain?: string;
}

export interface XRPScanNode {
  public_key: string;
  ip?: string;
  port?: number;
  version?: string;
  uptime?: number;
  last_seen?: string;
  last_seen_unix?: number;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
  isp?: string;
  org?: string;
  asn?: string;
  timezone?: string;
  inbound?: boolean;
  outbound?: boolean;
}

// Processed types for our UI
export interface LiveValidator {
  id: string;
  masterKey: string;
  domain?: string;
  domainVerified: boolean;
  serverVersion?: string;
  lastSeen?: Date;
  agreement1h: number;
  agreement24h: number;
  agreement30d: number;
  isUNL: boolean;
  unlPublishers: string[];
  chain: string;
  // Location (if matched with node)
  coordinates?: [number, number];
  city?: string;
  country?: string;
  countryCode?: string;
}

export interface LiveNode {
  id: string;
  publicKey: string;
  ip?: string;
  version?: string;
  uptime?: number;
  lastSeen?: Date;
  coordinates?: [number, number];
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  org?: string;
  isInbound: boolean;
  isOutbound: boolean;
}

export interface ValidatorStats {
  total: number;
  unlValidators: number;
  activeValidators: number;
  averageAgreement24h: number;
  byChain: Record<string, number>;
  byPublisher: Record<string, number>;
}

export interface NodeStats {
  total: number;
  activeNodes: number;
  byCountry: Record<string, number>;
  byVersion: Record<string, number>;
}

export interface NetworkSnapshot {
  validators: LiveValidator[];
  nodes: LiveNode[];
  validatorStats: ValidatorStats;
  nodeStats: NodeStats;
  fetchedAt: Date;
}

// ==================== API FUNCTIONS ====================

/**
 * Fetch all validators from XRPScan registry
 */
export async function fetchValidatorRegistry(): Promise<XRPScanValidator[]> {
  console.log('[XRPScan] Fetching validator registry...');
  
  try {
    const response = await fetch(`${XRPSCAN_API_BASE}/validatorregistry`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`XRPScan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[XRPScan] Fetched ${Array.isArray(data) ? data.length : 0} validators`);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[XRPScan] Error fetching validators:', error);
    throw error;
  }
}

/**
 * Fetch all nodes from XRPScan
 */
export async function fetchNodes(): Promise<XRPScanNode[]> {
  console.log('[XRPScan] Fetching nodes...');
  
  try {
    const response = await fetch(`${XRPSCAN_API_BASE}/nodes`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`XRPScan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[XRPScan] Fetched ${Array.isArray(data) ? data.length : 0} nodes`);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[XRPScan] Error fetching nodes:', error);
    throw error;
  }
}

/**
 * Process raw validator data into our UI format
 */
export function processValidators(
  rawValidators: XRPScanValidator[],
  nodes: XRPScanNode[]
): LiveValidator[] {
  // Create a map of node public keys to locations
  const nodeLocationMap = new Map<string, XRPScanNode>();
  nodes.forEach(node => {
    if (node.public_key && node.lat && node.lon) {
      nodeLocationMap.set(node.public_key, node);
    }
  });

  return rawValidators.map(v => {
    // Try to find matching node for location
    const matchingNode = nodeLocationMap.get(v.master_key) || 
                         nodeLocationMap.get(v.ephemeral_key || '');
    
    const validator: LiveValidator = {
      id: v.master_key.slice(0, 12),
      masterKey: v.master_key,
      domain: v.domain,
      domainVerified: v.domain_verified || false,
      serverVersion: v.server_version?.version_full,
      lastSeen: v.last_seen ? new Date(v.last_seen) : undefined,
      agreement1h: v.agreement_1h?.score || 0,
      agreement24h: v.agreement_24h?.score || 0,
      agreement30d: v.agreement_30d?.score || 0,
      isUNL: v.unl || false,
      unlPublishers: v.unl_publisher || [],
      chain: v.chain || 'main',
    };

    // Add location if available from node data
    if (matchingNode) {
      validator.coordinates = [matchingNode.lon!, matchingNode.lat!];
      validator.city = matchingNode.city;
      validator.country = matchingNode.country;
      validator.countryCode = matchingNode.country_code;
    }

    return validator;
  });
}

/**
 * Process raw node data into our UI format
 */
export function processNodes(rawNodes: XRPScanNode[]): LiveNode[] {
  return rawNodes
    .filter(n => n.lat && n.lon) // Only include nodes with location data
    .map(n => ({
      id: n.public_key.slice(0, 12),
      publicKey: n.public_key,
      ip: n.ip,
      version: n.version,
      uptime: n.uptime,
      lastSeen: n.last_seen ? new Date(n.last_seen) : undefined,
      coordinates: [n.lon!, n.lat!] as [number, number],
      city: n.city,
      region: n.region,
      country: n.country,
      countryCode: n.country_code,
      isp: n.isp,
      org: n.org,
      isInbound: n.inbound || false,
      isOutbound: n.outbound || false,
    }));
}

/**
 * Calculate validator statistics
 */
export function calculateValidatorStats(validators: LiveValidator[]): ValidatorStats {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const activeValidators = validators.filter(v => 
    v.lastSeen && v.lastSeen.getTime() > oneHourAgo
  );

  const unlValidators = validators.filter(v => v.isUNL);

  const agreements = validators
    .map(v => v.agreement24h)
    .filter(a => a > 0);
  
  const averageAgreement24h = agreements.length > 0
    ? agreements.reduce((sum, a) => sum + a, 0) / agreements.length
    : 0;

  // Group by chain
  const byChain: Record<string, number> = {};
  validators.forEach(v => {
    byChain[v.chain] = (byChain[v.chain] || 0) + 1;
  });

  // Group by UNL publisher
  const byPublisher: Record<string, number> = {};
  validators.forEach(v => {
    v.unlPublishers.forEach(pub => {
      byPublisher[pub] = (byPublisher[pub] || 0) + 1;
    });
  });

  return {
    total: validators.length,
    unlValidators: unlValidators.length,
    activeValidators: activeValidators.length,
    averageAgreement24h,
    byChain,
    byPublisher,
  };
}

/**
 * Calculate node statistics
 */
export function calculateNodeStats(nodes: LiveNode[]): NodeStats {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const activeNodes = nodes.filter(n => 
    n.lastSeen && n.lastSeen.getTime() > oneHourAgo
  );

  // Group by country
  const byCountry: Record<string, number> = {};
  nodes.forEach(n => {
    if (n.countryCode) {
      byCountry[n.countryCode] = (byCountry[n.countryCode] || 0) + 1;
    }
  });

  // Group by version (major version only)
  const byVersion: Record<string, number> = {};
  nodes.forEach(n => {
    if (n.version) {
      const majorVersion = n.version.split('.').slice(0, 2).join('.');
      byVersion[majorVersion] = (byVersion[majorVersion] || 0) + 1;
    }
  });

  return {
    total: nodes.length,
    activeNodes: activeNodes.length,
    byCountry,
    byVersion,
  };
}

/**
 * Fetch complete network snapshot (validators + nodes)
 */
export async function fetchNetworkSnapshot(): Promise<NetworkSnapshot> {
  console.log('[XRPScan] Fetching complete network snapshot...');
  
  try {
    // Fetch both in parallel
    const [rawValidators, rawNodes] = await Promise.all([
      fetchValidatorRegistry(),
      fetchNodes(),
    ]);

    // Process the data
    const validators = processValidators(rawValidators, rawNodes);
    const nodes = processNodes(rawNodes);
    const validatorStats = calculateValidatorStats(validators);
    const nodeStats = calculateNodeStats(nodes);

    const snapshot: NetworkSnapshot = {
      validators,
      nodes,
      validatorStats,
      nodeStats,
      fetchedAt: new Date(),
    };

    console.log('[XRPScan] Network snapshot complete:', {
      validators: validators.length,
      validatorsWithLocation: validators.filter(v => v.coordinates).length,
      nodes: nodes.length,
      unlValidators: validatorStats.unlValidators,
    });

    return snapshot;
  } catch (error) {
    console.error('[XRPScan] Error fetching network snapshot:', error);
    throw error;
  }
}

/**
 * Group validators by geographic region for map clustering
 */
export function clusterValidatorsByRegion(validators: LiveValidator[]): Map<string, LiveValidator[]> {
  const clusters = new Map<string, LiveValidator[]>();
  
  validators.forEach(v => {
    if (v.countryCode) {
      const existing = clusters.get(v.countryCode) || [];
      existing.push(v);
      clusters.set(v.countryCode, existing);
    }
  });

  return clusters;
}

/**
 * Group nodes by geographic region for map clustering
 */
export function clusterNodesByRegion(nodes: LiveNode[]): Map<string, LiveNode[]> {
  const clusters = new Map<string, LiveNode[]>();
  
  nodes.forEach(n => {
    if (n.countryCode) {
      const existing = clusters.get(n.countryCode) || [];
      existing.push(n);
      clusters.set(n.countryCode, existing);
    }
  });

  return clusters;
}

/**
 * Get geographic center of a cluster of validators
 */
export function getClusterCenter(validators: LiveValidator[]): [number, number] | null {
  const withCoords = validators.filter(v => v.coordinates);
  if (withCoords.length === 0) return null;

  const sumLng = withCoords.reduce((sum, v) => sum + v.coordinates![0], 0);
  const sumLat = withCoords.reduce((sum, v) => sum + v.coordinates![1], 0);

  return [sumLng / withCoords.length, sumLat / withCoords.length];
}

/**
 * Format time ago string
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Get validator status color based on agreement
 */
export function getValidatorStatusColor(agreement24h: number): string {
  if (agreement24h >= 0.99) return '#00ff88'; // Excellent - cyber-green
  if (agreement24h >= 0.95) return '#00d4ff'; // Good - cyber-glow
  if (agreement24h >= 0.90) return '#ffd700'; // Warning - cyber-yellow
  return '#ff4444'; // Poor - cyber-red
}

/**
 * Get node status color based on last seen
 */
export function getNodeStatusColor(lastSeen?: Date): string {
  if (!lastSeen) return '#64748b'; // Unknown - muted
  
  const minutesAgo = (Date.now() - lastSeen.getTime()) / 60000;
  
  if (minutesAgo < 5) return '#00ff88'; // Online - cyber-green
  if (minutesAgo < 30) return '#00d4ff'; // Recent - cyber-glow
  if (minutesAgo < 60) return '#ffd700'; // Stale - cyber-yellow
  return '#ff4444'; // Offline - cyber-red
}
