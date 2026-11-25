import { AlertTriangle, Thermometer } from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HourlyWeatherPoint, OpenMeteoBundle } from '../../types/weather';
import type { ThemeMode } from '../../utils/themeSettings';
import { formatJstTimestamp } from '../../utils/weatherParser';

interface WeatherChartsProps {
  openMeteo: OpenMeteoBundle | null;
  isLoading: boolean;
  themeMode: ThemeMode;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: HourlyWeatherPoint }>;
}

function CustomHourlyTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] px-3 py-2 text-xs shadow-xl">
      <div className="font-mono font-semibold text-slate-900 dark:text-slate-200">
        {pt.hourLabel} JST（モデル予測）
      </div>
      <div className="mt-1.5 space-y-1 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600 dark:text-slate-400">予測気温</span>
          <span className="font-semibold text-amber-600 dark:text-amber-300">
            {pt.tempC.toFixed(1)} ℃
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600 dark:text-slate-400">降水確率</span>
          <span className="font-semibold text-sky-700 dark:text-sky-300">
            {pt.popPct} %
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600 dark:text-slate-400">予測降水量</span>
          <span className="font-semibold text-cyan-700 dark:text-cyan-300">
            {pt.precipitationMm.toFixed(1)} mm
          </span>
        </div>
      </div>
    </div>
  );
}

export function WeatherCharts({ openMeteo, isLoading, themeMode }: WeatherChartsProps) {
  const isError = openMeteo?.meta.status === 'error';
  const points = openMeteo?.hourly24h ?? [];
  const isDark = themeMode === 'dark';

  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const xTickFill = isDark ? '#94A3B8' : '#475569';
  const xAxisStroke = isDark ? '#334155' : '#CBD5E1';
  const tempTickFill = isDark ? '#FCD34D' : '#B45309';
  const popTickFill = isDark ? '#38BDF8' : '#0284C7';
  const tempStroke = isDark ? '#F59E0B' : '#D97706';

  return (
    <section
      aria-label="24時間気温推移および降水確率グラフ"
      className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              24時間 気温推移・降水確率
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Open-Meteo 気象モデルによる予測値（実測値ではありません）
            {openMeteo?.meta.publishedAt && (
              <span className="ml-2 font-mono tabular-nums text-slate-500">
                基準時刻: {formatJstTimestamp(openMeteo.meta.publishedAt)}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500 dark:bg-amber-400" aria-hidden="true" />
            気温 (℃)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-500/70" aria-hidden="true" />
            降水確率 (%)
          </span>
        </div>
      </div>

      {isLoading && points.length === 0 ? (
        <div className="mt-4 flex h-56 items-center justify-center rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] text-xs text-slate-500 dark:text-slate-400">
          24時間予測データを読み込み中...
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-300 bg-red-50 px-4 py-4 text-xs text-red-800 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-200"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
          <span>{openMeteo?.meta.errorMessage ?? '24時間予測データの取得に失敗しました。'}</span>
        </div>
      ) : points.length === 0 ? (
        <div className="mt-4 flex h-56 items-center justify-center rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] text-xs text-slate-500">
          表示可能な時間別予測データがありません。
        </div>
      ) : (
        <div className="mt-4 h-[230px] w-full">
          <ResponsiveContainer width="100%" height={230} minWidth={0}>
            <ComposedChart
              data={points}
              margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tempStroke} stopOpacity={isDark ? 0.32 : 0.25} />
                  <stop offset="95%" stopColor={tempStroke} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hourLabel"
                tick={{ fill: xTickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: xAxisStroke }}
                interval={2}
              />
              <YAxis
                yAxisId="temp"
                tick={{ fill: tempTickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit="°"
                domain={['auto', 'auto']}
              />
              <YAxis
                yAxisId="pop"
                orientation="right"
                tick={{ fill: popTickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip content={<CustomHourlyTooltip />} />
              <Bar
                yAxisId="pop"
                dataKey="popPct"
                name="降水確率"
                fill="#0EA5E9"
                fillOpacity={isDark ? 0.28 : 0.32}
                radius={[3, 3, 0, 0]}
                barSize={12}
                isAnimationActive={false}
              />
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey="tempC"
                name="予測気温"
                stroke={tempStroke}
                strokeWidth={2}
                fill="url(#tempAreaGrad)"
                dot={{ r: 2, fill: tempStroke, strokeWidth: 0 }}
                activeDot={{ r: 4, fill: tempTickFill }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
