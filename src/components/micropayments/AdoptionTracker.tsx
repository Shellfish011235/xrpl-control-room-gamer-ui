// Adoption Tracker & Marketing Toolkit
// Show who's actually using XRPL/ILP micropayments + tools to grow adoption
// "Adoption is the only metric that matters"

import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, ExternalLink, Copy, Check, Download,
  Zap, Globe, Code, MessageSquare, Target, Award, ChevronDown,
  ChevronUp, Play, BookOpen, Rocket
} from 'lucide-react';
import {
  ADOPTION_PROJECTS,
  MARKETING_POINTS,
  DEVELOPER_QUICKSTART,
  generatePitchData,
  useLiveXRPLData,
  type AdoptionProject,
} from '../../services/micropayments/liveXRPLData';

// =============================================================================
// TYPES
// =============================================================================

interface AdoptionTrackerProps {
  showMarketing?: boolean;
  showDevTools?: boolean;
}

// =============================================================================
// ADOPTION TRACKER
// =============================================================================

export function AdoptionTracker({
  showMarketing = true,
  showDevTools = true,
}: AdoptionTrackerProps) {
  const [activeTab, setActiveTab] = useState<'adoption' | 'marketing' | 'developer'>('adoption');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { stats, fetchStats, isLoading } = useLiveXRPLData();

  // Fetch live stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Copy code helper
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter projects
  const filteredProjects = filterCategory === 'all' 
    ? ADOPTION_PROJECTS 
    : ADOPTION_PROJECTS.filter(p => p.category === filterCategory);

  const categories = ['all', ...new Set(ADOPTION_PROJECTS.map(p => p.category))];

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-cyber-green" />
            <span className="font-cyber text-cyber-green text-lg">ADOPTION & MARKETING</span>
          </div>
          {stats && (
            <div className="text-right">
              <p className="text-[10px] text-cyber-muted">XRPL Ledger</p>
              <p className="text-sm text-cyber-cyan font-mono">#{stats.currentLedger.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('adoption')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
              activeTab === 'adoption'
                ? 'bg-cyber-green text-cyber-darker'
                : 'bg-cyber-border text-cyber-muted hover:text-cyber-text'
            }`}
          >
            <Users size={14} />
            Who's Using It
          </button>
          {showMarketing && (
            <button
              onClick={() => setActiveTab('marketing')}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                activeTab === 'marketing'
                  ? 'bg-cyber-purple text-white'
                  : 'bg-cyber-border text-cyber-muted hover:text-cyber-text'
              }`}
            >
              <MessageSquare size={14} />
              Marketing Tools
            </button>
          )}
          {showDevTools && (
            <button
              onClick={() => setActiveTab('developer')}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                activeTab === 'developer'
                  ? 'bg-cyber-cyan text-cyber-darker'
                  : 'bg-cyber-border text-cyber-muted hover:text-cyber-text'
              }`}
            >
              <Code size={14} />
              Dev Quick Start
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* ADOPTION TAB */}
        {activeTab === 'adoption' && (
          <div>
            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30 text-center">
                <p className="text-2xl font-cyber text-cyber-green">
                  {ADOPTION_PROJECTS.filter(p => p.status === 'live').length}
                </p>
                <p className="text-[9px] text-cyber-muted">LIVE PROJECTS</p>
              </div>
              <div className="p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-center">
                <p className="text-2xl font-cyber text-cyber-cyan">
                  {new Set(ADOPTION_PROJECTS.map(p => p.category)).size}
                </p>
                <p className="text-[9px] text-cyber-muted">CATEGORIES</p>
              </div>
              <div className="p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30 text-center">
                <p className="text-2xl font-cyber text-cyber-purple">W3C</p>
                <p className="text-[9px] text-cyber-muted">WEB MONETIZATION</p>
              </div>
              <div className="p-3 rounded bg-cyber-yellow/10 border border-cyber-yellow/30 text-center">
                <p className="text-2xl font-cyber text-cyber-yellow">$B+</p>
                <p className="text-[9px] text-cyber-muted">ODL VOLUME</p>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded text-xs capitalize whitespace-nowrap transition-colors ${
                    filterCategory === cat
                      ? 'bg-cyber-cyan text-cyber-darker'
                      : 'bg-cyber-border text-cyber-muted hover:text-cyber-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Project List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredProjects.map(project => (
                <div
                  key={project.name}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    expandedProject === project.name
                      ? 'bg-cyber-cyan/10 border-cyber-cyan'
                      : 'bg-cyber-border/20 border-cyber-border hover:border-cyber-cyan/50'
                  }`}
                  onClick={() => setExpandedProject(
                    expandedProject === project.name ? null : project.name
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        project.status === 'live' ? 'bg-cyber-green' :
                        project.status === 'beta' ? 'bg-cyber-yellow' :
                        'bg-cyber-muted'
                      }`} />
                      <div>
                        <p className="text-sm text-cyber-text font-medium">{project.name}</p>
                        <p className="text-[10px] text-cyber-muted capitalize">{project.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] ${
                        project.status === 'live' ? 'bg-cyber-green/20 text-cyber-green' :
                        project.status === 'beta' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                        'bg-cyber-border text-cyber-muted'
                      }`}>
                        {project.status.toUpperCase()}
                      </span>
                      {expandedProject === project.name ? (
                        <ChevronUp size={14} className="text-cyber-muted" />
                      ) : (
                        <ChevronDown size={14} className="text-cyber-muted" />
                      )}
                    </div>
                  </div>

                  {expandedProject === project.name && (
                    <div className="mt-3 pt-3 border-t border-cyber-border/50">
                      <p className="text-xs text-cyber-text mb-2">{project.description}</p>
                      <p className="text-[10px] text-cyber-muted mb-2">
                        <strong>Use Case:</strong> {project.useCase}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.micropaymentFeatures.map(f => (
                          <span key={f} className="px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple text-[9px]">
                            {f}
                          </span>
                        ))}
                      </div>
                      {project.website && (
                        <a
                          href={project.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-cyber-cyan hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit Website <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MARKETING TAB */}
        {activeTab === 'marketing' && (
          <div className="space-y-4">
            {/* Headlines */}
            <div>
              <p className="text-xs text-cyber-purple font-cyber mb-2">HEADLINES (Click to Copy)</p>
              <div className="space-y-2">
                {MARKETING_POINTS.headlines.map((headline, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-cyber-border/30 cursor-pointer hover:bg-cyber-purple/20 transition-colors group"
                    onClick={() => copyCode(headline, `headline-${i}`)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-cyber-text">{headline}</p>
                      {copiedCode === `headline-${i}` ? (
                        <Check size={14} className="text-cyber-green" />
                      ) : (
                        <Copy size={14} className="text-cyber-muted group-hover:text-cyber-purple" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparisons */}
            <div>
              <p className="text-xs text-cyber-cyan font-cyber mb-2">COMPARISON SOUND BITES</p>
              <div className="space-y-2">
                {MARKETING_POINTS.comparisons.map((comp, i) => (
                  <div key={i} className="p-3 rounded bg-cyber-border/30">
                    <p className="text-xs text-cyber-muted mb-1">{comp.scenario}</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="p-2 rounded bg-cyber-green/10">
                        <p className="text-[9px] text-cyber-muted">XRPL</p>
                        <p className="text-xs text-cyber-green">{comp.xrpl}</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-red/10">
                        <p className="text-[9px] text-cyber-muted">Ethereum</p>
                        <p className="text-xs text-cyber-red">{comp.ethereum}</p>
                      </div>
                    </div>
                    <p className="text-xs text-cyber-yellow font-bold">{comp.winner}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Objection Handlers */}
            <div>
              <p className="text-xs text-cyber-yellow font-cyber mb-2">OBJECTION HANDLERS</p>
              <div className="space-y-2">
                {MARKETING_POINTS.objectionHandlers.map((obj, i) => (
                  <div key={i} className="p-3 rounded bg-cyber-border/30">
                    <p className="text-xs text-cyber-red mb-1">"{obj.objection}"</p>
                    <p className="text-xs text-cyber-text">{obj.response}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Pitch Deck Data */}
            <button
              onClick={() => {
                const pitchData = generatePitchData();
                const blob = new Blob([JSON.stringify(pitchData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'xrpl-micropayment-pitch.json';
                a.click();
              }}
              className="w-full py-2 rounded bg-cyber-purple text-white text-sm hover:bg-cyber-purple/80 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={14} />
              Export Pitch Deck Data
            </button>
          </div>
        )}

        {/* DEVELOPER TAB */}
        {activeTab === 'developer' && (
          <div className="space-y-4">
            <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30">
              <div className="flex items-center gap-2 mb-2">
                <Rocket size={16} className="text-cyber-green" />
                <p className="text-sm text-cyber-green font-cyber">START BUILDING IN 5 MINUTES</p>
              </div>
              <p className="text-xs text-cyber-text">
                Copy-paste code to add XRPL micropayments to your app. 
                No blockchain expertise required.
              </p>
            </div>

            {Object.entries(DEVELOPER_QUICKSTART).map(([key, snippet]) => (
              <div key={key} className="rounded border border-cyber-border overflow-hidden">
                <div className="p-2 bg-cyber-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code size={12} className="text-cyber-cyan" />
                    <span className="text-xs text-cyber-text">{snippet.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-cyber-muted">{snippet.language}</span>
                    <button
                      onClick={() => copyCode(snippet.code, key)}
                      className="p-1 rounded hover:bg-cyber-cyan/20 transition-colors"
                    >
                      {copiedCode === key ? (
                        <Check size={12} className="text-cyber-green" />
                      ) : (
                        <Copy size={12} className="text-cyber-muted hover:text-cyber-cyan" />
                      )}
                    </button>
                  </div>
                </div>
                <pre className="p-3 bg-cyber-darker text-[10px] text-cyber-text overflow-x-auto">
                  <code>{snippet.code}</code>
                </pre>
              </div>
            ))}

            {/* Resources */}
            <div>
              <p className="text-xs text-cyber-muted mb-2">RESOURCES</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'XRPL Docs', url: 'https://xrpl.org/docs' },
                  { name: 'Interledger', url: 'https://interledger.org' },
                  { name: 'Web Monetization', url: 'https://webmonetization.org' },
                  { name: 'Rafiki (ILP)', url: 'https://github.com/interledger/rafiki' },
                ].map(res => (
                  <a
                    key={res.name}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded bg-cyber-border/30 text-xs text-cyber-cyan hover:bg-cyber-cyan/20 transition-colors flex items-center justify-between"
                  >
                    {res.name}
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyber-border text-center">
        <p className="text-[8px] text-cyber-muted italic">
          "Adoption is the only metric that matters."
        </p>
      </div>
    </div>
  );
}

export default AdoptionTracker;
