'use client';

import { CAPITAL_DIMENSIONS } from '@/lib/fields';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface CapitalRadarChartProps {
  frontmatter: Record<string, unknown>;
}

export function CapitalRadarChart({ frontmatter }: CapitalRadarChartProps) {
  const data = CAPITAL_DIMENSIONS.map((d) => {
    const raw = frontmatter[d.key];
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
    return { subject: d.label, value: Number.isFinite(num) ? num : 0 };
  });

  const hasData = data.some((d) => d.value > 0);
  if (!hasData) return null;

  return (
    <div className="w-full" style={{ minHeight: 280 }}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#9ca3af" strokeOpacity={0.4} />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Radar
            name="资本"
            dataKey="value"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}