import {
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { P2PQuakeRecord } from '../types/quake';
import {
  type ScaleDistributionBin,
  buildScaleDistribution,
} from '../utils/scaleDistribution';
import type { ThemeMode } from '../utils/themeSettings';

interface ScaleDistributionChartProps {
  record: P2PQuakeRecord;
  themeMode: ThemeMode;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScaleDistributionBin }>;
  unitLabel: '地点' | '地域';
}

function DistributionTooltip({
  active,
  payload,
  unitLabel,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const bin = payload[0].payload;

  return (
    <div className="rounded-md border border-[var(--nein-border)] bg-[var(--nein-surface)] px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-xs"
          style={{ backgroundColor: bin.color }}
        />
        <span>{bin.fullLabel}</span>
      </div>
      <div className="mt-1 font-mono text-slate-800 dark:text-slate-200 tabular-nums">
        {bin.count} {unitLabel}
      </div>
      {bin.prefectures.length > 0 && (
        <div className="mt-1 max-w-[220px] text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {bin.prefectures.slice(0, 6).join('・')}
          {bin.prefectures.length > 6 ? ' 他' : ''}
        </div>
      )}
    </div>
  );
}

function renderScaleBar(props: BarShapeProps) {
  const bin = props.payload as ScaleDistributionBin | undefined;
  const count = bin?.count ?? 0;
  if (count <= 0 || props.height <= 0 || props.width <= 0) {
    return <g />;
  }

  return (
    <Rectangle
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      radius={[4, 4, 0, 0]}
      fill={bin?.color ?? '#38BDF8'}
      fillOpacity={props.isActive ? 1 : 0.9}
    />
  );
}

export function ScaleDistributionChart({
  record,
  themeMode,
}: ScaleDistributionChartProps) {
  const { bins, totalCount, unitLabel, title } = buildScaleDistribution(record);
  const isDark = themeMode === 'dark';
  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const axisTickFill = isDark ? '#94A3B8' : '#475569';
  const axisStroke = isDark ? '#64748B' : '#94A3B8';

  return (
    <div
      data-testid="scale-distribution-chart"
      className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
          合計 {totalCount} {unitLabel}
        </span>
      </div>

      {totalCount === 0 ? (
        <div className="mt-4 flex h-[160px] items-center justify-center rounded-md border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-4 text-center text-xs text-slate-500">
          この情報には震度分布の地点データが含まれていません。
        </div>
      ) : (
        <div className="mt-4 h-[210px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
            <BarChart
              key={record.id}
              data={bins}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                stroke={gridStroke}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="shortLabel"
                stroke={axisStroke}
                tick={{ fill: axisTickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
              />
              <YAxis
                allowDecimals={false}
                stroke={axisStroke}
                tick={{ fill: axisTickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.05)' }}
                content={<DistributionTooltip unitLabel={unitLabel} />}
              />
              <Bar
                dataKey="count"
                maxBarSize={38}
                isAnimationActive={false}
                shape={renderScaleBar}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
