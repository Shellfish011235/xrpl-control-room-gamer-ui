// Custom hook for fetching and managing live XRPL network data
import { useEffect, useCallback, useRef } from 'react';
import { useGlobeStore } from '../store/globeStore';
import { 
  fetchNetworkSnapshot,
  type LiveValidator,
  type LiveNode,
} from '../services/xrpScanService';
import type { LiveValidatorMarker, LiveNodeMarker, LiveNetworkStats } from '../types/globe';

// Convert LiveValidator to LiveValidatorMarker (for map display)
function toValidatorMarker(v: LiveValidator): LiveValidatorMarker | null {
  if (!v.coordinates) return null;
  
  return {
    id: v.id,
    masterKey: v.masterKey,
    domain: v.domain,
    isUNL: v.isUNL,
    agreement24h: v.agreement24h,
    coordinates: v.coordinates,
    city: v.city,
    countryCode: v.countryCode,
    lastSeen: v.lastSeen,
  };
}

// Convert LiveNode to LiveNodeMarker (for map display)
function toNodeMarker(n: LiveNode): LiveNodeMarker | null {
  if (!n.coordinates) return null;
  
  return {
    id: n.id,
    publicKey: n.publicKey,
    coordinates: n.coordinates,
    city: n.city,
    countryCode: n.countryCode,
    version: n.version,
    lastSeen: n.lastSeen,
  };
}

interface UseLiveNetworkDataOptions {
  // Auto-refresh interval in milliseconds (default: 60000 = 1 minute)
  refreshInterval?: number;
  // Whether to fetch on mount (default: true)
  fetchOnMount?: boolean;
}

export function useLiveNetworkData(options: UseLiveNetworkDataOptions = {}) {
  const { refreshInterval = 60000, fetchOnMount = true } = options;
  
  const {
    liveValidators,
    liveNodes,
    liveNetworkStats,
    isLoadingLiveData,
    liveDataError,
    showLiveData,
    setLiveValidators,
    setLiveNodes,
    setLiveNetworkStats,
    setIsLoadingLiveData,
    setLiveDataError,
    toggleShowLiveData,
  } = useGlobeStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoadingLiveData(true);
    setLiveDataError(null);

    try {
      const snapshot = await fetchNetworkSnapshot();
      
      if (!isMountedRef.current) return;

      // Convert to marker format (only items with coordinates)
      const validatorMarkers = snapshot.validators
        .map(toValidatorMarker)
        .filter((v): v is LiveValidatorMarker => v !== null);
      
      const nodeMarkers = snapshot.nodes
        .map(toNodeMarker)
        .filter((n): n is LiveNodeMarker => n !== null);

      // Calculate top countries
      const countryMap = new Map<string, number>();
      validatorMarkers.forEach(v => {
        if (v.countryCode) {
          countryMap.set(v.countryCode, (countryMap.get(v.countryCode) || 0) + 1);
        }
      });
      nodeMarkers.forEach(n => {
        if (n.countryCode) {
          countryMap.set(n.countryCode, (countryMap.get(n.countryCode) || 0) + 1);
        }
      });
      
      const topCountries = Array.from(countryMap.entries())
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Build network stats
      const networkStats: LiveNetworkStats = {
        totalValidators: snapshot.validatorStats.total,
        unlValidators: snapshot.validatorStats.unlValidators,
        activeValidators: snapshot.validatorStats.activeValidators,
        totalNodes: snapshot.nodeStats.total,
        activeNodes: snapshot.nodeStats.activeNodes,
        averageAgreement: snapshot.validatorStats.averageAgreement24h,
        topCountries,
        lastUpdated: snapshot.fetchedAt,
      };

      setLiveValidators(validatorMarkers);
      setLiveNodes(nodeMarkers);
      setLiveNetworkStats(networkStats);

      console.log('[useLiveNetworkData] Data updated:', {
        validators: validatorMarkers.length,
        nodes: nodeMarkers.length,
        stats: networkStats,
      });

    } catch (error) {
      console.error('[useLiveNetworkData] Error fetching data:', error);
      if (isMountedRef.current) {
        setLiveDataError(error instanceof Error ? error.message : 'Failed to fetch network data');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingLiveData(false);
      }
    }
  }, [setLiveValidators, setLiveNodes, setLiveNetworkStats, setIsLoadingLiveData, setLiveDataError]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    
    if (fetchOnMount) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchOnMount, fetchData]);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && showLiveData) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, showLiveData, fetchData]);

  return {
    validators: liveValidators,
    nodes: liveNodes,
    stats: liveNetworkStats,
    isLoading: isLoadingLiveData,
    error: liveDataError,
    showLiveData,
    toggleShowLiveData,
    refetch: fetchData,
  };
}

export default useLiveNetworkData;
