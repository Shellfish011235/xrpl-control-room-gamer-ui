import { useEffect, useMemo, useRef } from 'react'
import cytoscape, { type Core } from 'cytoscape'
import type { TopologyDataset, TopologyNode } from '../../types/networkTopology'

interface TopologyCanvasProps {
  dataset: TopologyDataset
  selectedId: string | null
  onSelect: (node: TopologyNode | null) => void
}

export function TopologyCanvas({ dataset, selectedId, onSelect }: TopologyCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const cyRef = useRef<Core | null>(null)

  const nodeById = useMemo(() => new Map(dataset.nodes.map((node) => [node.id, node])), [dataset.nodes])

  useEffect(() => {
    if (!hostRef.current) return

    const cy = cytoscape({
      container: hostRef.current,
      elements: [
        ...dataset.nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.label,
            kind: node.kind,
            evidence: node.evidence,
            unl: node.trust?.unl ? 'yes' : 'no',
          },
        })),
        ...dataset.edges.map((edge) => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            evidence: edge.evidence,
          },
        })),
      ],
      layout: {
        name: 'concentric',
        fit: true,
        padding: 42,
        minNodeSpacing: 18,
        concentric: (node) => node.data('kind') === 'validator' ? 2 : 1,
        levelWidth: () => 1,
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1f6feb',
            'border-color': '#5edcff',
            'border-width': 2,
            'label': 'data(label)',
            'color': '#dbeafe',
            'font-size': 9,
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'text-wrap': 'ellipsis',
            'text-max-width': '90px',
            'width': '18px',
            'height': '18px',
          },
        },
        {
          selector: 'node[kind = "validator"]',
          style: {
            'background-color': '#00b8ff',
            'border-color': '#8cecff',
            'width': '26px',
            'height': '26px',
          },
        },
        {
          selector: 'node[unl = "yes"]',
          style: {
            'border-color': '#38f2a0',
            'border-width': 3,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.4,
            'line-color': '#3797ff',
            'target-arrow-color': '#3797ff',
            'curve-style': 'bezier',
            'opacity': 0.5,
          },
        },
        {
          selector: ':selected',
          style: {
            'border-color': '#ffffff',
            'border-width': 4,
          },
        },
      ],
      userPanningEnabled: false,
      userZoomingEnabled: false,
      boxSelectionEnabled: false,
      autoungrabify: true,
      minZoom: 0.5,
      maxZoom: 2,
    })

    cy.on('tap', 'node', (event) => {
      const item = nodeById.get(event.target.id())
      if (item) onSelect(item)
    })
    cy.on('tap', (event) => {
      if (event.target === cy) onSelect(null)
    })

    cyRef.current = cy
    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [dataset, nodeById, onSelect])

  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.elements().unselect()
    if (!selectedId) {
      cy.animate({ fit: { eles: cy.elements(), padding: 42 }, duration: 250 })
      return
    }
    const node = cy.getElementById(selectedId)
    if (node.nonempty()) {
      node.select()
      cy.animate({ fit: { eles: node, padding: 130 }, duration: 250 })
    }
  }, [selectedId])

  return (
    <div className="relative min-h-[520px] h-[62vh] max-h-[760px] overflow-hidden rounded-2xl border border-cyber-border/60 bg-[#050810]">
      <div ref={hostRef} className="absolute inset-0" aria-label="XRPL validator topology graph" />
      {dataset.edges.length === 0 && (
        <div className="pointer-events-none absolute left-4 bottom-4 max-w-md rounded-xl border border-cyber-yellow/30 bg-cyber-darker/90 px-3 py-2 text-[11px] text-cyber-muted backdrop-blur">
          Peer-to-validator links are not proven by the current public snapshot, so no connection lines are invented here.
        </div>
      )}
    </div>
  )
}
