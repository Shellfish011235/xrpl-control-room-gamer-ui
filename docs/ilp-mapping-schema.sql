-- ILP Mapping — PostgreSQL Schema
-- For connectors, routes, corridors, payments, quotes, settlements, probes, health, confidence.
-- Run against PostgreSQL 14+ (or TimescaleDB for time-series tables).

-- ==================== ENUMS ====================
CREATE TYPE data_class AS ENUM ('observed', 'derived', 'inferred', 'unknown');
CREATE TYPE liquidity_status AS ENUM ('live', 'simulated', 'unknown', 'depleted');
CREATE TYPE payment_status AS ENUM ('pending', 'quoted', 'in_flight', 'settled', 'failed');
CREATE TYPE node_health_status AS ENUM ('up', 'degraded', 'down', 'unknown');
CREATE TYPE anomaly_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- ==================== PROVENANCE (reusable) ====================
CREATE TABLE ilp_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_class data_class NOT NULL,
  confidence SMALLINT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  source_ids TEXT[] DEFAULT '{}',
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  explanation TEXT
);

-- ==================== CORE ENTITIES ====================
CREATE TABLE ilp_ledgers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT,
  type TEXT NOT NULL,
  native_asset_id TEXT NOT NULL,
  finality_seconds INT,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ilp_connectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  from_ledger_id TEXT NOT NULL REFERENCES ilp_ledgers(id),
  to_ledger_id TEXT NOT NULL REFERENCES ilp_ledgers(id),
  asset_pairs JSONB NOT NULL DEFAULT '[]',
  liquidity_status liquidity_status NOT NULL DEFAULT 'unknown',
  liquidity_depth_usd NUMERIC,
  settlement_mechanism TEXT,
  operator TEXT,
  fee_bps INT,
  min_amount NUMERIC,
  max_amount NUMERIC,
  uptime_percent NUMERIC,
  last_active_at TIMESTAMPTZ,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id),
  legacy_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ilp_routes (
  id TEXT PRIMARY KEY,
  from_ledger_id TEXT NOT NULL,
  to_ledger_id TEXT NOT NULL,
  from_asset TEXT NOT NULL,
  to_asset TEXT NOT NULL,
  hop_connector_ids TEXT[] NOT NULL,
  total_fee_bps INT NOT NULL DEFAULT 0,
  total_latency_ms INT NOT NULL DEFAULT 0,
  liquidity_available_usd NUMERIC,
  expires_at TIMESTAMPTZ,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ilp_corridors (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL REFERENCES ilp_connectors(id),
  from_ledger_id TEXT NOT NULL,
  to_ledger_id TEXT NOT NULL,
  from_asset TEXT NOT NULL,
  to_asset TEXT NOT NULL,
  status TEXT NOT NULL,
  volume_24h_usd NUMERIC,
  tx_count_24h INT,
  avg_settlement_time_ms INT,
  success_rate NUMERIC,
  bidirectional BOOLEAN NOT NULL DEFAULT true,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ilp_assets (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  ledger_id TEXT NOT NULL REFERENCES ilp_ledgers(id),
  asset_type TEXT NOT NULL,
  issuer TEXT,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== EVENTS (time-series friendly) ====================
CREATE TABLE ilp_payment_attempts (
  id TEXT PRIMARY KEY,
  source_ledger_id TEXT NOT NULL,
  dest_ledger_id TEXT NOT NULL,
  source_asset TEXT NOT NULL,
  dest_asset TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  route_id TEXT,
  status payment_status NOT NULL,
  quote_id TEXT,
  settlement_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ,
  failure_reason TEXT,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ilp_quotes (
  id TEXT PRIMARY KEY,
  payment_attempt_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  amount_in NUMERIC NOT NULL,
  amount_out NUMERIC NOT NULL,
  exchange_rate NUMERIC,
  fee_bps INT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id)
);

CREATE TABLE ilp_settlement_events (
  id TEXT PRIMARY KEY,
  payment_attempt_id TEXT NOT NULL,
  ledger_id TEXT NOT NULL,
  tx_hash TEXT,
  amount NUMERIC NOT NULL,
  asset TEXT NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id),
  xrpl_confirmed BOOLEAN DEFAULT false
);

CREATE TABLE ilp_liquidity_edges (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL REFERENCES ilp_connectors(id),
  from_asset TEXT NOT NULL,
  to_asset TEXT NOT NULL,
  amount_usd NUMERIC NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id)
);

CREATE TABLE ilp_node_health (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  node_id TEXT NOT NULL,
  status node_health_status NOT NULL,
  latency_ms INT,
  last_check_at TIMESTAMPTZ NOT NULL,
  consecutive_failures INT NOT NULL DEFAULT 0,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ilp_probe_results (
  id TEXT PRIMARY KEY,
  probe_type TEXT NOT NULL,
  target_connector_id TEXT,
  target_route_id TEXT,
  success BOOLEAN NOT NULL,
  latency_ms INT,
  error_code TEXT,
  executed_at TIMESTAMPTZ NOT NULL,
  is_synthetic BOOLEAN NOT NULL DEFAULT true,
  provenance_id UUID NOT NULL REFERENCES ilp_provenance(id)
);

CREATE TABLE ilp_anomalies (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity anomaly_severity NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  message TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);

-- ==================== INDEXES ====================
CREATE INDEX idx_connectors_ledgers ON ilp_connectors(from_ledger_id, to_ledger_id);
CREATE INDEX idx_routes_ledgers ON ilp_routes(from_ledger_id, to_ledger_id);
CREATE INDEX idx_corridors_connector ON ilp_corridors(connector_id);
CREATE INDEX idx_payments_started ON ilp_payment_attempts(started_at);
CREATE INDEX idx_payments_status ON ilp_payment_attempts(status);
CREATE INDEX idx_settlements_ledger ON ilp_settlement_events(ledger_id);
CREATE INDEX idx_settlements_xrpl ON ilp_settlement_events(xrpl_confirmed) WHERE xrpl_confirmed = true;
CREATE INDEX idx_probes_executed ON ilp_probe_results(executed_at);
CREATE INDEX idx_probes_synthetic ON ilp_probe_results(is_synthetic) WHERE is_synthetic = true;
CREATE INDEX idx_anomalies_detected ON ilp_anomalies(detected_at);
CREATE INDEX idx_anomalies_entity ON ilp_anomalies(entity_type, entity_id);
