// Time-Series Replay Controls Component
// Provides playback UI for route history visualization

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  FastForward, Rewind, Download, Upload, Clock, 
  Activity, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTimeSeriesReplay, type RouteSnapshot } from '../../services/ilp/timeSeriesReplay';

// =============================================================================
// TYPES
// =============================================================================

interface ReplayControlsProps {
  onSnapshotChange?: (snapshot: RouteSnapshot | null) => void;
  onHighlightPath?: (path: string[]) => void;
  compact?: boolean;
}

// =============================================================================
// REPLAY CONTROLS COMPONENT
// =============================================================================

export function ReplayControls({ 
  onSnapshotChange, 
  onHighlightPath,
  compact = false 
}: ReplayControlsProps) {
  const {
    state,
    currentSnapshot,
    play,
    pause,
    stop,
    seekTo,
    setSpeed,
    getHistory,
    getTimeRange,
    exportHistory,
    importHistory,
  } = useTimeSeriesReplay();

  const [showTimeline, setShowTimeline] = useState(!compact);
  const history = useMemo(() => getHistory(), [getHistory]);
  const timeRange = useMemo(() => getTimeRange(), [getTimeRange]);

  // Notify parent of snapshot changes
  useEffect(() => {
    onSnapshotChange?.(currentSnapshot);
    if (currentSnapshot) {
      onHighlightPath?.(currentSnapshot.route.path);
    }
  }, [currentSnapshot, onSnapshotChange, onHighlightPath]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handlePlay = () => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
    onHighlightPath?.([]);
  };

  const handleSeek = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, state.currentIndex - 1)
      : Math.min(history.length - 1, state.currentIndex + 1);
    seekTo(newIndex);
  };

  const handleSpeedChange = (delta: number) => {
    const speeds = [0.25, 0.5, 1, 2, 4, 8];
    const currentIdx = speeds.indexOf(state.playbackSpeed);
    const newIdx = Math.max(0, Math.min(speeds.length - 1, currentIdx + delta));
    setSpeed(speeds[newIdx]);
  };

  const handleExport = () => {
    const data = exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ilp-routes-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          importHistory(reader.result);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (history.length === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const index = Math.floor(percent * history.length);
    seekTo(index);
  };

  // ==========================================================================
  // FORMAT HELPERS
  // ==========================================================================

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // ==========================================================================
  // RENDER: COMPACT MODE
  // ==========================================================================

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-cyber-darker rounded border border-cyber-border">
        <button
          onClick={handlePlay}
          className="p-1.5 rounded bg-cyber-border hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan transition-colors"
          title={state.isPlaying ? 'Pause' : 'Play'}
        >
          {state.isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        
        <div className="text-[10px] text-cyber-muted font-mono">
          {state.currentIndex + 1}/{history.length}
        </div>

        <div className="flex-1 h-1 bg-cyber-border rounded overflow-hidden cursor-pointer" onClick={handleTimelineClick}>
          <div 
            className="h-full bg-cyber-cyan transition-all"
            style={{ width: history.length > 0 ? `${((state.currentIndex + 1) / history.length) * 100}%` : '0%' }}
          />
        </div>

        <span className="text-[9px] text-cyber-muted">{state.playbackSpeed}x</span>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: FULL MODE
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-cyber-cyan" />
          <span className="font-cyber text-cyber-cyan text-xs">ROUTE REPLAY</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            className="p-1 rounded hover:bg-cyber-border text-cyber-muted hover:text-cyber-text transition-colors"
            title="Export History"
          >
            <Download size={12} />
          </button>
          <button
            onClick={handleImport}
            className="p-1 rounded hover:bg-cyber-border text-cyber-muted hover:text-cyber-text transition-colors"
            title="Import History"
          >
            <Upload size={12} />
          </button>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="p-3">
        <div className="flex items-center justify-center gap-2 mb-3">
          {/* Speed Down */}
          <button
            onClick={() => handleSpeedChange(-1)}
            className="p-1.5 rounded bg-cyber-border hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan transition-colors"
            title="Slower"
          >
            <Rewind size={14} />
          </button>

          {/* Previous */}
          <button
            onClick={() => handleSeek('prev')}
            disabled={state.currentIndex === 0}
            className="p-1.5 rounded bg-cyber-border hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan transition-colors disabled:opacity-30"
            title="Previous"
          >
            <SkipBack size={14} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlay}
            className={`p-2 rounded transition-colors ${
              state.isPlaying 
                ? 'bg-cyber-cyan text-cyber-darker' 
                : 'bg-cyber-border hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan'
            }`}
            title={state.isPlaying ? 'Pause' : 'Play'}
          >
            {state.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="p-1.5 rounded bg-cyber-border hover:bg-cyber-red/20 text-cyber-muted hover:text-cyber-red transition-colors"
            title="Stop"
          >
            <Square size={14} />
          </button>

          {/* Next */}
          <button
            onClick={() => handleSeek('next')}
            disabled={state.currentIndex >= history.length - 1}
            className="p-1.5 rounded bg-cyber-border hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan transition-colors disabled:opacity-30"
            title="Next"
          >
            <SkipForward size={14} />
          </button>

          {/* Speed Up */}
          <button
            onClick={() => handleSpeedChange(1)}
            className="p-1.5 rounded bg-cyber-border hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan transition-colors"
            title="Faster"
          >
            <FastForward size={14} />
          </button>
        </div>

        {/* Speed Indicator */}
        <div className="text-center mb-3">
          <span className="text-xs text-cyber-muted">Speed: </span>
          <span className="text-xs text-cyber-cyan font-mono">{state.playbackSpeed}x</span>
        </div>

        {/* Timeline */}
        {showTimeline && (
          <div className="mb-3">
            <div 
              className="h-2 bg-cyber-border rounded overflow-hidden cursor-pointer relative"
              onClick={handleTimelineClick}
            >
              {/* Progress bar */}
              <div 
                className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all"
                style={{ width: history.length > 0 ? `${((state.currentIndex + 1) / history.length) * 100}%` : '0%' }}
              />
              
              {/* Tick marks for each route */}
              {history.length <= 50 && history.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-cyber-border/50"
                  style={{ left: `${(i / history.length) * 100}%` }}
                />
              ))}
            </div>

            {/* Time labels */}
            {timeRange && (
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-cyber-muted">{formatTime(timeRange.start)}</span>
                <span className="text-[9px] text-cyber-muted">{formatTime(timeRange.end)}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Info */}
        <div className="text-center text-[10px] text-cyber-muted">
          Route {state.currentIndex + 1} of {history.length}
          {timeRange && (
            <span className="ml-2">
              ({formatDuration(timeRange.end - timeRange.start)} total)
            </span>
          )}
        </div>
      </div>

      {/* Current Snapshot Info */}
      {currentSnapshot && (
        <div className="p-2 border-t border-cyber-border bg-cyber-darker/50">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={12} className="text-cyber-green" />
            <span className="text-[10px] text-cyber-text font-mono">
              {currentSnapshot.route.from} → {currentSnapshot.route.to}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-cyber-muted">
            <span>{currentSnapshot.route.path.length} hops</span>
            <span>•</span>
            <span className={currentSnapshot.route.carValidated ? 'text-cyber-green' : 'text-cyber-yellow'}>
              {currentSnapshot.route.carValidated ? 'CAR Validated' : 'Unvalidated'}
            </span>
            <span>•</span>
            <span>{(currentSnapshot.route.confidence * 100).toFixed(0)}% confidence</span>
          </div>
          {currentSnapshot.metadata?.note && (
            <p className="text-[9px] text-cyber-muted mt-1 italic">
              "{currentSnapshot.metadata.note}"
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 && (
        <div className="p-4 text-center">
          <Clock size={24} className="text-cyber-muted mx-auto mb-2 opacity-50" />
          <p className="text-xs text-cyber-muted">No routes recorded yet</p>
          <p className="text-[9px] text-cyber-muted mt-1">
            Routes are recorded as you calculate paths
          </p>
        </div>
      )}
    </div>
  );
}

export default ReplayControls;
