import { useState, useMemo, useCallback } from 'react';
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
import { clsx } from 'clsx';
import type { GlobeHub, GlobeCorridor } from '../../types/globe';

// Geography type from react-simple-maps
interface GeoFeature {
  rsmKey: string;
  properties: { ISO_A2?: string; name?: string };
  geometry: object;
}

// World topology - using a CDN for the world map
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

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
  exchange: '#14b8a6'       // teal
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
  const { activeLens, selection, setSelection, clearSelection } = useGlobeStore();
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1
  });
  
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
    
    // Show regulatory status on regulation lens
    if (activeLens === 'regulation' && iso2) {
      const status = countryRegulatoryStatus[iso2];
      if (status) {
        return regulatoryColors[status.status];
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
    setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }));
  }, []);
  
  const handleZoomOut = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  }, []);
  
  const handleReset = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ coordinates: [0, 20], zoom: 1 });
    clearSelection();
  }, [clearSelection]);
  
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
          onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => setPosition({ coordinates, zoom })}
          minZoom={1}
          maxZoom={8}
        >
          {/* Countries */}
          <Geographies geography={geoUrl}>
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
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Map controls - CYBERPUNK STYLED */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        <motion.button
          type="button"
          onClick={handleZoomIn}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 cyber-panel flex items-center justify-center text-cyber-glow hover:bg-cyber-glow/10 transition-colors font-cyber text-lg"
        >
          +
        </motion.button>
        <motion.button
          type="button"
          onClick={handleZoomOut}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 cyber-panel flex items-center justify-center text-cyber-glow hover:bg-cyber-glow/10 transition-colors font-cyber text-lg"
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
    </div>
  );
}
