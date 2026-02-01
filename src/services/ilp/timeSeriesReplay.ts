// Time-Series Replay System for ILP Routes
// Records route history and enables playback/scrubbing through time
// "History is the topology of trust over time"

import type { RouteResult, Ledger, Corridor } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface RouteSnapshot {
  id: string;
  timestamp: number;
  route: {
    from: string;
    to: string;
    path: string[];
    confidence: number;
    carValidated: boolean;
  };
  graphState: {
    activeNodes: string[];
    activeEdges: string[];
    highlightedPath: string[];
  };
  metadata?: {
    source: 'user' | 'auto' | 'xrpl' | 'simulation';
    amendment?: string;
    note?: string;
  };
}

export interface TopologySnapshot {
  id: string;
  timestamp: number;
  label: string;
  ledgers: SerializedLedger[];
  corridors: SerializedCorridor[];
  metadata?: {
    amendment?: string;
    event?: string;
  };
}

interface SerializedLedger {
  id: string;
  name: string;
  domain: string;
  trustScore: number;
  riskFlags: string[];
}

interface SerializedCorridor {
  id: string;
  from: string;
  to: string;
  confidence: number;
  status: string;
}

export interface ReplayState {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  playbackSpeed: number; // 0.5x, 1x, 2x, 4x
  startTime: number | null;
  endTime: number | null;
}

export interface TimeRange {
  start: number;
  end: number;
}

type ReplayCallback = (snapshot: RouteSnapshot, index: number, total: number) => void;
type TopologyCallback = (snapshot: TopologySnapshot) => void;

// =============================================================================
// TIME-SERIES REPLAY ENGINE
// =============================================================================

class TimeSeriesReplayEngine {
  private routeHistory: RouteSnapshot[] = [];
  private topologyHistory: TopologySnapshot[] = [];
  private state: ReplayState = {
    isPlaying: false,
    isPaused: false,
    currentIndex: 0,
    playbackSpeed: 1,
    startTime: null,
    endTime: null,
  };
  private playbackTimer: NodeJS.Timeout | null = null;
  private onRouteCallback: ReplayCallback | null = null;
  private onTopologyCallback: TopologyCallback | null = null;
  private maxHistorySize = 1000;

  // ==========================================================================
  // RECORDING
  // ==========================================================================

  recordRoute(
    from: string,
    to: string,
    path: string[],
    confidence: number,
    carValidated: boolean,
    metadata?: RouteSnapshot['metadata']
  ): RouteSnapshot {
    const snapshot: RouteSnapshot = {
      id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      route: { from, to, path, confidence, carValidated },
      graphState: {
        activeNodes: [...new Set([from, to, ...path])],
        activeEdges: this.pathToEdges(path),
        highlightedPath: path,
      },
      metadata,
    };

    this.routeHistory.push(snapshot);
    
    // Trim history if too large
    if (this.routeHistory.length > this.maxHistorySize) {
      this.routeHistory = this.routeHistory.slice(-this.maxHistorySize);
    }

    console.log(`[TimeSeriesReplay] Recorded route: ${from} → ${to} (${path.length} hops)`);
    return snapshot;
  }

