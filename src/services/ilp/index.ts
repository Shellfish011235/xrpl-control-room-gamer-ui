// ILP Multi-Ledger Connector Map Engine
// Main Service Index

export * from './types';
export * from './topology';

import { useState, useEffect, useCallback } from 'react';
import { TopologyService, getTopology } from './topology';
import type { 
  TopologyState,
  UILens,
  Ledger,
  Connector,
  Corridor,
  Route,
  ILPEvent,
  OODAPhase,
} from './types';

// ==================== REACT HOOKS ====================

export function useILPTopology(): {
  topology: TopologyService;
  state: TopologyState;
  ledgers: Ledger[];
  connectors: Connector[];
  corridors: Corridor[];
  activeLens: UILens;
  oodaPhase: OODAPhase;
  feynmanSummary: string;
  events: ILPEvent[];
  setLens: (lens: UILens) => void;
  calculateRoute: (from: string, to: string, amount: number) => Route | null;
  startOODA: () => void;
  stopOODA: () => void;
} {
  const [topology] = useState(() => getTopology());
  const [state, setState] = useState<TopologyState>(topology.getState());
  const [events, setEvents] = useState<ILPEvent[]>([]);

  useEffect(() => {
    // Start OODA loop
    topology.startOODALoop(10000);

    // Subscribe to events
    const unsubscribe = topology.subscribe((event) => {
      setEvents(prev => [...prev.slice(-99), event]);
      setState({ ...topology.getState() });
    });

    return () => {
      unsubscribe();
      topology.stopOODALoop();
    };
  }, [topology]);

  const setLens = useCallback((lens: UILens) => {
    topology.setActiveLens(lens);
    setState({ ...topology.getState() });
  }, [topology]);

  const calculateRoute = useCallback((from: string, to: string, amount: number) => {
    return topology.calculateRoute(from, to, amount);
  }, [topology]);

  const startOODA = useCallback(() => {
    topology.startOODALoop(10000);
  }, [topology]);

  const stopOODA = useCallback(() => {
    topology.stopOODALoop();
  }, [topology]);

  return {
    topology,
    state,
    ledgers: topology.getLedgers(),
    connectors: topology.getConnectors(),
    corridors: topology.getCorridors(),
    activeLens: state.active_lens,
    oodaPhase: state.ooda.current_phase,
    feynmanSummary: state.feynman.summary,
    events,
    setLens,
    calculateRoute,
    startOODA,
    stopOODA,
  };
}

export function useLedger(id: string): Ledger | undefined {
  const topology = getTopology();
  const [ledger, setLedger] = useState(topology.getLedger(id));

  useEffect(() => {
    const unsubscribe = topology.subscribe((event) => {
      if (event.type === 'LEDGER_UPDATED' && event.ledger.id === id) {
        setLedger(event.ledger);
      }
    });
    return unsubscribe;
  }, [id]);

  return ledger;
}

export function useConnector(id: string): Connector | undefined {
  const topology = getTopology();
  const [connector, setConnector] = useState(topology.getConnector(id));

  useEffect(() => {
    const unsubscribe = topology.subscribe((event) => {
      if (event.type === 'CONNECTOR_UPDATED' && event.connector.id === id) {
        setConnector(event.connector);
      }
    });
    return unsubscribe;
  }, [id]);

  return connector;
}

export function useCorridor(id: string): Corridor | undefined {
  const topology = getTopology();
  const [corridor, setCorridor] = useState(topology.getCorridor(id));

  useEffect(() => {
    const unsubscribe = topology.subscribe((event) => {
      if (event.type === 'CORRIDOR_STATUS_CHANGED' && event.corridor.id === id) {
        setCorridor(event.corridor);
      }
    });
    return unsubscribe;
  }, [id]);

  return corridor;
}
