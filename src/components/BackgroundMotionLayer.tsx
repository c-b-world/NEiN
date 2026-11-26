import { useEffect, useRef } from 'react';
import {
  type BackgroundMotionId,
  type ThemeMode,
  resolveEffectiveBackgroundMotion,
} from '../utils/themeSettings';

interface BackgroundMotionLayerProps {
  motion: BackgroundMotionId;
  themeMode: ThemeMode;
}

interface SakuraPetal {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  swayPhase: number;
  swaySpeed: number;
  flipPhase: number;
  flipSpeed: number;
  colorIdx: number;
  alpha: number;
}

interface SummerCloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
  variant: number;
}

interface SeaSparkle {
  x: number;
  yRatio: number;
  phase: number;
  speed: number;
  size: number;
}

interface AutumnLeaf {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  swayPhase: number;
  swaySpeed: number;
  flipPhase: number;
  colorIdx: number;
  alpha: number;
}

interface Snowflake {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  swayPhase: number;
  swaySpeed: number;
  alpha: number;
  isCrystal: boolean;
}

interface StarPoint {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  baseAlpha: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
  maxLife: number;
}

function drawSakuraPetal(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.85, -size * 0.85, size * 0.9, size * 0.35, 0, size);
  ctx.bezierCurveTo(-size * 0.9, size * 0.35, -size * 0.85, -size * 0.85, 0, -size);
  // Subtle notch at top tip
  ctx.moveTo(-size * 0.16, -size * 0.88);
  ctx.lineTo(0, -size * 0.68);
  ctx.lineTo(size * 0.16, -size * 0.88);
  ctx.closePath();
  ctx.fill();
}

function drawMapleLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.15);
  ctx.lineTo(s * 0.22, -s * 0.42);
  ctx.lineTo(s * 0.92, -s * 0.56);
  ctx.lineTo(s * 0.46, -s * 0.05);
  ctx.lineTo(s * 0.85, s * 0.42);
  ctx.lineTo(s * 0.2, s * 0.36);
  ctx.lineTo(0, s * 0.82);
  ctx.lineTo(-s * 0.2, s * 0.36);
  ctx.lineTo(-s * 0.85, s * 0.42);
  ctx.lineTo(-s * 0.46, -s * 0.05);
  ctx.lineTo(-s * 0.92, -s * 0.56);
  ctx.lineTo(-s * 0.22, -s * 0.42);
  ctx.closePath();
  ctx.fill();
}

function drawSummerCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  isDark: boolean,
  alpha: number,
  variant: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  const puffs =
    variant % 2 === 0
      ? [
          { cx: -62, cy: 10, r: 30 },
          { cx: -28, cy: -6, r: 42 },
          { cx: 16, cy: -12, r: 48 },
          { cx: 58, cy: 2, r: 35 },
          { cx: 88, cy: 14, r: 24 },
          { cx: -86, cy: 18, r: 22 },
        ]
      : [
          { cx: -50, cy: 12, r: 28 },
          { cx: -14, cy: -10, r: 44 },
          { cx: 30, cy: -4, r: 38 },
          { cx: 66, cy: 12, r: 26 },
        ];

  // Soft underside shadow
  ctx.fillStyle = isDark ? 'rgba(30, 58, 102, 0.52)' : 'rgba(148, 197, 232, 0.58)';
  ctx.beginPath();
  for (const p of puffs) {
    ctx.moveTo(p.cx + p.r, p.cy + 8);
    ctx.arc(p.cx, p.cy + 8, p.r * 0.96, 0, Math.PI * 2);
  }
  ctx.fill();

  // Main cloud body
  const grad = ctx.createLinearGradient(0, -56, 0, 34);
  if (isDark) {
    grad.addColorStop(0, 'rgba(186, 214, 247, 0.38)');
    grad.addColorStop(0.55, 'rgba(100, 138, 192, 0.30)');
    grad.addColorStop(1, 'rgba(46, 74, 118, 0.24)');
  } else {
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
    grad.addColorStop(0.65, 'rgba(241, 249, 255, 0.90)');
    grad.addColorStop(1, 'rgba(212, 234, 250, 0.78)');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (const p of puffs) {
    ctx.moveTo(p.cx + p.r, p.cy);
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function getSkyBackgroundStyle(motion: BackgroundMotionId, isDark: boolean): string {
  switch (motion) {
    case 'spring':
      return isDark
        ? 'radial-gradient(circle at 82% 16%, rgba(244, 182, 210, 0.16) 0%, transparent 42%), linear-gradient(180deg, #090d1b 0%, #151228 48%, #261831 78%, #1d2624 100%)'
        : 'radial-gradient(circle at 80% 14%, rgba(255, 251, 235, 0.95) 0%, transparent 38%), linear-gradient(180deg, #dbeafe 0%, #eff6ff 42%, #fdf2f8 78%, #fce7f3 100%)';
    case 'summer':
      return isDark
        ? 'radial-gradient(circle at 76% 18%, rgba(224, 242, 254, 0.22) 0%, transparent 34%), linear-gradient(180deg, #050c1a 0%, #0a1933 48%, #0e284b 78%, #0a2e4d 100%)'
        : 'radial-gradient(circle at 78% 14%, rgba(254, 249, 195, 0.95) 0%, rgba(254, 240, 138, 0.35) 18%, transparent 44%), linear-gradient(180deg, #60b8f0 0%, #a5dafc 46%, #e0f2fe 78%, #bae6fd 100%)';
    case 'autumn':
      return isDark
        ? 'radial-gradient(circle at 22% 18%, rgba(251, 146, 60, 0.16) 0%, transparent 40%), linear-gradient(180deg, #10090d 0%, #201015 48%, #361718 78%, #2b1310 100%)'
        : 'radial-gradient(circle at 24% 16%, rgba(254, 215, 170, 0.85) 0%, transparent 42%), linear-gradient(180deg, #fef9ec 0%, #ffedd5 48%, #fed7aa 80%, #fdba74 100%)';
    case 'winter':
      return isDark
        ? 'radial-gradient(circle at 50% 14%, rgba(147, 197, 253, 0.14) 0%, transparent 48%), linear-gradient(180deg, #060b16 0%, #0d172b 52%, #182944 82%, #243857 100%)'
        : 'radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.95) 0%, transparent 48%), linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 48%, #f1f5f9 80%, #f8fafc 100%)';
    case 'space':
      return 'radial-gradient(ellipse at 25% 24%, rgba(79, 70, 229, 0.16) 0%, transparent 52%), radial-gradient(ellipse at 78% 36%, rgba(14, 165, 233, 0.12) 0%, transparent 48%), linear-gradient(180deg, #020510 0%, #060b1e 55%, #0c1634 86%, #111e42 100%)';
    default:
      return 'none';
  }
}

function GroundScenery({ motion, isDark }: { motion: BackgroundMotionId; isDark: boolean }) {
  if (motion === 'spring') {
    // 春 => 桜の咲く公園 (Park hills, winding walkway, bench, lantern, cherry blossom trees in bloom)
    return (
      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[220px] w-full sm:h-[275px]"
      >
        <defs>
          <linearGradient id="springHillFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1a2a2a' : '#86efac'} stopOpacity={isDark ? '0.82' : '0.68'} />
            <stop offset="100%" stopColor={isDark ? '#111d1d' : '#4ade80'} stopOpacity={isDark ? '0.92' : '0.82'} />
          </linearGradient>
          <linearGradient id="springHillNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#182b24' : '#4ade80'} />
            <stop offset="100%" stopColor={isDark ? '#0e1a16' : '#16a34a'} />
          </linearGradient>
          <radialGradient id="parkLampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity={isDark ? '0.62' : '0.15'} />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft distant sakura-tree grove ridge */}
        <path
          d="M0 218 Q180 170 390 198 T840 192 T1240 176 L1440 198 L1440 300 L0 300 Z"
          fill={isDark ? '#2f1d33' : '#fbcfe8'}
          opacity={isDark ? '0.68' : '0.72'}
        />

        {/* Mid park lawn hill */}
        <path
          d="M0 232 Q320 184 680 218 T1440 206 L1440 300 L0 300 Z"
          fill="url(#springHillFar)"
        />

        {/* Foreground park grass */}
        <path
          d="M0 248 Q420 218 820 244 T1440 232 L1440 300 L0 300 Z"
          fill="url(#springHillNear)"
        />

        {/* Winding park pathway */}
        <path
          d="M520 300 C590 264, 665 244, 738 228 C780 219, 825 215, 868 214 L895 216 C836 226, 780 246, 725 300 Z"
          fill={isDark ? '#2b303a' : '#fef3c7'}
          opacity={isDark ? '0.7' : '0.78'}
        />

        {/* Classic park bench on right lawn */}
        <g transform="translate(970 228)" opacity={isDark ? '0.88' : '0.92'}>
          <rect x="0" y="10" width="66" height="6" rx="2" fill={isDark ? '#4a352a' : '#92400e'} />
          <rect x="0" y="19" width="66" height="6" rx="2" fill={isDark ? '#5c4133' : '#b45309'} />
          <rect x="2" y="29" width="62" height="5" rx="2" fill={isDark ? '#3f2d24' : '#78350f'} />
          <rect x="9" y="10" width="4" height="32" fill={isDark ? '#1e293b' : '#334155'} />
          <rect x="53" y="10" width="4" height="32" fill={isDark ? '#1e293b' : '#334155'} />
        </g>

        {/* Park lamppost with warm lantern glow in dark night-sakura mode */}
        <g transform="translate(420 156)">
          {isDark && <circle cx="4" cy="14" r="46" fill="url(#parkLampGlow)" />}
          <rect x="2" y="18" width="4" height="84" fill={isDark ? '#1f2937' : '#475569'} />
          <path d="M-4 18 L12 18 L9 6 L-1 6 Z" fill={isDark ? '#fef08a' : '#fef9c3'} stroke={isDark ? '#334155' : '#64748b'} strokeWidth="1.5" />
          <path d="M-7 6 L15 6 L4 -2 Z" fill={isDark ? '#1f2937' : '#475569'} />
        </g>

        {/* Left Cherry Blossom Tree */}
        <g transform="translate(110 262)">
          <path
            d="M-12 24 C-10 -22, -4 -70, 6 -120 C2 -74, 24 -44, 58 -76 C28 -36, 12 -14, 14 24 Z"
            fill={isDark ? '#2b1e24' : '#6b4435'}
          />
          <path
            d="M0 -84 C-34 -102, -58 -114, -76 -128"
            stroke={isDark ? '#2b1e24' : '#6b4435'}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {/* Blossom Canopy */}
          <g fill={isDark ? '#9d4edd' : '#f9a8d4'} opacity={isDark ? '0.26' : '0.45'}>
            <circle cx="-55" cy="-130" r="56" />
            <circle cx="42" cy="-118" r="52" />
          </g>
          <g fill={isDark ? '#f472b6' : '#fbcfe8'} opacity={isDark ? '0.78' : '0.94'}>
            <circle cx="-68" cy="-136" r="46" />
            <circle cx="-18" cy="-156" r="56" />
            <circle cx="38" cy="-136" r="50" />
            <circle cx="78" cy="-102" r="38" />
            <circle cx="-98" cy="-102" r="36" />
          </g>
          <g fill={isDark ? '#fbcfe8' : '#ffffff'} opacity={isDark ? '0.52' : '0.68'}>
            <circle cx="-32" cy="-164" r="30" />
            <circle cx="24" cy="-148" r="28" />
            <circle cx="-72" cy="-126" r="22" />
          </g>
        </g>

        {/* Right Cherry Blossom Tree */}
        <g transform="translate(1310 256)">
          <path
            d="M-14 28 C-10 -24, -18 -72, -6 -126 C6 -78, -22 -42, -64 -78 C-30 -32, -8 -10, 12 28 Z"
            fill={isDark ? '#2b1e24' : '#6b4435'}
          />
          <g fill={isDark ? '#f472b6' : '#f9a8d4'} opacity={isDark ? '0.76' : '0.92'}>
            <circle cx="-72" cy="-126" r="48" />
            <circle cx="-18" cy="-152" r="58" />
            <circle cx="44" cy="-134" r="52" />
            <circle cx="84" cy="-98" r="40" />
            <circle cx="-106" cy="-92" r="34" />
          </g>
          <g fill={isDark ? '#fce7f3' : '#fff1f2'} opacity={isDark ? '0.50' : '0.72'}>
            <circle cx="-26" cy="-162" r="30" />
            <circle cx="32" cy="-144" r="26" />
          </g>
        </g>

        {/* Scattered fallen sakura petals on the park lawn */}
        <g fill={isDark ? '#f9a8d4' : '#fbcfe8'} opacity={isDark ? '0.65' : '0.88'}>
          <ellipse cx="220" cy="274" rx="5" ry="2.2" />
          <ellipse cx="275" cy="282" rx="4" ry="1.8" />
          <ellipse cx="360" cy="268" rx="4.5" ry="2" />
          <ellipse cx="640" cy="276" rx="5" ry="2" />
          <ellipse cx="780" cy="285" rx="4.5" ry="2" />
          <ellipse cx="1120" cy="272" rx="5" ry="2.2" />
          <ellipse cx="1220" cy="284" rx="4" ry="1.8" />
          <ellipse cx="1295" cy="270" rx="5.5" ry="2.2" />
        </g>
      </svg>
    );
  }

  if (motion === 'summer') {
    // 夏 => 海 (Ocean horizon, coastal cape & lighthouse, moon/sun shimmer path, gentle rolling sea waves, shore)
    return (
      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[215px] w-full sm:h-[265px]"
      >
        <defs>
          <linearGradient id="summerSeaBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#0c2d52' : '#0284c7'} />
            <stop offset="55%" stopColor={isDark ? '#08203d' : '#0369a1'} />
            <stop offset="100%" stopColor={isDark ? '#061529' : '#075985'} />
          </linearGradient>
          <linearGradient id="summerShimmer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#bae6fd' : '#fef08a'} stopOpacity={isDark ? '0.35' : '0.52'} />
            <stop offset="100%" stopColor={isDark ? '#bae6fd' : '#fef08a'} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Distant island / headland silhouette */}
        <path
          d="M1040 148 Q1145 102 1260 124 Q1355 110 1440 132 L1440 152 L1040 152 Z"
          fill={isDark ? '#0f2238' : '#38bdf8'}
          opacity={isDark ? '0.88' : '0.55'}
        />
        {/* Tiny coastal lighthouse on cape */}
        <g transform="translate(1245 102)">
          <rect x="-3" y="4" width="6" height="19" fill={isDark ? '#cbd5e1' : '#ffffff'} opacity="0.9" />
          <circle cx="0" cy="3" r={isDark ? '5' : '2.5'} fill={isDark ? '#fde68a' : '#fef08a'} opacity={isDark ? '0.85' : '0.7'} />
        </g>

        {/* Main Sea Body from Horizon */}
        <rect x="0" y="146" width="1440" height="154" fill="url(#summerSeaBase)" />

        {/* Horizon highlight */}
        <line
          x1="0"
          y1="147"
          x2="1440"
          y2="147"
          stroke={isDark ? '#7dd3fc' : '#e0f2fe'}
          strokeWidth="2"
          opacity={isDark ? '0.35' : '0.85'}
        />

        {/* Sun / Moon reflection shimmer column */}
        <polygon points="1060,147 1165,147 1260,290 980,290" fill="url(#summerShimmer)" />

        {/* Rolling Wave Layer 1 */}
        <g className="nein-sea-wave-a">
          <path
            d="M-60 190 Q60 174 180 190 T420 190 T660 190 T900 190 T1140 190 T1380 190 T1560 190 L1560 300 L-60 300 Z"
            fill={isDark ? '#0c355e' : '#0ea5e9'}
            opacity={isDark ? '0.62' : '0.55'}
          />
        </g>

        {/* Rolling Wave Layer 2 */}
        <g className="nein-sea-wave-b">
          <path
            d="M-80 228 Q50 212 180 228 T440 228 T700 228 T960 228 T1220 228 T1520 228 L1520 300 L-80 300 Z"
            fill={isDark ? '#0b4170' : '#38bdf8'}
            opacity={isDark ? '0.55' : '0.62'}
          />
          <path
            d="M-80 228 Q50 212 180 228 T440 228 T700 228 T960 228 T1220 228 T1520 228"
            fill="none"
            stroke={isDark ? '#bae6fd' : '#ffffff'}
            strokeWidth="2"
            opacity={isDark ? '0.28' : '0.65'}
          />
        </g>

        {/* Gentle foam & sandy shore edge */}
        <path
          d="M0 268 Q360 252 720 268 T1440 262 L1440 300 L0 300 Z"
          fill={isDark ? '#1e3a52' : '#fde68a'}
          opacity={isDark ? '0.7' : '0.82'}
        />
        <path
          d="M0 268 Q360 252 720 268 T1440 262"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          opacity={isDark ? '0.22' : '0.8'}
        />
      </svg>
    );
  }

  if (motion === 'autumn') {
    // 秋 => 紅葉で紅く染まった山 (Layered crimson, vermilion & amber mountain ridges with maple canopies)
    return (
      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[230px] w-full sm:h-[285px]"
      >
        <defs>
          <linearGradient id="autumnMtnFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#5b1f29' : '#fb923c'} />
            <stop offset="100%" stopColor={isDark ? '#2c1118' : '#ea580c'} />
          </linearGradient>
          <linearGradient id="autumnMtnMid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isDark ? '#7f1d1d' : '#dc2626'} />
            <stop offset="50%" stopColor={isDark ? '#9a3412' : '#ea580c'} />
            <stop offset="100%" stopColor={isDark ? '#7c2d12' : '#d97706'} />
          </linearGradient>
          <linearGradient id="autumnMtnNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#69171a' : '#b91c1c'} />
            <stop offset="100%" stopColor={isDark ? '#290d0e' : '#7c2d12'} />
          </linearGradient>
        </defs>

        {/* Distant Hazy Autumn Mountain Range */}
        <path
          d="M0 198 L165 112 L340 174 L560 88 L790 168 L1020 96 L1235 156 L1440 104 L1440 300 L0 300 Z"
          fill="url(#autumnMtnFar)"
          opacity={isDark ? '0.78' : '0.74'}
        />

        {/* Subtle Valley Mist */}
        <rect
          x="0"
          y="165"
          width="1440"
          height="54"
          fill={isDark ? '#fb923c' : '#fff7ed'}
          opacity={isDark ? '0.08' : '0.32'}
        />

        {/* Mid Crimson & Vermilion Mountain Ridge */}
        <path
          d="M0 226 Q170 144 350 198 Q560 120 770 194 Q995 128 1210 190 Q1335 156 1440 176 L1440 300 L0 300 Z"
          fill="url(#autumnMtnMid)"
          opacity={isDark ? '0.88' : '0.88'}
        />

        {/* Golden-Amber Foliage Patches across Mountain Slopes */}
        <g opacity={isDark ? '0.42' : '0.62'}>
          <ellipse cx="290" cy="212" rx="95" ry="28" fill="#f59e0b" />
          <ellipse cx="645" cy="196" rx="115" ry="30" fill="#ea580c" />
          <ellipse cx="1060" cy="204" rx="105" ry="28" fill="#eab308" />
        </g>

        {/* Foreground Deep-Crimson Slopes */}
        <path
          d="M0 242 Q260 198 530 246 Q860 202 1150 240 Q1310 218 1440 228 L1440 300 L0 300 Z"
          fill="url(#autumnMtnNear)"
        />

        {/* Framing Foreground Crimson & Gold Maple Clusters */}
        <g fill={isDark ? '#991b1b' : '#dc2626'} opacity={isDark ? '0.9' : '0.92'}>
          <circle cx="52" cy="252" r="46" />
          <circle cx="118" cy="264" r="38" />
          <circle cx="1378" cy="248" r="52" />
          <circle cx="1308" cy="266" r="40" />
        </g>
        <g fill={isDark ? '#c2410c' : '#f97316'} opacity={isDark ? '0.78' : '0.82'}>
          <circle cx="92" cy="248" r="28" />
          <circle cx="1342" cy="246" r="32" />
        </g>
        <g fill={isDark ? '#ca8a04' : '#facc15'} opacity={isDark ? '0.58' : '0.72'}>
          <circle cx="164" cy="276" r="22" />
          <circle cx="1264" cy="276" r="24" />
        </g>
      </svg>
    );
  }

  if (motion === 'winter') {
    // 冬 => 雪が積もっている (Deep accumulated snowdrifts, snow-laden evergreens, icy contour shading)
    return (
      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[215px] w-full sm:h-[265px]"
      >
        <defs>
          <linearGradient id="snowBankFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#94a3b8' : '#e2e8f0'} />
            <stop offset="100%" stopColor={isDark ? '#475569' : '#cbd5e1'} />
          </linearGradient>
          <linearGradient id="snowBankMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#cbd5e1' : '#f8fafc'} />
            <stop offset="100%" stopColor={isDark ? '#64748b' : '#dbeafe'} />
          </linearGradient>
          <linearGradient id="snowBankFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#e2e8f0' : '#ffffff'} />
            <stop offset="100%" stopColor={isDark ? '#94a3b8' : '#e2e8f0'} />
          </linearGradient>
        </defs>

        {/* Distant Snowy Ridge */}
        <path
          d="M0 212 Q240 162 490 198 T1010 184 T1440 202 L1440 300 L0 300 Z"
          fill="url(#snowBankFar)"
          opacity={isDark ? '0.55' : '0.88'}
        />

        {/* Snow-Laden Evergreen Pines (Left & Right) */}
        {[
          { x: 115, y: 204, s: 1.05 },
          { x: 185, y: 222, s: 0.78 },
          { x: 1265, y: 214, s: 0.86 },
          { x: 1345, y: 198, s: 1.1 },
        ].map((tree, idx) => (
          <g key={idx} transform={`translate(${tree.x} ${tree.y}) scale(${tree.s})`}>
            <polygon
              points="0,-68 -26,-16 26,-16"
              fill={isDark ? '#1e3a4c' : '#334155'}
            />
            <polygon
              points="0,-44 -34,12 34,12"
              fill={isDark ? '#172e3d' : '#1e293b'}
            />
            <polygon
              points="0,-16 -40,44 40,44"
              fill={isDark ? '#122430' : '#334155'}
            />
            {/* Thick Snow Caps on Pine Branches */}
            <path
              d="M0,-68 L-14,-40 Q0,-34 14,-40 Z"
              fill={isDark ? '#e2e8f0' : '#ffffff'}
            />
            <path
              d="M0,-44 L-20,-18 Q0,-10 20,-18 Z"
              fill={isDark ? '#cbd5e1' : '#f8fafc'}
            />
          </g>
        ))}

        {/* Mid Snowdrift */}
        <path
          d="M0 232 Q320 190 670 230 T1440 214 L1440 300 L0 300 Z"
          fill="url(#snowBankMid)"
          opacity={isDark ? '0.82' : '0.96'}
        />

        {/* Deep Accumulated Foreground Snow Blanket */}
        <path
          d="M0 248 Q260 222 540 250 Q860 278 1180 236 Q1330 220 1440 238 L1440 300 L0 300 Z"
          fill="url(#snowBankFront)"
          opacity={isDark ? '0.92' : '1'}
        />

        {/* Crisp Snow Crest Highlight */}
        <path
          d="M0 248 Q260 222 540 250 Q860 278 1180 236 Q1330 220 1440 238"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          opacity={isDark ? '0.55' : '0.95'}
        />
      </svg>
    );
  }

  if (motion === 'space') {
    // 宇宙 => 静かな惑星の地平線 (Subtle planetary horizon curvature with delicate blue atmospheric glow)
    return (
      <svg
        viewBox="0 0 1440 220"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[150px] w-full sm:h-[190px]"
      >
        <defs>
          <radialGradient id="spaceHorizonGlow" cx="50%" cy="100%" r="72%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="720" cy="240" rx="920" ry="150" fill="url(#spaceHorizonGlow)" />
        <path
          d="M0 198 Q720 112 1440 198 L1440 220 L0 220 Z"
          fill="#030712"
          opacity="0.92"
        />
        <path
          d="M0 198 Q720 112 1440 198"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.8"
          opacity="0.45"
        />
      </svg>
    );
  }

  return null;
}

export function BackgroundMotionLayer({ motion, themeMode }: BackgroundMotionLayerProps) {
  const effectiveMotion = resolveEffectiveBackgroundMotion(motion, themeMode);
  const isDark = themeMode === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effectiveMotion === 'off') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Deterministic-feel seeded-ish initialization for each theme
    const petals: SakuraPetal[] =
      effectiveMotion === 'spring'
        ? Array.from({ length: 44 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 4.5 + Math.random() * 5.5,
            vx: 14 + Math.random() * 20,
            vy: 20 + Math.random() * 26,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 1.4,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 1.1 + Math.random() * 1.1,
            flipPhase: Math.random() * Math.PI * 2,
            flipSpeed: 1.5 + Math.random() * 1.8,
            colorIdx: Math.floor(Math.random() * 3),
            alpha: (isDark ? 0.52 : 0.68) + Math.random() * 0.3,
          }))
        : [];

    const clouds: SummerCloud[] =
      effectiveMotion === 'summer'
        ? Array.from({ length: 7 }, (_, i) => ({
            x: (width / 6) * i + Math.random() * 120 - 80,
            y: 72 + (i % 3) * 68 + Math.random() * 35,
            scale: 0.72 + (i % 3) * 0.28 + Math.random() * 0.15,
            speed: 5 + (i % 3) * 3.5 + Math.random() * 2.5,
            alpha: isDark ? 0.42 + (i % 2) * 0.14 : 0.78 + (i % 2) * 0.16,
            variant: i,
          }))
        : [];

    const sparkles: SeaSparkle[] =
      effectiveMotion === 'summer'
        ? Array.from({ length: 24 }, () => ({
            x: Math.random() * width,
            yRatio: 0.78 + Math.random() * 0.16,
            phase: Math.random() * Math.PI * 2,
            speed: 1.6 + Math.random() * 2.2,
            size: 1.5 + Math.random() * 2.2,
          }))
        : [];

    const leaves: AutumnLeaf[] =
      effectiveMotion === 'autumn'
        ? Array.from({ length: 38 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 6.5 + Math.random() * 6.5,
            vx: -10 + Math.random() * 26,
            vy: 24 + Math.random() * 28,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 1.6,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 1.0 + Math.random() * 1.2,
            flipPhase: Math.random() * Math.PI * 2,
            colorIdx: Math.floor(Math.random() * 4),
            alpha: (isDark ? 0.62 : 0.76) + Math.random() * 0.22,
          }))
        : [];

    const flakes: Snowflake[] =
      effectiveMotion === 'winter'
        ? Array.from({ length: 68 }, () => {
            const depth = Math.random();
            return {
              x: Math.random() * width,
              y: Math.random() * height,
              r: 1.6 + depth * 3.4,
              vx: -6 + Math.random() * 14,
              vy: 18 + depth * 34,
              swayPhase: Math.random() * Math.PI * 2,
              swaySpeed: 0.7 + Math.random() * 1.1,
              alpha: (isDark ? 0.42 : 0.56) + depth * 0.42,
              isCrystal: depth > 0.76,
            };
          })
        : [];

    const starColors = ['#ffffff', '#e0f2fe', '#fef3c7', '#ddd6fe'];
    const stars: StarPoint[] =
      effectiveMotion === 'space'
        ? Array.from({ length: 140 }, () => ({
            x: Math.random() * width,
            y: Math.random() * (height * 0.88),
            r: 0.7 + Math.random() * 1.8,
            phase: Math.random() * Math.PI * 2,
            speed: 0.8 + Math.random() * 2.2,
            baseAlpha: 0.28 + Math.random() * 0.68,
            color: starColors[Math.floor(Math.random() * starColors.length)],
          }))
        : [];

    const shootingStars: ShootingStar[] = [];
    let shootCooldown = 2.2;

    const sakuraColors = isDark
      ? ['#fbcfe8', '#f9a8d4', '#fce7f3']
      : ['#f472b6', '#f9a8d4', '#fda4af'];
    const autumnColors = isDark
      ? ['#ef4444', '#f97316', '#f59e0b', '#dc2626']
      : ['#dc2626', '#ea580c', '#d97706', '#b91c1c'];

    let rafId = 0;
    let lastTs = performance.now();

    const renderFrame = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
      lastTs = ts;

      ctx.clearRect(0, 0, width, height);

      if (effectiveMotion === 'spring') {
        for (const p of petals) {
          if (!prefersReducedMotion) {
            p.swayPhase += p.swaySpeed * dt;
            p.flipPhase += p.flipSpeed * dt;
            p.angle += p.spin * dt;
            p.x += (p.vx + Math.sin(p.swayPhase) * 16) * dt;
            p.y += p.vy * dt;
            if (p.y > height + 20) {
              p.y = -18;
              p.x = Math.random() * width;
            }
            if (p.x > width + 24) p.x = -20;
            if (p.x < -24) p.x = width + 20;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.cos(p.flipPhase)));
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = sakuraColors[p.colorIdx];
          drawSakuraPetal(ctx, p.size);
          ctx.restore();
        }
      } else if (effectiveMotion === 'summer') {
        // Slowly drifting summer clouds
        for (const c of clouds) {
          if (!prefersReducedMotion) {
            c.x += c.speed * dt;
            if (c.x > width + 180 * c.scale) {
              c.x = -180 * c.scale;
            }
          }
          drawSummerCloud(ctx, c.x, c.y, c.scale, isDark, c.alpha, c.variant);
        }
        // Subtle water surface glints
        for (const sp of sparkles) {
          if (!prefersReducedMotion) {
            sp.phase += sp.speed * dt;
          }
          const a = 0.15 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(sp.phase), 3);
          ctx.save();
          ctx.globalAlpha = a * (isDark ? 0.55 : 0.72);
          ctx.fillStyle = isDark ? '#bae6fd' : '#fef9c3';
          ctx.beginPath();
          ctx.ellipse(sp.x, height * sp.yRatio, sp.size * 3.4, sp.size * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (effectiveMotion === 'autumn') {
        for (const lf of leaves) {
          if (!prefersReducedMotion) {
            lf.swayPhase += lf.swaySpeed * dt;
            lf.flipPhase += 1.4 * dt;
            lf.angle += lf.spin * dt;
            lf.x += (lf.vx + Math.sin(lf.swayPhase) * 22) * dt;
            lf.y += lf.vy * dt;
            if (lf.y > height + 24) {
              lf.y = -20;
              lf.x = Math.random() * width;
            }
            if (lf.x > width + 24) lf.x = -20;
            if (lf.x < -24) lf.x = width + 20;
          }
          ctx.save();
          ctx.translate(lf.x, lf.y);
          ctx.rotate(lf.angle);
          ctx.scale(1, 0.52 + 0.48 * Math.abs(Math.cos(lf.flipPhase)));
          ctx.globalAlpha = lf.alpha;
          ctx.fillStyle = autumnColors[lf.colorIdx];
          drawMapleLeaf(ctx, lf.size);
          ctx.restore();
        }
      } else if (effectiveMotion === 'winter') {
        for (const f of flakes) {
          if (!prefersReducedMotion) {
            f.swayPhase += f.swaySpeed * dt;
            f.x += (f.vx + Math.sin(f.swayPhase) * 14) * dt;
            f.y += f.vy * dt;
            if (f.y > height + 16) {
              f.y = -12;
              f.x = Math.random() * width;
            }
            if (f.x > width + 16) f.x = -12;
            if (f.x < -16) f.x = width + 12;
          }
          ctx.save();
          ctx.globalAlpha = f.alpha;
          if (f.isCrystal) {
            ctx.strokeStyle = isDark ? '#e0f2fe' : '#64748b';
            ctx.lineWidth = 1;
            for (let k = 0; k < 3; k++) {
              const rad = (k * Math.PI) / 3;
              ctx.beginPath();
              ctx.moveTo(f.x - Math.cos(rad) * f.r, f.y - Math.sin(rad) * f.r);
              ctx.lineTo(f.x + Math.cos(rad) * f.r, f.y + Math.sin(rad) * f.r);
              ctx.stroke();
            }
          } else {
            ctx.fillStyle = isDark ? '#f8fafc' : '#ffffff';
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fill();
            if (!isDark) {
              ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      } else if (effectiveMotion === 'space') {
        // Twinkling starfield
        for (const st of stars) {
          if (!prefersReducedMotion) {
            st.phase += st.speed * dt;
          }
          const twinkle = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(st.phase));
          ctx.save();
          ctx.globalAlpha = st.baseAlpha * twinkle;
          ctx.fillStyle = st.color;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Occasional quiet shooting stars
        if (!prefersReducedMotion) {
          shootCooldown -= dt;
          if (shootCooldown <= 0 && shootingStars.length < 2) {
            shootingStars.push({
              x: width * (0.2 + Math.random() * 0.7),
              y: height * (0.05 + Math.random() * 0.3),
              vx: -280 - Math.random() * 140,
              vy: 140 + Math.random() * 90,
              len: 85 + Math.random() * 65,
              life: 0,
              maxLife: 0.75 + Math.random() * 0.4,
            });
            shootCooldown = 3.2 + Math.random() * 4.5;
          }

          for (let i = shootingStars.length - 1; i >= 0; i--) {
            const ss = shootingStars[i];
            ss.life += dt;
            ss.x += ss.vx * dt;
            ss.y += ss.vy * dt;
            const progress = ss.life / ss.maxLife;
            if (progress >= 1) {
              shootingStars.splice(i, 1);
              continue;
            }
            const alpha = Math.sin(progress * Math.PI) * 0.85;
            const speedMag = Math.hypot(ss.vx, ss.vy) || 1;
            const tailX = ss.x - (ss.vx / speedMag) * ss.len;
            const tailY = ss.y - (ss.vy / speedMag) * ss.len;

            const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(0.35, `rgba(186, 230, 253, ${alpha * 0.65})`);
            grad.addColorStop(1, 'rgba(186, 230, 253, 0)');

            ctx.save();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!prefersReducedMotion && !rafId) {
        lastTs = performance.now();
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [effectiveMotion, isDark]);

  if (effectiveMotion === 'off') {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="background-motion-layer"
      data-motion={effectiveMotion}
      data-theme-mode={themeMode}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none transition-colors duration-500"
      style={{ background: getSkyBackgroundStyle(effectiveMotion, isDark) }}
    >
      <GroundScenery motion={effectiveMotion} isDark={isDark} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
