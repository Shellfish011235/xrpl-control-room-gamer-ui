/**
 * Scatter plot: volume (Y) vs price (X) by day. Highlights outliers for key indicators.
 * Uses IQR on volume to flag unusually high/low volume days.
 */

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import type { PriceVolumePoint } from '../hooks/useXRPPriceVolumeHistory';

function quartile(sorted: number[], q: number): number {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function flagOutliers(points: PriceVolumePoint[]): (PriceVolumePoint & { isOutlier: boolean })[] {
  if (points.length < 4) return points.map((p) => ({ ...p, isOutlier: false }));
  const volumes = points.map((p) => p.volume).sort((a, b) => a - b);
  const q1 = quartile(volumes, 0.25);
  const q3 = quartile(volumes, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return points.map((p) => ({
    ...p,
    isOutlier: p.volume < lower || p.volume > upper,
  }));
}

function formatVolume(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return String(n);
}

interface VolumePriceScatterChartProps {
  data: PriceVolumePoint[];
  period: string;
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export default function VolumePriceScatterChart({
  data,
  period,
  loading,
  onRefresh,
  className = '',
}: VolumePriceScatterChartProps) {
  const withOutliers = useMemo(() => flagOutliers(data), [data]);
  const normalPoints = withOutliers.filter((p) => !p.isOutlier);
  const outlierPoints = withOutliers.filter((p) => p.isOutlier);

  const volumeDomain = useMemo(() => {
    const vols = data.map((p) => p.volume).filter((v) => v > 0);
    if (vols.length === 0) return [0, 1];
    const min = Math.min(...vols);
    const max = Math.max(...vols);
    const pad = (max - min) * 0.05 || 1;
    return [Math.max(0, min - pad), max + pad];
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-cyber-muted text-sm ${className}`}>
        No data. Try another period or refresh.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-cyber-muted uppercase tracking-wider">
          Volume vs price by day · outliers highlighted
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1 rounded text-cyber-muted hover:text-cyber-glow disabled:opacity-50"
            title="Refresh"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-cyber-glow/30 border-t-cyber-glow rounded-full animate-spin" />
            ) : (
              '↻'
            )}
          </button>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 20, bottom: 20, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" />
            <XAxis
              type="number"
              dataKey="xrp"
              name="Price (USD)"
              unit=" USD"
              tick={{ fill: '#64748b', fontSize: 10 }}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
            />
            <YAxis
              type="number"
              dataKey="volume"
              name="Volume"
              tick={{ fill: '#64748b', fontSize: 10 }}
              domain={volumeDomain}
              tickFormatter={(v) => formatVolume(Number(v))}
            />
            <ZAxis range={[80, 200]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(0, 212, 255, 0.4)' }}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #1e3a5f',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'volume') return [formatVolume(value), 'Volume'];
                if (name === 'xrp') return [`$${Number(value).toFixed(4)}`, 'Price'];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (payload?.[0]?.payload?.date) return payload[0].payload.date;
                return label;
              }}
            />
            {normalPoints.length > 0 && (
              <Scatter
                name="Normal"
                data={normalPoints}
                fill="rgba(0, 212, 255, 0.5)"
                stroke="#00d4ff"
                strokeWidth={1}
              />
            )}
            {outlierPoints.length > 0 && (
              <Scatter
                name="Outlier"
                data={outlierPoints}
                fill="rgba(234, 179, 8, 0.7)"
                stroke="#eab308"
                strokeWidth={2}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-cyber-muted mt-1">
        {period} · Yellow = volume outlier (IQR). Use to spot unusual activity vs price.
      </p>
    </div>
  );
}