  recordTopologySnapshot(
    label: string,
    ledgers: Ledger[],
    corridors: Corridor[],
    metadata?: TopologySnapshot['metadata']
  ): TopologySnapshot {
    const snapshot: TopologySnapshot = {
      id: `topo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      label,
      ledgers: ledgers.map(l => ({
        id: l.id,
        name: l.name,
        domain: l.domain,
        trustScore: 0.5, // Would come from connectors
        riskFlags: l.risk_flags,
      })),
      corridors: corridors.map(c => ({
        id: c.id,
        from: c.from_ledger,
        to: c.to_ledger,
        confidence: c.glow,
        status: c.status,
      })),
      metadata,
    };

    this.topologyHistory.push(snapshot);
    
    if (this.topologyHistory.length > 100) {
      this.topologyHistory = this.topologyHistory.slice(-100);
    }

    console.log(`[TimeSeriesReplay] Recorded topology snapshot: ${label}`);
    return snapshot;
  }

  // ==========================================================================
  // PLAYBACK CONTROLS
  // ==========================================================================

  play(callback: ReplayCallback): void {
    if (this.routeHistory.length === 0) {
      console.warn('[TimeSeriesReplay] No routes to replay');
      return;
    }

    this.onRouteCallback = callback;
    this.state.isPlaying = true;
    this.state.isPaused = false;

    if (this.state.currentIndex >= this.routeHistory.length) {
      this.state.currentIndex = 0;
    }

    this.scheduleNextFrame();
  }

  pause(): void {
    this.state.isPaused = true;
    this.state.isPlaying = false;
    
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  resume(): void {
    if (!this.state.isPaused) return;
    
    this.state.isPaused = false;
    this.state.isPlaying = true;
    this.scheduleNextFrame();
  }

  stop(): void {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.currentIndex = 0;

    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  seekTo(index: number): void {
    const wasPlaying = this.state.isPlaying;
    this.pause();
    
    this.state.currentIndex = Math.max(0, Math.min(index, this.routeHistory.length - 1));
    
    if (this.onRouteCallback && this.routeHistory[this.state.currentIndex]) {
      this.onRouteCallback(
        this.routeHistory[this.state.currentIndex],
        this.state.currentIndex,
        this.routeHistory.length
      );
    }

    if (wasPlaying) {
      this.resume();
    }
  }

  seekToTimestamp(timestamp: number): void {
    const index = this.routeHistory.findIndex(r => r.timestamp >= timestamp);
    if (index !== -1) {
      this.seekTo(index);
    }
  }

  setPlaybackSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0.25, Math.min(8, speed));
  }

  // ==========================================================================
  // INTERNAL PLAYBACK LOOP
  // ==========================================================================

  private scheduleNextFrame(): void {
    if (!this.state.isPlaying || this.state.isPaused) return;

    const current = this.routeHistory[this.state.currentIndex];
    const next = this.routeHistory[this.state.currentIndex + 1];

    if (this.onRouteCallback && current) {
      this.onRouteCallback(current, this.state.currentIndex, this.routeHistory.length);
    }

    this.state.currentIndex++;

    if (this.state.currentIndex >= this.routeHistory.length) {
      // End of playback
      this.stop();
      return;
    }

    // Calculate delay to next frame
    let delay = 1000 / this.state.playbackSpeed;
    
    if (next && current) {
      // Use actual time delta if available
      const timeDelta = next.timestamp - current.timestamp;
      delay = Math.max(100, timeDelta / this.state.playbackSpeed);
    }

    this.playbackTimer = setTimeout(() => this.scheduleNextFrame(), delay);
  }

  // ==========================================================================
  // QUERY METHODS
  // ==========================================================================

  getRouteHistory(): RouteSnapshot[] {
    return [...this.routeHistory];
  }

  getTopologyHistory(): TopologySnapshot[] {
    return [...this.topologyHistory];
  }

  getRoutesInRange(start: number, end: number): RouteSnapshot[] {
    return this.routeHistory.filter(r => r.timestamp >= start && r.timestamp <= end);
  }

  getRoutesByPath(from: string, to: string): RouteSnapshot[] {
    return this.routeHistory.filter(r => r.route.from === from && r.route.to === to);
  }

  getState(): ReplayState {
    return { ...this.state };
  }

  getTimeRange(): TimeRange | null {
    if (this.routeHistory.length === 0) return null;
    return {
      start: this.routeHistory[0].timestamp,
      end: this.routeHistory[this.routeHistory.length - 1].timestamp,
    };
  }

  getCurrentSnapshot(): RouteSnapshot | null {
    return this.routeHistory[this.state.currentIndex] || null;
  }

  // ==========================================================================
  // TOPOLOGY COMPARISON
  // ==========================================================================

  compareTopologies(beforeId: string, afterId: string): TopologyDiff | null {
    const before = this.topologyHistory.find(t => t.id === beforeId);
    const after = this.topologyHistory.find(t => t.id === afterId);

    if (!before || !after) return null;

    return diffTopologies(before, after);
  }

  getTopologyAtTime(timestamp: number): TopologySnapshot | null {
    // Find the most recent topology snapshot before the given timestamp
    const snapshots = this.topologyHistory.filter(t => t.timestamp <= timestamp);
    return snapshots[snapshots.length - 1] || null;
  }

  // ==========================================================================
  // EXPORT / IMPORT
  // ==========================================================================

  exportHistory(): string {
    return JSON.stringify({
      routes: this.routeHistory,
      topologies: this.topologyHistory,
      exportedAt: Date.now(),
    }, null, 2);
  }

  importHistory(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      if (data.routes) {
        this.routeHistory = data.routes;
      }
      if (data.topologies) {
        this.topologyHistory = data.topologies;
      }

      console.log(`[TimeSeriesReplay] Imported ${this.routeHistory.length} routes, ${this.topologyHistory.length} topologies`);
      return true;
    } catch (e) {
      console.error('[TimeSeriesReplay] Failed to import history:', e);
      return false;
    }
  }

  clearHistory(): void {
    this.routeHistory = [];
    this.topologyHistory = [];
    this.stop();
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private pathToEdges(path: string[]): string[] {
    const edges: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      edges.push(`${path[i]}-${path[i + 1]}`);
    }
    return edges;
  }
}

// =============================================================================
// TOPOLOGY DIFF
// =============================================================================

export interface TopologyDiff {
  addedLedgers: SerializedLedger[];
  removedLedgers: SerializedLedger[];
  modifiedLedgers: Array<{ before: SerializedLedger; after: SerializedLedger; changes: string[] }>;
  addedCorridors: SerializedCorridor[];
  removedCorridors: SerializedCorridor[];
  modifiedCorridors: Array<{ before: SerializedCorridor; after: SerializedCorridor; changes: string[] }>;
  summary: string;
}

function diffTopologies(before: TopologySnapshot, after: TopologySnapshot): TopologyDiff {
  const beforeLedgerIds = new Set(before.ledgers.map(l => l.id));
  const afterLedgerIds = new Set(after.ledgers.map(l => l.id));
  
  const beforeCorridorIds = new Set(before.corridors.map(c => c.id));
  const afterCorridorIds = new Set(after.corridors.map(c => c.id));

  // Added/removed ledgers
  const addedLedgers = after.ledgers.filter(l => !beforeLedgerIds.has(l.id));
  const removedLedgers = before.ledgers.filter(l => !afterLedgerIds.has(l.id));

  // Modified ledgers
  const modifiedLedgers: TopologyDiff['modifiedLedgers'] = [];
  for (const afterLedger of after.ledgers) {
    const beforeLedger = before.ledgers.find(l => l.id === afterLedger.id);
    if (beforeLedger) {
      const changes: string[] = [];
      if (beforeLedger.trustScore !== afterLedger.trustScore) {
        changes.push(`trust: ${beforeLedger.trustScore.toFixed(2)} → ${afterLedger.trustScore.toFixed(2)}`);
      }
      if (JSON.stringify(beforeLedger.riskFlags) !== JSON.stringify(afterLedger.riskFlags)) {
        changes.push(`riskFlags changed`);
      }
      if (changes.length > 0) {
        modifiedLedgers.push({ before: beforeLedger, after: afterLedger, changes });
      }
    }
  }

  // Added/removed corridors
  const addedCorridors = after.corridors.filter(c => !beforeCorridorIds.has(c.id));
  const removedCorridors = before.corridors.filter(c => !afterCorridorIds.has(c.id));

  // Modified corridors
  const modifiedCorridors: TopologyDiff['modifiedCorridors'] = [];
  for (const afterCorridor of after.corridors) {
    const beforeCorridor = before.corridors.find(c => c.id === afterCorridor.id);
    if (beforeCorridor) {
      const changes: string[] = [];
      if (beforeCorridor.confidence !== afterCorridor.confidence) {
        changes.push(`confidence: ${beforeCorridor.confidence.toFixed(2)} → ${afterCorridor.confidence.toFixed(2)}`);
      }
      if (beforeCorridor.status !== afterCorridor.status) {
        changes.push(`status: ${beforeCorridor.status} → ${afterCorridor.status}`);
      }
      if (changes.length > 0) {
        modifiedCorridors.push({ before: beforeCorridor, after: afterCorridor, changes });
      }
    }
  }

  const parts: string[] = [];
  if (addedLedgers.length) parts.push(`+${addedLedgers.length} ledgers`);
  if (removedLedgers.length) parts.push(`-${removedLedgers.length} ledgers`);
  if (addedCorridors.length) parts.push(`+${addedCorridors.length} corridors`);
  if (removedCorridors.length) parts.push(`-${removedCorridors.length} corridors`);
  if (modifiedLedgers.length) parts.push(`~${modifiedLedgers.length} ledger changes`);
  if (modifiedCorridors.length) parts.push(`~${modifiedCorridors.length} corridor changes`);

  return {
    addedLedgers,
    removedLedgers,
    modifiedLedgers,
    addedCorridors,
    removedCorridors,
    modifiedCorridors,
    summary: parts.length > 0 ? parts.join(', ') : 'No changes',
  };
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let replayEngine: TimeSeriesReplayEngine | null = null;

export function getReplayEngine(): TimeSeriesReplayEngine {
  if (!replayEngine) {
    replayEngine = new TimeSeriesReplayEngine();
  }
  return replayEngine;
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useTimeSeriesReplay() {
  const engine = getReplayEngine();
  const [state, setState] = useState<ReplayState>(engine.getState());
  const [currentSnapshot, setCurrentSnapshot] = useState<RouteSnapshot | null>(null);

  useEffect(() => {
    // Poll state while playing
    if (!state.isPlaying) return;

    const interval = setInterval(() => {
      setState(engine.getState());
      setCurrentSnapshot(engine.getCurrentSnapshot());
    }, 100);

    return () => clearInterval(interval);
  }, [state.isPlaying, engine]);

  const play = useCallback((onSnapshot?: ReplayCallback) => {
    engine.play((snapshot, index, total) => {
      setCurrentSnapshot(snapshot);
      setState(engine.getState());
      onSnapshot?.(snapshot, index, total);
    });
    setState(engine.getState());
  }, [engine]);

  const pause = useCallback(() => {
    engine.pause();
    setState(engine.getState());
  }, [engine]);

  const stop = useCallback(() => {
    engine.stop();
    setState(engine.getState());
    setCurrentSnapshot(null);
  }, [engine]);

  const seekTo = useCallback((index: number) => {
    engine.seekTo(index);
    setState(engine.getState());
    setCurrentSnapshot(engine.getCurrentSnapshot());
  }, [engine]);

  const setSpeed = useCallback((speed: number) => {
    engine.setPlaybackSpeed(speed);
    setState(engine.getState());
  }, [engine]);

  return {
    engine,
    state,
    currentSnapshot,
    play,
    pause,
    stop,
    seekTo,
    setSpeed,
    recordRoute: engine.recordRoute.bind(engine),
    recordTopology: engine.recordTopologySnapshot.bind(engine),
    getHistory: engine.getRouteHistory.bind(engine),
    getTimeRange: engine.getTimeRange.bind(engine),
    exportHistory: engine.exportHistory.bind(engine),
    importHistory: engine.importHistory.bind(engine),
  };
}

export default TimeSeriesReplayEngine;
