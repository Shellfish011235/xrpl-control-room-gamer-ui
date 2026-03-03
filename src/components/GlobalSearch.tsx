/**
 * Global search bar for dashboard navigation. Rendered in the top nav on all pages.
 * Type to filter routes; select to navigate.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

export interface SearchRoute {
  path: string
  label: string
  keywords?: string
}

const SEARCH_ROUTES: SearchRoute[] = [
  { path: '/', label: 'Profile', keywords: 'home you portfolio character account nft collectibles avatar' },
  { path: '/pay', label: 'Pay', keywords: 'pay send receive stream micropayments agent economy carv payment xrp transfer open claw openclaw' },
  { path: '/tools/control-room', label: 'Control Room', keywords: 'control room dashboard hub ops wallet send receive' },
  { path: '/tools', label: 'Tools', keywords: 'tools nft nfts nftoken mint ledger impact dex bridges agents builder' },
  { path: '/tools/ledger-impact', label: 'Ledger Impact', keywords: 'amendments impact governance voting rippled xls protocol upgrade' },
  { path: '/tools/optimizer', label: 'Optimizer', keywords: 'optimizer swap optimize trade best route' },
  { path: '/tools/bridges', label: 'Bridges', keywords: 'bridge bridges cross-chain evm sidechain layer' },
  { path: '/tools/agents', label: 'Agents', keywords: 'agents bots automation strategies open claw openclaw' },
  { path: '/tools/builder', label: 'Builder', keywords: 'builder ai code develop cursor open claw openclaw' },
  { path: '/tools/wallet', label: 'Wallet', keywords: 'wallet mvp hold balance xrp' },
  { path: '/tools/dex-order', label: 'DEX Order', keywords: 'dex order book trade amm swap liquidity' },
  { path: '/network', label: 'Network', keywords: 'network globe map radar innovation community validators topology xrpl ilp interledger protocol corridor corridors connectors rafiki' },
  { path: '/terminal', label: 'Terminal', keywords: 'terminal trading activity etf chart grid dca market' },
  { path: '/learn', label: 'Learn', keywords: 'learn docs help etf spot education tutorial ilp interledger open claw streams' },
  { path: '/underworld', label: 'Regulations', keywords: 'regulations risk compliance underworld etf sec legal jurisdiction' },
  { path: '/memetic-lab', label: 'Trending', keywords: 'trending memetic lab etf xrp price sentiment polymarket' },
  { path: '/governance-guide', label: 'Governance Guide', keywords: 'governance guide amendments xls voting' },
]

function matchQuery(route: SearchRoute, q: string): boolean {
  if (!q.trim()) return true
  const lower = q.toLowerCase().trim()
  const labelMatch = route.label.toLowerCase().includes(lower)
  const pathMatch = route.path.toLowerCase().includes(lower)
  const keywordMatch = route.keywords?.toLowerCase().includes(lower)
  return labelMatch || pathMatch || !!keywordMatch
}

const MAX_RESULTS = 10

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = query.trim()
    ? SEARCH_ROUTES.filter((r) => matchQuery(r, query)).slice(0, MAX_RESULTS)
    : SEARCH_ROUTES.slice(0, MAX_RESULTS)

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
  }, [open, results, highlight, navigate])

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
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 w-4 h-4 text-cyber-muted pointer-events-none"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="global-search-list"
          aria-activedescendant={open && results[highlight] ? `search-option-${highlight}` : undefined}
          placeholder="Search dashboard…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // keep open briefly so click on item registers
            setTimeout(() => setOpen(false), 150)
          }}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-cyber-darker/80 border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-sm font-cyber focus:outline-none focus:border-cyber-glow/50 focus:ring-1 focus:ring-cyber-glow/30"
        />
      </div>

      {open && (
        <ul
          id="global-search-list"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-lg border border-cyber-border bg-cyber-darker shadow-xl z-[60]"
        >
          {results.length === 0 ? (
            <li className="px-3 py-4 text-sm text-cyber-muted text-center">No matches</li>
          ) : (
            results.map((r, i) => (
              <li
                key={r.path}
                id={`search-option-${i}`}
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(r.path)}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  i === highlight
                    ? 'bg-cyber-glow/15 text-cyber-glow'
                    : 'text-cyber-text hover:bg-cyber-border/20'
                }`}
              >
                <span className="font-cyber tracking-wide">{r.label}</span>
                <span className="ml-2 text-cyber-muted text-xs">{r.path}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
