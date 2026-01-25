import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup
} from 'react-simple-maps';
import { motion } from 'framer-motion';
import { useGlobeStore } from '../../store/globeStore';
import { 
  getHubs, 
  getCorridors, 
  getHubById,
  lensMetadata,
  countryRegulatoryStatus 
} from '../../data/globeContent';
import { 
  countryRegulatoryProfiles,
  getCountryProfile,
  type CountryRegulatoryProfile 
} from '../../data/regulatoryData';
import {
  ilpConnectorInstances,
  ilpCorridors,
  getTypeColor as getILPTypeColor,
  getStatusColor as getILPConnectorStatusColor,
  type ILPConnectorInstance,
  type ILPCorridor,
} from '../../data/ilpData';
import {
  paymentCorridors,
  odlPartners,
  xrplConnectedChains,
  getVolumeColor,
  type PaymentCorridor,
  type ODLPartner,
  type XRPLConnectedChain,
} from '../../data/corridorData';
import { clsx } from 'clsx';
import type { GlobeHub, GlobeCorridor, LiveValidatorMarker, LiveNodeMarker } from '../../types/globe';
import { getValidatorStatusColor, getNodeStatusColor } from '../../services/xrpScanService';

// Geography type from react-simple-maps
interface GeoFeature {
  rsmKey: string;
  properties: { ISO_A2?: string; name?: string };
  geometry: object;
}

// World topology - multiple CDN sources for fallback
const GEO_URLS = [
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
  'https://unpkg.com/world-atlas@2.0.2/countries-110m.json',
  'https://raw.githubusercontent.com/topojson/world-atlas/master/countries-110m.json',
];

// Default to first URL
const geoUrl = GEO_URLS[0];

// Hub type colors - CYBERPUNK PALETTE
const hubTypeColors: Record<GlobeHub['type'], string> = {
  headquarters: '#00d4ff',  // cyber-glow
  financial: '#00aaff',     // cyber-blue
  validator: '#00ff88',     // cyber-green
  development: '#a855f7',   // cyber-purple
  partnership: '#ffd700',   // cyber-yellow
  regional_hq: '#00ffff',   // cyber-cyan
  emerging: '#ff00ff',      // cyber-magenta
  academic: '#6366f1',      // indigo
  exchange: '#14b8a6',      // teal
  regulatory: '#f97316'     // orange
};

// Corridor volume line widths
const corridorWidths: Record<GlobeCorridor['volume'], number> = {
  high: 3,
  medium: 2,
  low: 1
};

// Regulatory status colors for countries - CYBERPUNK
const regulatoryColors: Record<string, string> = {
  favorable: 'rgba(0, 255, 136, 0.4)',   // cyber-green
  regulated: 'rgba(0, 170, 255, 0.4)',   // cyber-blue
  developing: 'rgba(255, 215, 0, 0.4)',  // cyber-yellow
  restricted: 'rgba(255, 68, 68, 0.4)',  // cyber-red
  unclear: 'rgba(100, 116, 139, 0.3)'    // muted
};

interface WorldGlobeProps {
  className?: string;
}

