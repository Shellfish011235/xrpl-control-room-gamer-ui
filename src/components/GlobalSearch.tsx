/**
 * Global command / search router — navigates to read-only routes only (no signing or custody).
 *
 * Uses `src/search/searchIntentRegistry.ts` for synonyms, NL phrases, and /commands.
 * Extend behavior via `registerSearchIntents()` from app or feature modules.
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Terminal, Sparkles } from 'lucide-react'
import {
  rankSearchIntents,
  normalizeSearchQuery,
  SUGGESTED_SEARCH_CHIPS,
  getPopularShortcuts,
  categoryLabel,
  type RankedSearchResult,
  type SearchIntentCategory,
} from '../search/searchIntentRegistry'

const MAX_RESULTS = 12

function categoryTone(cat: SearchIntentCategory): string {
  switch (cat) {
    case 'wallet':
      return 'border-cyber-cyan/40 text-cyber-cyan bg-cyber-cyan/10'
    case 'dex':
    case 'liquidity':
      return 'border-cyber-purple/40 text-cyber-purple bg-cyber-purple/10'
    case 'ilp':
      return 'border-cyber-glow/40 text-cyber-glow bg-cyber-glow/10'
    case 'agents':
      return 'border-cyber-magenta/40 text-cyber-magenta bg-cyber-magenta/10'
    case 'security':
      return 'border-cyber-red/40 text-cyber-red bg-cyber-red/10'
    case 'compliance':
      return 'border-cyber-orange/40 text-cyber-orange bg-cyber-orange/10'
    case 'learn':
    case 'infra':
      return 'border-cyber-yellow/40 text-cyber-yellow bg-cyber-yellow/10'
    case 'payments':
    case 'nft':
      return 'border-cyber-green/40 text-cyber-green bg-cyber-green/10'
    case 'ledger':
      return 'border-cyber-blue/40 text-cyber-blue bg-cyber-blue/10'
    default:
      return 'border-cyber-border text-cyber-muted bg-cyber-darker/80'
  }
}

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const normalizedPreview = useMemo(() => normalizeSearchQuery(query), [query])

  const ranked = useMemo(() => {
    if (!query.trim()) return []
    return rankSearchIntents(query, MAX_RESULTS)
  }, [query])

  const popular = useMemo(() => getPopularShortcuts(), [])

  const results: RankedSearchResult[] = query.trim() ? ranked : popular

  const select = (path: string) => {
    navigate(path)
    setQuery('')
    setOpen(false)
    setHighlight(0)
    inputRef.current?.blur()
  }

  useEffect(() => {
    if (!open) return
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!open && e.key !== 'Escape') return
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight((h) => (h < results.length - 1 ? h + 1 : 0))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((h) => (h > 0 ? h - 1 : results.length - 1))
        return
      }
      if (e.key === 'Enter' && results[highlight]) {
        e.preventDefault()
        select(results[highlight].path)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, results, highlight])

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-md lg:max-w-xl">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-cyber-muted pointer-events-none" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="global-search-list"
          aria-activedescendant={open && results[highlight] ? `search-option-${highlight}` : undefined}
          placeholder="Search, ask, or /command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-cyber-darker/80 border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm font-cyber focus:outline-none focus:border-cyber-glow/50 focus:ring-1 focus:ring-cyber-glow/30"
        />
      </div>

      {open && (
        <div
          id="global-search-list"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 max-h-[min(24rem,70vh)] overflow-y-auto rounded-lg border border-cyber-border bg-cyber-darker z-[60]"
        >
          {!query.trim() && (
            <div className="px-3 py-2 border-b border-cyber-border/60 bg-cyber-darker/90">
              <div className="flex items-center gap-2 text-[10px] font-cyber text-cyber-muted uppercase tracking-wider mb-2">
                <Sparkles size={12} className="text-cyber-glow" aria-hidden />
                Suggested
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SEARCH_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="px-2 py-1 rounded text-[10px] font-cyber border border-cyber-border/80 text-cyber-cyan hover:bg-cyber-glow/10 hover:border-cyber-glow/40 transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(chip)
                      setHighlight(0)
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && normalizedPreview !== query.trim().toLowerCase() && (
            <div className="px-3 py-1.5 text-[9px] text-cyber-muted border-b border-cyber-border/40 font-mono truncate">
              Normalized: {normalizedPreview || '—'}
            </div>
          )}

          {results.length === 0 ? (
            <div className="px-3 py-6 text-sm text-cyber-muted text-center">
              <Terminal size={18} className="mx-auto mb-2 opacity-50" aria-hidden />
              No matching intents — try a /command or a shorter phrase.
            </div>
          ) : (
            <ul className="py-1">
              {!query.trim() && (
                <li className="px-3 py-1.5 text-[9px] text-cyber-muted font-cyber uppercase tracking-wider">
                  Quick links
                </li>
              )}
              {results.map((r, i) => (
                <li
                  key={`${r.id}-${i}`}
                  id={`search-option-${i}`}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(r.path)}
                  className={`px-3 py-2.5 cursor-pointer transition-colors border-l-2 ${
                    i === highlight
                      ? 'bg-cyber-glow/15 border-l-cyber-glow text-cyber-text'
                      : 'border-l-transparent hover:bg-cyber-border/15 text-cyber-text'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-cyber tracking-wide text-sm text-cyber-glow">{r.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-cyber ${categoryTone(r.category)}`}
                        >
                          {categoryLabel(r.category)}
                        </span>
                      </div>
                      <p className="text-[11px] text-cyber-muted mt-0.5 line-clamp-2">{r.description}</p>
                      <p className="text-[10px] text-cyber-cyan/80 font-mono mt-1 truncate">{r.path}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-cyber text-cyber-muted block">match</span>
                      <span className="text-xs font-mono text-cyber-green">
                        {Math.round((query.trim() ? r.confidence : 1) * 100)}%
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="px-3 py-2 border-t border-cyber-border/50 text-[9px] text-cyber-muted font-cyber">
            Read-only router — navigation only. No signing or key handling from search.
          </div>
        </div>
      )}
    </div>
  )
}