export function WorldGlobe({ className }: WorldGlobeProps) {
  const { 
    activeLens, 
    selection, 
    setSelection, 
    clearSelection,
    liveValidators,
    liveNodes,
    showLiveData,
  } = useGlobeStore();
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1
  });
  const [mapLocked, setMapLocked] = useState(true); // Map locked by default
  const [hoveredValidator, setHoveredValidator] = useState<LiveValidatorMarker | null>(null);
  const [hoveredNode, setHoveredNode] = useState<LiveNodeMarker | null>(null);
  const [hoveredConnector, setHoveredConnector] = useState<ILPConnectorInstance | null>(null);
  const [hoveredPaymentCorridor, setHoveredPaymentCorridor] = useState<PaymentCorridor | null>(null);
  const [hoveredODLPartner, setHoveredODLPartner] = useState<ODLPartner | null>(null);
  
  // Geography loading state
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [currentGeoUrl, setCurrentGeoUrl] = useState(GEO_URLS[0]);
  const [geoUrlIndex, setGeoUrlIndex] = useState(0);

  // Pre-fetch and validate geography data
  useEffect(() => {
    const testGeoUrl = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url);
        if (!response.ok) return false;
        const data = await response.json();
        // Check if it's valid TopoJSON
        return data && data.type === 'Topology' && data.objects;
      } catch {
        return false;
      }
    };

    const findWorkingUrl = async () => {
      setGeoLoading(true);
      setGeoError(null);
      
      for (let i = 0; i < GEO_URLS.length; i++) {
        const url = GEO_URLS[i];
        console.log(`[WorldGlobe] Trying geo source ${i + 1}/${GEO_URLS.length}: ${url}`);
        const isValid = await testGeoUrl(url);
        if (isValid) {
          console.log(`[WorldGlobe] Using geo source: ${url}`);
          setCurrentGeoUrl(url);
          setGeoUrlIndex(i);
          setGeoLoading(false);
          return;
        }
      }
      
      // All sources failed
      console.error('[WorldGlobe] All geography sources failed');
      setGeoError('Unable to load map data. Please check your internet connection.');
      setGeoLoading(false);
    };

    findWorkingUrl();
  }, []);
  
  const hubs = useMemo(() => getHubs(), []);
  const corridors = useMemo(() => getCorridors(), []);
  
  // Get corridor endpoints
  const getCorridorEndpoints = useCallback((corridor: GlobeCorridor): { from: [number, number]; to: [number, number] } | null => {
    let fromCoords: [number, number] | null = null;
    let toCoords: [number, number] | null = null;
    
    if (typeof corridor.from === 'string') {
      const hub = getHubById(corridor.from);
      if (hub) fromCoords = hub.coordinates;
    } else {
      fromCoords = corridor.from.coordinates;
    }
    
    if (typeof corridor.to === 'string') {
      const hub = getHubById(corridor.to);
      if (hub) toCoords = hub.coordinates;
    } else {
      toCoords = corridor.to.coordinates;
    }
    
    if (fromCoords && toCoords) {
      return { from: fromCoords, to: toCoords };
    }
    return null;
  }, []);
  
  // Handle country click
  const handleCountryClick = useCallback((geo: { properties: { ISO_A2?: string; name?: string } }, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const iso2 = geo.properties.ISO_A2;
    if (iso2 && iso2 !== '-99') {
      setSelection({
        type: 'country',
        id: iso2,
        countryIso2: iso2
      });
    }
  }, [setSelection]);
  
  // Handle hub click
  const handleHubClick = useCallback((hub: GlobeHub, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelection({
      type: 'hub',
      id: hub.id,
      countryIso2: hub.countryIso2
    });
  }, [setSelection]);
  
  // Handle corridor click
  const handleCorridorClick = useCallback((corridor: GlobeCorridor, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelection({
      type: 'corridor',
      id: corridor.id
    });
  }, [setSelection]);
  
  // Get country fill color based on lens
  const getCountryFill = useCallback((geo: { properties: { ISO_A2?: string } }) => {
    const iso2 = geo.properties.ISO_A2;
    
    // Highlight selected country
    if (selection.type === 'country' && selection.countryIso2 === iso2) {
      return 'rgba(0, 212, 255, 0.6)';
    }
    
    // Show regulatory status on regulation lens - use enhanced profiles
    if (activeLens === 'regulation' && iso2) {
      // First check our enhanced profiles
      const profile = getCountryProfile(iso2);
      if (profile) {
        switch (profile.overallStatus) {
          case 'favorable': return 'rgba(0, 255, 136, 0.5)';  // cyber-green
          case 'regulated': return 'rgba(0, 170, 255, 0.5)';  // cyber-blue
          case 'developing': return 'rgba(255, 215, 0, 0.4)'; // cyber-yellow
          case 'restricted': return 'rgba(255, 68, 68, 0.5)'; // cyber-red
          case 'unclear': return 'rgba(168, 85, 247, 0.3)';   // cyber-purple
        }
      }
      // Fallback to old status
      const status = countryRegulatoryStatus[iso2];
      if (status) {
        return regulatoryColors[status.status];
      }
      // EU member states inherit EU profile
      const euCountries = ['DE', 'FR', 'NL', 'IT', 'ES', 'PT', 'BE', 'AT', 'IE', 'LU', 'FI', 'SE', 'DK', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT', 'GR'];
      if (euCountries.includes(iso2)) {
        return 'rgba(0, 170, 255, 0.4)'; // regulated
      }
    }
    
    // Check if country has hubs
    const hasHub = hubs.some(h => h.countryIso2 === iso2);
    if (hasHub) {
      return 'rgba(0, 212, 255, 0.15)';
    }
    
    return '#0d1526'; // cyber-navy
  }, [activeLens, selection, hubs]);
  
  // Filter corridors by lens relevance
  const visibleCorridors = useMemo(() => {
    if (activeLens === 'corridors' || activeLens === 'ilp') {
      return corridors;
    }
    return [];
  }, [activeLens, corridors]);
  
  const visibleHubs = useMemo(() => hubs, [hubs]);
  
  const lensColor = lensMetadata[activeLens].color;
  
  // Handle zoom controls
  const handleZoomIn = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!mapLocked) {
      setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }));
    }
  }, [mapLocked]);
  
  const handleZoomOut = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!mapLocked) {
      setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
    }
  }, [mapLocked]);
  
  const handleReset = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ coordinates: [0, 20], zoom: 1 });
    clearSelection();
  }, [clearSelection]);
  
  // Show loading state
  if (geoLoading) {
    return (
      <div 
        className={clsx('relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center', className)}
        style={{ backgroundColor: '#050810' }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyber-glow/30 border-t-cyber-glow rounded-full animate-spin mx-auto mb-4" />
          <p className="font-cyber text-cyber-glow text-sm">LOADING MAP DATA...</p>
          <p className="text-cyber-muted text-xs mt-2">Connecting to geography server</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (geoError) {
    return (
      <div 
        className={clsx('relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center', className)}
        style={{ backgroundColor: '#050810' }}
      >
        <div className="text-center cyber-panel p-6 max-w-md">
          <div className="w-16 h-16 rounded-full bg-cyber-red/20 border border-cyber-red/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="font-cyber text-cyber-red text-sm mb-2">MAP LOAD FAILED</p>
          <p className="text-cyber-muted text-xs mb-4">{geoError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-cyber-glow/20 border border-cyber-glow/50 text-cyber-glow text-xs font-cyber hover:bg-cyber-glow/30 transition-all"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={clsx('relative w-full h-full rounded-lg overflow-hidden', className)}
      style={{ backgroundColor: '#050810' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Cyber Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => {
            if (!mapLocked) {
              setPosition({ coordinates, zoom });
            }
          }}
          minZoom={1}
          maxZoom={8}
          filterZoomEvent={() => !mapLocked}
        >
          {/* Countries */}
          <Geographies geography={currentGeoUrl}>
            {({ geographies }: { geographies: GeoFeature[] }) =>
              geographies.map((geo: GeoFeature) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={(e) => handleCountryClick(geo, e)}
                  style={{
                    default: {
                      fill: getCountryFill(geo),
                      stroke: '#1e3a5f',
                      strokeWidth: 0.5,
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    hover: {
                      fill: 'rgba(0, 212, 255, 0.4)',
                      stroke: '#00d4ff',
                      strokeWidth: 1,
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: {
                      fill: 'rgba(0, 212, 255, 0.5)',
                      stroke: '#00d4ff',
                      strokeWidth: 1,
                      outline: 'none'
                    }
                  }}
                />
              ))
            }
          </Geographies>
          
          {/* Corridors */}
          {visibleCorridors.map((corridor) => {
            const endpoints = getCorridorEndpoints(corridor);
            if (!endpoints) return null;
            
            const isSelected = selection.type === 'corridor' && selection.id === corridor.id;
            
            return (
              <Line
                key={corridor.id}
                from={endpoints.from}
                to={endpoints.to}
                stroke={isSelected ? '#00d4ff' : lensColor}
                strokeWidth={isSelected ? 4 : corridorWidths[corridor.volume]}
                strokeOpacity={isSelected ? 1 : 0.7}
                strokeLinecap="round"
                strokeDasharray={corridor.volume === 'low' ? '4,4' : undefined}
                onClick={(e) => handleCorridorClick(corridor, e)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
          
          {/* Hubs */}
          {visibleHubs.map((hub) => {
            const isSelected = selection.type === 'hub' && selection.id === hub.id;
            const isCountrySelected = selection.type === 'country' && selection.countryIso2 === hub.countryIso2;
            
            return (
              <Marker
                key={hub.id}
                coordinates={hub.coordinates}
                onClick={(e) => handleHubClick(hub, e)}
              >
                <g style={{ cursor: 'pointer' }}>
                  {/* Glow effect for selected */}
                  {(isSelected || isCountrySelected) && (
                    <>
                      <circle
                        r={16}
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth={2}
                        opacity={0.3}
                      />
                      <circle
                        r={12}
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth={2}
                        opacity={0.5}
                        className="animate-pulse"
                      />
                    </>
                  )}
                  
                  {/* Main marker */}
                  <circle
                    r={isSelected ? 8 : 5}
                    fill={hubTypeColors[hub.type]}
                    stroke="#050810"
                    strokeWidth={2}
                  />
                  
                  {/* Inner dot for headquarters/regional_hq */}
                  {(hub.type === 'headquarters' || hub.type === 'regional_hq') && (
                    <circle r={2} fill="#fff" />
                  )}
                </g>
              </Marker>
            );
          })}
          
          {/* Live Validators from XRPScan - shown on validators and community lenses */}
          {showLiveData && (activeLens === 'validators' || activeLens === 'community') && liveValidators.map((validator) => {
            const statusColor = getValidatorStatusColor(validator.agreement24h);
            const isHovered = hoveredValidator?.id === validator.id;
            
            return (
              <Marker
                key={`validator-${validator.id}`}
                coordinates={validator.coordinates}
              >
                <g 
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredValidator(validator)}
                  onMouseLeave={() => setHoveredValidator(null)}
                >
                  {/* Outer glow for UNL validators */}
                  {validator.isUNL && (
                    <circle
                      r={8}
                      fill="none"
                      stroke="#00ff88"
                      strokeWidth={1}
                      opacity={0.5}
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Hover glow */}
                  {isHovered && (
                    <circle
                      r={12}
                      fill="none"
                      stroke={statusColor}
                      strokeWidth={2}
                      opacity={0.6}
                    />
                  )}
                  
                  {/* Main dot */}
                  <circle
                    r={isHovered ? 5 : 3}
                    fill={statusColor}
                    stroke="#050810"
                    strokeWidth={1}
                    opacity={0.9}
                  />
                  
                  {/* UNL indicator */}
                  {validator.isUNL && (
                    <circle r={1.5} fill="#fff" opacity={0.8} />
                  )}
                </g>
              </Marker>
            );
          })}
          
          {/* Live Nodes from XRPScan - shown on validators, community, and corridors lenses */}
          {showLiveData && (activeLens === 'validators' || activeLens === 'community' || activeLens === 'corridors') && liveNodes.map((node) => {
            const statusColor = getNodeStatusColor(node.lastSeen);
            const isHovered = hoveredNode?.id === node.id;
            
            return (
              <Marker
                key={`node-${node.id}`}
                coordinates={node.coordinates}
              >
                <g 
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Hover glow */}
                  {isHovered && (
                    <circle
                      r={8}
                      fill="none"
                      stroke={statusColor}
                      strokeWidth={1.5}
                      opacity={0.5}
                    />
                  )}
                  
                  {/* Node marker (smaller than validators) */}
                  <circle
                    r={isHovered ? 3 : 2}
                    fill={statusColor}
                    stroke="#050810"
                    strokeWidth={0.5}
                    opacity={0.7}
                  />
                </g>
              </Marker>
            );
          })}
          
          {/* ILP Corridors (shown on ILP lens) */}
          {activeLens === 'ilp' && ilpCorridors.map((corridor) => {
            const corridorColor = getILPTypeColor(corridor.type);
            const lineWidth = corridor.volume === 'high' ? 3 : corridor.volume === 'medium' ? 2 : 1;
            
            return (
              <Line
                key={`ilp-corridor-${corridor.id}`}
                from={corridor.from.coordinates}
                to={corridor.to.coordinates}
                stroke={corridorColor}
                strokeWidth={lineWidth}
                strokeOpacity={0.7}
                strokeLinecap="round"
                strokeDasharray={corridor.volume === 'pilot' ? '4,4' : undefined}
              />
            );
          })}
          
          {/* ILP Connectors (shown on ILP lens) */}
          {activeLens === 'ilp' && ilpConnectorInstances.filter(c => c.location).map((connector) => {
            const statusColor = getILPConnectorStatusColor(connector.status);
            const isHovered = hoveredConnector?.id === connector.id;
            const isProduction = connector.type === 'production';
            
            return (
              <Marker
                key={`ilp-connector-${connector.id}`}
                coordinates={connector.location!.coordinates}
              >
                <g 
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredConnector(connector)}
                  onMouseLeave={() => setHoveredConnector(null)}
                >
                  {/* Outer ring for production connectors */}
                  {isProduction && (
                    <circle
                      r={10}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth={1}
                      opacity={0.3}
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Hover glow */}
                  {isHovered && (
                    <circle
                      r={14}
                      fill="none"
                      stroke={statusColor}
                      strokeWidth={2}
                      opacity={0.6}
                    />
                  )}
                  
                  {/* Main connector marker */}
                  <circle
                    r={isHovered ? 7 : 5}
                    fill={statusColor}
                    stroke="#050810"
                    strokeWidth={2}
                  />
                  
                  {/* Inner indicator */}
                  <circle
                    r={2}
                    fill={isProduction ? '#fff' : '#a855f7'}
                    opacity={0.8}
                  />
                </g>
              </Marker>
            );
          })}
          
          {/* Payment Corridors (shown on corridors lens) */}
          {activeLens === 'corridors' && paymentCorridors.map((corridor) => {
            const volumeColor = getVolumeColor(corridor.volume);
            const lineWidth = corridor.volume === 'high' ? 3 : corridor.volume === 'medium' ? 2 : 1;
            const isHovered = hoveredPaymentCorridor?.id === corridor.id;
            
            return (
              <Line
                key={`payment-corridor-${corridor.id}`}
                from={corridor.from.coordinates}
                to={corridor.to.coordinates}
                stroke={volumeColor}
                strokeWidth={isHovered ? lineWidth + 2 : lineWidth}
                strokeOpacity={isHovered ? 1 : 0.7}
                strokeLinecap="round"
                strokeDasharray={corridor.volume === 'emerging' ? '4,4' : undefined}
                onMouseEnter={() => setHoveredPaymentCorridor(corridor)}
                onMouseLeave={() => setHoveredPaymentCorridor(null)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
          
          {/* Corridor Endpoints (shown on corridors lens) */}
          {activeLens === 'corridors' && paymentCorridors.flatMap((corridor) => {
            return [
              { key: `${corridor.id}-from`, coords: corridor.from.coordinates, label: corridor.from.countryCode },
              { key: `${corridor.id}-to`, coords: corridor.to.coordinates, label: corridor.to.countryCode },
            ];
          }).filter((item, index, self) => 
            self.findIndex(i => i.coords[0] === item.coords[0] && i.coords[1] === item.coords[1]) === index
          ).map((endpoint) => (
            <Marker key={endpoint.key} coordinates={endpoint.coords}>
              <circle
                r={3}
                fill="#00ff88"
                stroke="#050810"
                strokeWidth={1}
                opacity={0.8}
              />
            </Marker>
          ))}
          
          {/* ODL Partners (shown on corridors lens) */}
          {activeLens === 'corridors' && odlPartners.filter(p => p.status === 'active').map((partner) => {
            const isHovered = hoveredODLPartner?.id === partner.id;
            const integrationColor = partner.xrpIntegration === 'full' ? '#00ff88' : partner.xrpIntegration === 'partial' ? '#ffd700' : '#64748b';
            
            return (
              <Marker
                key={`odl-partner-${partner.id}`}
                coordinates={partner.headquarters.coordinates}
              >
                <g 
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredODLPartner(partner)}
                  onMouseLeave={() => setHoveredODLPartner(null)}
                >
                  {/* Outer ring for full integration */}
                  {partner.xrpIntegration === 'full' && (
                    <circle
                      r={12}
                      fill="none"
                      stroke="#00ff88"
                      strokeWidth={1}
                      opacity={0.4}
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Hover glow */}
                  {isHovered && (
                    <circle
                      r={16}
                      fill="none"
                      stroke={integrationColor}
                      strokeWidth={2}
                      opacity={0.6}
                    />
                  )}
                  
                  {/* Main marker - square for partners */}
                  <rect
                    x={isHovered ? -6 : -4}
                    y={isHovered ? -6 : -4}
                    width={isHovered ? 12 : 8}
                    height={isHovered ? 12 : 8}
                    rx={2}
                    fill={integrationColor}
                    stroke="#050810"
                    strokeWidth={2}
                  />
                  
                  {/* Inner indicator */}
                  <circle
                    r={1.5}
                    fill="#fff"
                    opacity={0.8}
                  />
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Map controls - CYBERPUNK STYLED */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        {/* Lock/Unlock toggle */}
        <motion.button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMapLocked(!mapLocked); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`w-10 h-10 cyber-panel flex items-center justify-center transition-colors font-cyber text-sm ${
            mapLocked 
              ? 'text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow/50' 
              : 'text-cyber-green bg-cyber-green/10 border-cyber-green/50'
          }`}
          title={mapLocked ? 'Unlock map to drag' : 'Lock map position'}
        >
          {mapLocked ? '🔒' : '🔓'}
        </motion.button>
        <motion.button
          type="button"
          onClick={handleZoomIn}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={mapLocked}
          className={`w-10 h-10 cyber-panel flex items-center justify-center transition-colors font-cyber text-lg ${
            mapLocked 
              ? 'text-cyber-muted cursor-not-allowed opacity-50' 
              : 'text-cyber-glow hover:bg-cyber-glow/10'
          }`}
        >
          +
        </motion.button>
        <motion.button
          type="button"
          onClick={handleZoomOut}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={mapLocked}
          className={`w-10 h-10 cyber-panel flex items-center justify-center transition-colors font-cyber text-lg ${
            mapLocked 
              ? 'text-cyber-muted cursor-not-allowed opacity-50' 
              : 'text-cyber-glow hover:bg-cyber-glow/10'
          }`}
        >
          −
        </motion.button>
        <motion.button
          type="button"
          onClick={handleReset}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 cyber-panel flex items-center justify-center text-cyber-glow hover:bg-cyber-glow/10 transition-colors text-sm"
        >
          ↺
        </motion.button>
      </div>
      
      {/* Map lock indicator */}
      {mapLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 px-3 py-1.5 cyber-panel bg-cyber-yellow/10 border-cyber-yellow/30 text-[10px] text-cyber-yellow font-cyber tracking-wider z-10 flex items-center gap-1.5"
        >
          🔒 MAP LOCKED
        </motion.div>
      )}
      
      {/* Selection indicator */}
      {selection.type !== 'none' && (
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); clearSelection(); }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 px-4 py-2 cyber-panel text-xs text-cyber-glow font-cyber tracking-wider hover:bg-cyber-glow/10 transition-colors z-10"
        >
          CLEAR SELECTION
        </motion.button>
      )}
      
      {/* Scan lines effect */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-20" />
      
      {/* Validator Tooltip */}
      {hoveredValidator && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 right-4 z-20 cyber-panel p-3 min-w-[200px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getValidatorStatusColor(hoveredValidator.agreement24h) }}
            />
            <span className="font-cyber text-sm text-cyber-glow">
              {hoveredValidator.isUNL ? 'UNL VALIDATOR' : 'VALIDATOR'}
            </span>
          </div>
          {hoveredValidator.domain && (
            <p className="text-xs text-cyber-text mb-1 truncate">
              {hoveredValidator.domain}
            </p>
          )}
          <p className="text-[10px] text-cyber-muted font-mono truncate">
            {hoveredValidator.masterKey.slice(0, 20)}...
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-cyber-border/50">
            <div>
              <p className="text-[9px] text-cyber-muted">Agreement</p>
              <p className="text-xs font-cyber" style={{ color: getValidatorStatusColor(hoveredValidator.agreement24h) }}>
                {(hoveredValidator.agreement24h * 100).toFixed(1)}%
              </p>
            </div>
            {hoveredValidator.city && (
              <div>
                <p className="text-[9px] text-cyber-muted">Location</p>
                <p className="text-xs text-cyber-text truncate">
                  {hoveredValidator.city}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Node Tooltip */}
      {hoveredNode && !hoveredValidator && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 right-4 z-20 cyber-panel p-3 min-w-[180px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getNodeStatusColor(hoveredNode.lastSeen) }}
            />
            <span className="font-cyber text-xs text-cyber-purple">NODE</span>
          </div>
          <p className="text-[10px] text-cyber-muted font-mono truncate">
            {hoveredNode.publicKey.slice(0, 20)}...
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-cyber-border/50">
            {hoveredNode.version && (
              <div>
                <p className="text-[9px] text-cyber-muted">Version</p>
                <p className="text-xs text-cyber-text truncate">{hoveredNode.version}</p>
              </div>
            )}
            {hoveredNode.city && (
              <div>
                <p className="text-[9px] text-cyber-muted">Location</p>
                <p className="text-xs text-cyber-text truncate">{hoveredNode.city}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* ILP Connector Tooltip */}
      {hoveredConnector && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 right-4 z-20 cyber-panel p-3 min-w-[220px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getILPConnectorStatusColor(hoveredConnector.status) }}
            />
            <span className="font-cyber text-sm text-cyber-purple">
              {hoveredConnector.type === 'production' ? 'ILP CONNECTOR' : 'TESTNET CONNECTOR'}
            </span>
          </div>
          <h3 className="text-sm text-cyber-text font-medium mb-1">
            {hoveredConnector.name}
          </h3>
          <p className="text-[10px] text-cyber-muted mb-2">
            {hoveredConnector.operator} • {hoveredConnector.location?.city}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-[9px] text-cyber-muted">Implementation</p>
              <p className="text-xs text-cyber-glow">{hoveredConnector.implementation}</p>
            </div>
            <div>
              <p className="text-[9px] text-cyber-muted">Status</p>
              <p className="text-xs capitalize" style={{ color: getILPConnectorStatusColor(hoveredConnector.status) }}>
                {hoveredConnector.status}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-cyber-border/50">
            <p className="text-[9px] text-cyber-muted mb-1">Supported Assets</p>
            <div className="flex flex-wrap gap-1">
              {hoveredConnector.supportedAssets.map((asset) => (
                <span 
                  key={asset}
                  className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-glow/20 text-cyber-glow"
                >
                  {asset}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-cyber-border/50">
            <p className="text-[9px] text-cyber-muted mb-1">Features</p>
            <div className="flex flex-wrap gap-1">
              {hoveredConnector.features.slice(0, 4).map((feature) => (
                <span 
                  key={feature}
                  className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-purple/20 text-cyber-purple"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Payment Corridor Tooltip */}
      {hoveredPaymentCorridor && !hoveredConnector && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 right-4 z-20 cyber-panel p-3 min-w-[240px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-6 h-1 rounded"
              style={{ backgroundColor: getVolumeColor(hoveredPaymentCorridor.volume) }}
            />
            <span className="font-cyber text-sm text-cyber-green">PAYMENT CORRIDOR</span>
          </div>
          <h3 className="text-sm text-cyber-text font-medium mb-1">
            {hoveredPaymentCorridor.name}
          </h3>
          <p className="text-[10px] text-cyber-muted mb-2">
            {hoveredPaymentCorridor.description}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-[9px] text-cyber-muted">Type</p>
              <p className="text-xs text-cyber-text capitalize">{hoveredPaymentCorridor.type}</p>
            </div>
            <div>
              <p className="text-[9px] text-cyber-muted">Volume</p>
              <p className="text-xs capitalize" style={{ color: getVolumeColor(hoveredPaymentCorridor.volume) }}>
                {hoveredPaymentCorridor.volume}
              </p>
            </div>
            {hoveredPaymentCorridor.monthlyVolume && (
              <div>
                <p className="text-[9px] text-cyber-muted">Monthly Volume</p>
                <p className="text-xs text-cyber-green font-cyber">{hoveredPaymentCorridor.monthlyVolume}</p>
              </div>
            )}
            {hoveredPaymentCorridor.growthYoY && (
              <div>
                <p className="text-[9px] text-cyber-muted">Growth YoY</p>
                <p className="text-xs text-cyber-cyan">{hoveredPaymentCorridor.growthYoY}</p>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-cyber-border/50 flex items-center gap-2">
            {hoveredPaymentCorridor.odlEnabled && (
              <span className="px-2 py-0.5 rounded text-[9px] bg-cyber-green/20 text-cyber-green">
                ODL Enabled
              </span>
            )}
            {hoveredPaymentCorridor.xrpSettlement && (
              <span className="px-2 py-0.5 rounded text-[9px] bg-cyber-glow/20 text-cyber-glow">
                XRP Settlement
              </span>
            )}
          </div>
          {hoveredPaymentCorridor.partners.length > 0 && (
            <div className="pt-2 mt-2 border-t border-cyber-border/50">
              <p className="text-[9px] text-cyber-muted mb-1">Partners</p>
              <div className="flex flex-wrap gap-1">
                {hoveredPaymentCorridor.partners.map((partnerId) => {
                  const partner = odlPartners.find(p => p.id === partnerId);
                  return partner ? (
                    <span 
                      key={partnerId}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-purple/20 text-cyber-purple"
                    >
                      {partner.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      {/* ODL Partner Tooltip */}
      {hoveredODLPartner && !hoveredPaymentCorridor && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 right-4 z-20 cyber-panel p-3 min-w-[220px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ 
                backgroundColor: hoveredODLPartner.xrpIntegration === 'full' ? '#00ff88' : 
                                 hoveredODLPartner.xrpIntegration === 'partial' ? '#ffd700' : '#64748b' 
              }}
            />
            <span className="font-cyber text-sm text-cyber-glow">ODL PARTNER</span>
          </div>
          <h3 className="text-sm text-cyber-text font-medium mb-1">
            {hoveredODLPartner.name}
          </h3>
          <p className="text-[10px] text-cyber-muted mb-2">
            {hoveredODLPartner.headquarters.city}, {hoveredODLPartner.headquarters.country}
          </p>
          <p className="text-[10px] text-cyber-text mb-2">
            {hoveredODLPartner.description}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-[9px] text-cyber-muted">Type</p>
              <p className="text-xs text-cyber-text capitalize">{hoveredODLPartner.type.replace('-', ' ')}</p>
            </div>
            <div>
              <p className="text-[9px] text-cyber-muted">XRP Integration</p>
              <p className="text-xs capitalize" style={{ 
                color: hoveredODLPartner.xrpIntegration === 'full' ? '#00ff88' : 
                       hoveredODLPartner.xrpIntegration === 'partial' ? '#ffd700' : '#64748b' 
              }}>
                {hoveredODLPartner.xrpIntegration}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-cyber-border/50">
            <p className="text-[9px] text-cyber-muted mb-1">Services</p>
            <div className="flex flex-wrap gap-1">
              {hoveredODLPartner.services.map((service) => (
                <span 
                  key={service}
                  className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-glow/20 text-cyber-glow"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-cyber-border/50">
            <p className="text-[9px] text-cyber-muted mb-1">Active Corridors ({hoveredODLPartner.corridors.length})</p>
            <div className="flex flex-wrap gap-1">
              {hoveredODLPartner.corridors.slice(0, 4).map((corridor) => (
                <span 
                  key={corridor}
                  className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-green/20 text-cyber-green"
                >
                  {corridor}
                </span>
              ))}
              {hoveredODLPartner.corridors.length > 4 && (
                <span className="text-[9px] text-cyber-muted">+{hoveredODLPartner.corridors.length - 4} more</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
