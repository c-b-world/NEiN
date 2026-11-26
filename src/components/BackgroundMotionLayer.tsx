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
  depth: number;
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

interface AmbientMote {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  baseAlpha: number;
  color: string;
}

interface SummerCloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
  variant: number;
  depth: number;
}

interface SeaSparkle {
  xRatio: number;
  yRatio: number;
  phase: number;
  speed: number;
  size: number;
  inColumn: boolean;
}

interface AutumnLeaf {
  x: number;
  y: number;
  size: number;
  depth: number;
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

interface Snowflake {
  x: number;
  y: number;
  r: number;
  depth: number;
  vx: number;
  vy: number;
  swayPhase: number;
  swaySpeed: number;
  angle: number;
  spin: number;
  alpha: number;
  kind: 'bokeh' | 'powder' | 'crystal';
}

interface StarPoint {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  baseAlpha: number;
  color: string;
  hasSpikes: boolean;
  halo: boolean;
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

function drawSakuraPetal(
  ctx: CanvasRenderingContext2D,
  size: number,
  topColor: string,
  baseColor: string,
  softBlur: boolean,
) {
  const grad = ctx.createRadialGradient(0, size * 0.25, size * 0.1, 0, -size * 0.15, size * 1.25);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(0.65, topColor);
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.92)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Authentic Japanese cherry blossom petal with notched cleft tip and tapered base
  ctx.moveTo(0, size * 0.95);
  ctx.bezierCurveTo(size * 0.72, size * 0.56, size * 0.92, -size * 0.22, size * 0.42, -size * 0.92);
  ctx.quadraticCurveTo(size * 0.16, -size * 1.0, 0, -size * 0.64);
  ctx.quadraticCurveTo(-size * 0.16, -size * 1.0, -size * 0.42, -size * 0.92);
  ctx.bezierCurveTo(-size * 0.92, -size * 0.22, -size * 0.72, size * 0.56, 0, size * 0.95);
  ctx.closePath();
  ctx.fill();

  if (!softBlur && size >= 5.5) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.72);
    ctx.quadraticCurveTo(size * 0.08, 0, 0, -size * 0.52);
    ctx.stroke();
  }
}

function drawMapleLeaf(
  ctx: CanvasRenderingContext2D,
  s: number,
  outerColor: string,
  innerColor: string,
) {
  const grad = ctx.createRadialGradient(0, s * 0.12, s * 0.1, 0, -s * 0.1, s * 1.3);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.75, outerColor);
  grad.addColorStop(1, outerColor);

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Graceful 7-lobed Japanese Momiji (いろはもみじ) silhouette
  ctx.moveTo(0, s * 0.58);
  // Lower right lobe
  ctx.lineTo(s * 0.28, s * 0.62);
  ctx.lineTo(s * 0.76, s * 0.44);
  ctx.lineTo(s * 0.44, s * 0.22);
  // Mid right lobe
  ctx.lineTo(s * 1.08, -s * 0.08);
  ctx.lineTo(s * 0.52, -s * 0.16);
  // Upper right lobe
  ctx.lineTo(s * 0.84, -s * 0.72);
  ctx.lineTo(s * 0.26, -s * 0.44);
  // Central apex lobe
  ctx.lineTo(0, -s * 1.24);
  // Upper left lobe
  ctx.lineTo(-s * 0.26, -s * 0.44);
  ctx.lineTo(-s * 0.84, -s * 0.72);
  // Mid left lobe
  ctx.lineTo(-s * 0.52, -s * 0.16);
  ctx.lineTo(-s * 1.08, -s * 0.08);
  // Lower left lobe
  ctx.lineTo(-s * 0.44, s * 0.22);
  ctx.lineTo(-s * 0.76, s * 0.44);
  ctx.lineTo(-s * 0.28, s * 0.62);
  ctx.closePath();
  ctx.fill();

  // Delicate stem & fine veins
  ctx.strokeStyle = 'rgba(255, 240, 215, 0.36)';
  ctx.lineWidth = Math.max(0.55, s * 0.075);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.98);
  ctx.lineTo(0, -s * 0.85);
  ctx.moveTo(0, s * 0.25);
  ctx.lineTo(s * 0.62, -s * 0.04);
  ctx.moveTo(0, s * 0.25);
  ctx.lineTo(-s * 0.62, -s * 0.04);
  ctx.stroke();
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

  // Painterly multi-tiered cumulus / 入道雲 silhouette
  const puffs =
    variant % 3 === 0
      ? [
          { cx: -92, cy: 20, rx: 32, ry: 18 },
          { cx: -60, cy: 10, rx: 40, ry: 28 },
          { cx: -24, cy: -8, rx: 46, ry: 38 },
          { cx: 18, cy: -22, rx: 52, ry: 44 },
          { cx: 60, cy: -4, rx: 44, ry: 34 },
          { cx: 94, cy: 14, rx: 36, ry: 22 },
          { cx: 120, cy: 22, rx: 24, ry: 14 },
          { cx: 0, cy: 18, rx: 88, ry: 20 },
        ]
      : variant % 3 === 1
        ? [
            { cx: -74, cy: 16, rx: 34, ry: 19 },
            { cx: -36, cy: -4, rx: 42, ry: 34 },
            { cx: 10, cy: -14, rx: 48, ry: 40 },
            { cx: 52, cy: 2, rx: 40, ry: 28 },
            { cx: 84, cy: 16, rx: 30, ry: 17 },
            { cx: 4, cy: 16, rx: 72, ry: 18 },
          ]
        : [
            { cx: -58, cy: 14, rx: 30, ry: 16 },
            { cx: -16, cy: -2, rx: 40, ry: 28 },
            { cx: 28, cy: 2, rx: 36, ry: 24 },
            { cx: 64, cy: 14, rx: 26, ry: 14 },
            { cx: 4, cy: 15, rx: 58, ry: 14 },
          ];

  // 1. Soft atmospheric under-shadow belly
  const shadowGrad = ctx.createLinearGradient(0, -10, 0, 40);
  if (isDark) {
    shadowGrad.addColorStop(0, 'rgba(26, 48, 86, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(12, 26, 52, 0.56)');
  } else {
    shadowGrad.addColorStop(0, 'rgba(134, 184, 224, 0.36)');
    shadowGrad.addColorStop(1, 'rgba(104, 159, 208, 0.56)');
  }
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  for (const p of puffs) {
    ctx.moveTo(p.cx + p.rx, p.cy + 7);
    ctx.ellipse(p.cx, p.cy + 7, p.rx * 0.98, p.ry * 0.92, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // 2. Main volumetric cloud mass
  const bodyGrad = ctx.createLinearGradient(14, -64, -10, 32);
  if (isDark) {
    bodyGrad.addColorStop(0, 'rgba(205, 228, 255, 0.34)');
    bodyGrad.addColorStop(0.45, 'rgba(116, 155, 208, 0.28)');
    bodyGrad.addColorStop(0.85, 'rgba(54, 86, 134, 0.25)');
    bodyGrad.addColorStop(1, 'rgba(32, 56, 98, 0.22)');
  } else {
    bodyGrad.addColorStop(0, 'rgba(255, 255, 252, 0.98)');
    bodyGrad.addColorStop(0.48, 'rgba(244, 250, 255, 0.94)');
    bodyGrad.addColorStop(0.82, 'rgba(216, 236, 252, 0.86)');
    bodyGrad.addColorStop(1, 'rgba(182, 214, 242, 0.76)');
  }
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  for (const p of puffs) {
    ctx.moveTo(p.cx + p.rx, p.cy);
    ctx.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // 3. Bright sunlit / moonlit crown highlights along upper-right puffs
  const crownGrad = ctx.createRadialGradient(24, -34, 4, 14, -16, 86);
  if (isDark) {
    crownGrad.addColorStop(0, 'rgba(232, 244, 255, 0.42)');
    crownGrad.addColorStop(0.6, 'rgba(186, 218, 255, 0.14)');
    crownGrad.addColorStop(1, 'rgba(186, 218, 255, 0)');
  } else {
    crownGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    crownGrad.addColorStop(0.55, 'rgba(255, 253, 242, 0.48)');
    crownGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  }
  ctx.fillStyle = crownGrad;
  ctx.beginPath();
  for (let i = 1; i < Math.min(5, puffs.length); i++) {
    const p = puffs[i];
    ctx.moveTo(p.cx + p.rx * 0.72, p.cy - 5);
    ctx.ellipse(p.cx + 3, p.cy - 5, p.rx * 0.72, p.ry * 0.68, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.restore();
}

function drawSnowCrystal(ctx: CanvasRenderingContext2D, r: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.75, r * 0.17);
  ctx.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const ang = (k * Math.PI) / 3;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cos * r, sin * r);
    // Tiny dendritic side barbs
    const bx = cos * r * 0.56;
    const by = sin * r * 0.56;
    const barb = r * 0.34;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(ang + 0.68) * barb, by + Math.sin(ang + 0.68) * barb);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(ang - 0.68) * barb, by + Math.sin(ang - 0.68) * barb);
    ctx.stroke();
  }
}

function getSkyBackgroundStyle(motion: BackgroundMotionId, isDark: boolean): string {
  switch (motion) {
    case 'spring':
      return isDark
        ? 'radial-gradient(circle at 80% 17%, rgba(254, 243, 199, 0.22) 0%, rgba(244, 165, 200, 0.14) 16%, transparent 44%), radial-gradient(ellipse at 24% 78%, rgba(244, 114, 182, 0.12) 0%, transparent 50%), linear-gradient(180deg, #060916 0%, #101228 38%, #211733 70%, #2a1d36 88%, #182321 100%)'
        : 'radial-gradient(circle at 79% 15%, rgba(255, 253, 236, 0.96) 0%, rgba(254, 240, 210, 0.45) 18%, transparent 46%), radial-gradient(ellipse at 25% 78%, rgba(251, 207, 232, 0.48) 0%, transparent 52%), linear-gradient(180deg, #a7d8fa 0%, #d4ecff 34%, #eef6ff 62%, #fdf0f7 85%, #fce4f0 100%)';
    case 'summer':
      return isDark
        ? 'radial-gradient(circle at 76% 17%, rgba(240, 249, 255, 0.30) 0%, rgba(125, 211, 252, 0.14) 15%, transparent 42%), linear-gradient(180deg, #030816 0%, #07152c 42%, #0c2345 74%, #103259 100%)'
        : 'radial-gradient(circle at 78% 15%, rgba(255, 253, 224, 0.98) 0%, rgba(254, 243, 172, 0.45) 14%, rgba(186, 230, 253, 0.25) 34%, transparent 52%), linear-gradient(180deg, #2788df 0%, #58b0f2 36%, #99d6fb 68%, #daf2ff 90%, #c8ecff 100%)';
    case 'autumn':
      return isDark
        ? 'radial-gradient(circle at 22% 18%, rgba(253, 186, 116, 0.26) 0%, rgba(234, 88, 12, 0.14) 18%, transparent 46%), radial-gradient(ellipse at 68% 72%, rgba(185, 28, 28, 0.18) 0%, transparent 54%), linear-gradient(180deg, #0c0710 0%, #1d0e17 38%, #38171c 70%, #4d1f1b 88%, #2e1310 100%)'
        : 'radial-gradient(circle at 22% 17%, rgba(255, 249, 224, 0.96) 0%, rgba(253, 186, 116, 0.52) 19%, transparent 48%), radial-gradient(ellipse at 72% 76%, rgba(251, 146, 60, 0.28) 0%, transparent 52%), linear-gradient(180deg, #fcefd6 0%, #feddb8 38%, #fdc793 68%, #f8a86f 88%, #ee8e5c 100%)';
    case 'winter':
      return isDark
        ? 'radial-gradient(circle at 52% 14%, rgba(186, 230, 253, 0.14) 0%, transparent 46%), radial-gradient(ellipse at 32% 30%, rgba(45, 212, 191, 0.08) 0%, transparent 50%), linear-gradient(180deg, #040814 0%, #091428 42%, #132542 74%, #1f3659 100%)'
        : 'radial-gradient(circle at 52% 14%, rgba(255, 255, 255, 0.96) 0%, rgba(224, 242, 254, 0.55) 26%, transparent 54%), linear-gradient(180deg, #aec4db 0%, #cfe0f0 38%, #e6f0f9 70%, #f5f9fe 100%)';
    case 'space':
      return 'radial-gradient(ellipse at 22% 24%, rgba(79, 70, 229, 0.18) 0%, transparent 52%), radial-gradient(ellipse at 74% 38%, rgba(14, 165, 233, 0.14) 0%, transparent 48%), radial-gradient(ellipse at 52% 18%, rgba(168, 85, 247, 0.11) 0%, transparent 46%), linear-gradient(180deg, #02040c 0%, #040919 46%, #09132e 78%, #0e1c42 100%)';
    default:
      return 'none';
  }
}

function CelestialSkyAccents({ motion, isDark }: { motion: BackgroundMotionId; isDark: boolean }) {
  if (motion === 'spring') {
    return (
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[55%] w-full"
      >
        <defs>
          <radialGradient id="springMoonAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isDark ? '#fef9c3' : '#fffef2'} stopOpacity={isDark ? '0.68' : '0.96'} />
            <stop offset="28%" stopColor={isDark ? '#fde68a' : '#fef3c7'} stopOpacity={isDark ? '0.26' : '0.45'} />
            <stop offset="100%" stopColor={isDark ? '#f472b6' : '#fde68a'} stopOpacity="0" />
          </radialGradient>
          <mask id="springCrescentMask">
            <rect x="-40" y="-40" width="80" height="80" fill="white" />
            <circle cx="-9" cy="-5" r="20" fill="black" />
          </mask>
          <linearGradient id="springSunRay" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#fffef5" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#fffef5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="1145" cy="96" r="115" fill="url(#springMoonAura)" />
        {isDark ? (
          <g transform="translate(1145 96)">
            <circle cx="0" cy="0" r="23" fill="#fef9c3" opacity="0.95" mask="url(#springCrescentMask)" />
          </g>
        ) : (
          <g opacity="0.65">
            <polygon points="1110,92 1178,92 940,510 780,510" fill="url(#springSunRay)" />
            <polygon points="1135,96 1192,96 1120,510 1005,510" fill="url(#springSunRay)" />
          </g>
        )}
      </svg>
    );
  }

  if (motion === 'summer') {
    return (
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[56%] w-full"
      >
        <defs>
          <radialGradient id="summerOrbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isDark ? '#f8fafc' : '#fffef0'} stopOpacity="0.96" />
            <stop offset="26%" stopColor={isDark ? '#bae6fd' : '#fef08a'} stopOpacity={isDark ? '0.42' : '0.58'} />
            <stop offset="60%" stopColor={isDark ? '#38bdf8' : '#fde047'} stopOpacity={isDark ? '0.14' : '0.18'} />
            <stop offset="100%" stopColor={isDark ? '#0284c7' : '#fef9c3'} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="1115" cy="96" r="135" fill="url(#summerOrbGlow)" />
        <circle
          cx="1115"
          cy="96"
          r={isDark ? '24' : '27'}
          fill={isDark ? '#f1f5f9' : '#fffdf2'}
          opacity={isDark ? '0.94' : '0.95'}
        />
        {isDark && (
          <g fill="#cbd5e1" opacity="0.22">
            <circle cx="1108" cy="90" r="6" />
            <circle cx="1123" cy="102" r="4.5" />
            <circle cx="1118" cy="87" r="3" />
          </g>
        )}
      </svg>
    );
  }

  if (motion === 'autumn') {
    return (
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[56%] w-full"
      >
        <defs>
          <radialGradient id="autumnOrbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isDark ? '#fef3c7' : '#fffbeb'} stopOpacity="0.95" />
            <stop offset="30%" stopColor={isDark ? '#fb923c' : '#fdba74'} stopOpacity={isDark ? '0.34' : '0.52'} />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="318" cy="108" r="135" fill="url(#autumnOrbGlow)" />
        <circle
          cx="318"
          cy="108"
          r={isDark ? '23' : '28'}
          fill={isDark ? '#fde68a' : '#fffbeb'}
          opacity={isDark ? '0.90' : '0.94'}
        />
      </svg>
    );
  }

  if (motion === 'winter' && isDark) {
    return (
      <svg
        viewBox="0 0 1440 460"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[58%] w-full"
      >
        <defs>
          <linearGradient id="winterAuroraA" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
            <stop offset="28%" stopColor="#2dd4bf" stopOpacity="0.22" />
            <stop offset="56%" stopColor="#38bdf8" stopOpacity="0.24" />
            <stop offset="82%" stopColor="#818cf8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="winterAuroraB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="40%" stopColor="#5eead4" stopOpacity="0.16" />
            <stop offset="72%" stopColor="#60a5fa" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <filter id="winterAuroraBlur" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <g filter="url(#winterAuroraBlur)" className="nein-aurora-ribbon">
          <path
            d="M-60 175 C210 92, 460 220, 740 132 C1020 44, 1210 156, 1500 98 L1500 185 C1210 232, 1020 146, 740 215 C460 284, 210 188, -60 245 Z"
            fill="url(#winterAuroraA)"
          />
          <path
            d="M40 225 C340 155, 620 260, 920 174 C1140 112, 1300 182, 1480 145 L1480 218 C1280 252, 1120 198, 900 244 C620 302, 340 228, 40 278 Z"
            fill="url(#winterAuroraB)"
          />
        </g>
      </svg>
    );
  }

  if (motion === 'space') {
    return (
      <svg
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="milkyWayCore" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="22%" stopColor="#6366f1" stopOpacity="0.16" />
            <stop offset="48%" stopColor="#93c5fd" stopOpacity="0.22" />
            <stop offset="72%" stopColor="#a855f7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="nebulaTeal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.14" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebulaViolet" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.15" />
            <stop offset="55%" stopColor="#4f46e5" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <filter id="nebulaSoftBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="38" />
          </filter>
        </defs>
        <g filter="url(#nebulaSoftBlur)">
          {/* Diagonal Milky Way river of stardust */}
          <path
            d="M-120 620 C240 460, 560 350, 880 210 C1120 105, 1320 45, 1560 -40 L1560 110 C1300 205, 1080 280, 840 385 C540 515, 220 610, -120 740 Z"
            fill="url(#milkyWayCore)"
          />
          <ellipse cx="420" cy="410" rx="280" ry="130" transform="rotate(-24 420 410)" fill="url(#nebulaViolet)" />
          <ellipse cx="990" cy="240" rx="260" ry="115" transform="rotate(-20 990 240)" fill="url(#nebulaTeal)" />
        </g>
      </svg>
    );
  }

  return null;
}

function GroundScenery({ motion, isDark }: { motion: BackgroundMotionId; isDark: boolean }) {
  if (motion === 'spring') {
    // 春 => 桜の咲く公園 (Painterly cherry blossom park, stone-lined path, wrought bench, glowing lantern, multi-layered sakura trees)
    return (
      <svg
        viewBox="0 0 1440 340"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[245px] w-full sm:h-[310px]"
      >
        <defs>
          <linearGradient id="springMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#f472b6' : '#ffffff'} stopOpacity="0" />
            <stop offset="55%" stopColor={isDark ? '#4c1d4f' : '#fce7f3'} stopOpacity={isDark ? '0.32' : '0.68'} />
            <stop offset="100%" stopColor={isDark ? '#1a2725' : '#dcfce7'} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="springGroveFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#54264f' : '#f9a8d4'} stopOpacity={isDark ? '0.65' : '0.72'} />
            <stop offset="100%" stopColor={isDark ? '#241a33' : '#fbcfe8'} stopOpacity={isDark ? '0.78' : '0.84'} />
          </linearGradient>
          <linearGradient id="springHillMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1e3a32' : '#86efac'} />
            <stop offset="58%" stopColor={isDark ? '#152b26' : '#4ade80'} />
            <stop offset="100%" stopColor={isDark ? '#0e1d1a' : '#22c55e'} />
          </linearGradient>
          <linearGradient id="springHillNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1c3b2f' : '#4ade80'} />
            <stop offset="48%" stopColor={isDark ? '#122921' : '#22c55e'} />
            <stop offset="100%" stopColor={isDark ? '#0a1813' : '#15803d'} />
          </linearGradient>
          <linearGradient id="springPathGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#3a3c4a' : '#fef9e7'} stopOpacity="0.88" />
            <stop offset="100%" stopColor={isDark ? '#232833' : '#f3e5c3'} stopOpacity="0.94" />
          </linearGradient>
          <linearGradient id="springBark" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isDark ? '#1d141a' : '#4a2e25'} />
            <stop offset="55%" stopColor={isDark ? '#32222b' : '#6f483a'} />
            <stop offset="100%" stopColor={isDark ? '#1a1117' : '#3d251e'} />
          </linearGradient>
          <radialGradient id="springLampHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity={isDark ? '0.76' : '0.24'} />
            <stop offset="38%" stopColor="#fcd34d" stopOpacity={isDark ? '0.32' : '0.08'} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="springLampCone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <filter id="springSoftBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Distant Misty Cherry Blossom Grove Silhouette */}
        <path
          d="M0 240 C65 204, 130 214, 190 198 C255 182, 315 212, 385 196 C455 180, 520 202, 595 192 C670 182, 745 204, 825 188 C905 174, 985 206, 1060 190 C1140 172, 1220 198, 1300 184 C1365 172, 1408 188, 1440 196 L1440 340 L0 340 Z"
          fill="url(#springGroveFar)"
        />

        {/* Soft Horizon Atmospheric Haze */}
        <rect x="0" y="182" width="1440" height="74" fill="url(#springMist)" filter="url(#springSoftBlur)" />

        {/* Distant Small Park Sakura Trees on Horizon */}
        {[
          { x: 545, y: 224, s: 0.42 },
          { x: 910, y: 218, s: 0.48 },
        ].map((t, i) => (
          <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`} opacity={isDark ? '0.78' : '0.86'}>
            <path d="M-5 24 C-4 0, -2 -18, 2 -40 C12 -22, 8 4, 8 24 Z" fill={isDark ? '#2a1c24' : '#6d473a'} />
            <path
              d="M-54 -44 C-64 -68, -32 -88, -8 -78 C8 -96, 44 -86, 48 -62 C70 -54, 64 -24, 38 -22 C24 -12, -22 -14, -36 -24 C-60 -22, -66 -38, -54 -44 Z"
              fill={isDark ? '#d9699e' : '#fbcfe8'}
            />
            <path
              d="M-38 -56 C-42 -72, -16 -82, 2 -74 C16 -84, 38 -74, 34 -56 C16 -46, -24 -46, -38 -56 Z"
              fill={isDark ? '#fbcfe8' : '#fff5f8'}
              opacity="0.65"
            />
          </g>
        ))}

        {/* Mid Park Rolling Meadow */}
        <path
          d="M0 250 Q280 206 590 236 T1190 228 Q1330 220 1440 230 L1440 340 L0 340 Z"
          fill="url(#springHillMid)"
        />
        {/* Sunlit / Moonlit Meadow Crest Rim */}
        <path
          d="M0 250 Q280 206 590 236 T1190 228 Q1330 220 1440 230"
          fill="none"
          stroke={isDark ? '#6ee7b7' : '#dcfce7'}
          strokeWidth="1.5"
          opacity={isDark ? '0.18' : '0.7'}
        />

        {/* Foreground Park Lawn */}
        <path
          d="M0 274 Q360 242 740 270 T1440 258 L1440 340 L0 340 Z"
          fill="url(#springHillNear)"
        />

        {/* Winding Stone-Trimmed Park Promenade */}
        <path
          d="M476 340 C558 296, 650 268, 738 248 C786 237, 834 231, 876 229 L908 231 C846 244, 782 272, 720 340 Z"
          fill="url(#springPathGrad)"
        />
        <path
          d="M476 340 C558 296, 650 268, 738 248 C786 237, 834 231, 876 229"
          fill="none"
          stroke={isDark ? '#475569' : '#d6c7a9'}
          strokeWidth="2.2"
          strokeDasharray="10 5"
          opacity="0.62"
        />
        <path
          d="M720 340 C782 272, 846 244, 908 231"
          fill="none"
          stroke={isDark ? '#475569' : '#d6c7a9'}
          strokeWidth="2.2"
          strokeDasharray="10 5"
          opacity="0.56"
        />

        {/* Classic Japanese Park Lantern Post */}
        <g transform="translate(415 178)">
          {isDark && (
            <>
              <polygon points="4,22 -54,118 62,118" fill="url(#springLampCone)" className="nein-lantern-glow" />
              <ellipse cx="4" cy="116" rx="54" ry="12" fill="#fde68a" opacity="0.14" />
              <circle cx="4" cy="16" r="64" fill="url(#springLampHalo)" className="nein-lantern-glow" />
            </>
          )}
          <rect x="2" y="24" width="4.5" height="90" rx="1.5" fill={isDark ? '#1e293b' : '#475569'} />
          <rect x="-2" y="108" width="12.5" height="7" rx="2" fill={isDark ? '#0f172a' : '#334155'} />
          <path d="M-5 24 L13 24 L10 10 L-2 10 Z" fill={isDark ? '#fef08a' : '#fffbeb'} stroke={isDark ? '#334155' : '#64748b'} strokeWidth="1.4" />
          <path d="M-8 10 L16 10 L4 0 Z" fill={isDark ? '#1e293b' : '#475569'} />
          <circle cx="4" cy="-1.5" r="2" fill={isDark ? '#334155' : '#64748b'} />
        </g>

        {/* Detailed Slatted Wooden Park Bench with Soft Cast Shadow */}
        <g transform="translate(972 252)">
          <ellipse cx="38" cy="42" rx="44" ry="7" fill={isDark ? '#05110d' : '#14532d'} opacity={isDark ? '0.58' : '0.28'} />
          <rect x="3" y="8" width="70" height="5.5" rx="2" fill={isDark ? '#543a2e' : '#a16207'} />
          <rect x="3" y="16" width="70" height="5.5" rx="2" fill={isDark ? '#664637' : '#ca8a04'} />
          <rect x="0" y="25" width="76" height="5.5" rx="2" fill={isDark ? '#463026' : '#854d0e'} />
          {/* Curved wrought-iron side frames */}
          <path
            d="M10 7 L10 41 M66 7 L66 41 M5 24 Q10 18 15 24 M61 24 Q66 18 71 24"
            stroke={isDark ? '#1e293b' : '#334155'}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Hero Left Cherry Blossom Tree — Sculpted Trunk + 5-Layer Scalloped Blossom Canopy */}
        <g transform="translate(112 296)">
          <ellipse cx="4" cy="24" rx="74" ry="12" fill={isDark ? '#06110e' : '#14532d'} opacity={isDark ? '0.5' : '0.22'} />
          {/* Gnarled multi-branched trunk */}
          <path
            d="M-20 26 C-14 -16, -8 -66, -2 -118 C-28 -134, -56 -144, -84 -158 C-52 -152, -24 -144, 4 -128 C12 -152, 20 -174, 30 -196 C26 -166, 22 -140, 18 -114 C46 -130, 74 -142, 108 -150 C76 -132, 48 -116, 20 -94 C16 -52, 18 -12, 24 26 Z"
            fill="url(#springBark)"
          />
          <path
            d="M-4 -102 C-42 -112, -74 -120, -104 -128 M18 -98 C54 -102, 86 -108, 118 -116"
            stroke={isDark ? '#281b22' : '#57362b'}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Layer 1: Deep Shadow Underside Blossoms */}
          <path
            d="M-126 -112 C-142 -146, -108 -182, -72 -174 C-56 -212, 6 -222, 40 -192 C78 -204, 126 -178, 124 -140 C152 -128, 146 -86, 108 -82 C92 -64, 46 -64, 24 -78 C-10 -62, -62 -66, -84 -86 C-118 -82, -138 -96, -126 -112 Z"
            fill={isDark ? '#702459' : '#f472b6'}
            opacity={isDark ? '0.68' : '0.46'}
          />
          {/* Layer 2: Rich Mid Sakura Canopy */}
          <path
            d="M-118 -126 C-132 -162, -92 -196, -56 -184 C-38 -228, 22 -236, 52 -202 C92 -214, 134 -182, 124 -144 C146 -126, 132 -90, 96 -92 C74 -76, 36 -80, 18 -96 C-14 -82, -56 -88, -76 -106 C-106 -102, -126 -114, -118 -126 Z"
            fill={isDark ? '#d969a6' : '#f9a8d4'}
            opacity={isDark ? '0.84' : '0.92'}
          />
          {/* Layer 3: Soft Luminous Blush Clouds */}
          <path
            d="M-98 -144 C-104 -176, -66 -202, -34 -190 C-14 -224, 38 -224, 58 -194 C90 -198, 114 -168, 96 -140 C76 -124, 36 -126, 16 -138 C-12 -124, -56 -128, -74 -142 Z"
            fill={isDark ? '#f9a8d4' : '#fce7f3'}
            opacity={isDark ? '0.78' : '0.94'}
          />
          {/* Layer 4: Backlit Sun/Moon Rim Highlights */}
          <path
            d="M-44 -192 C-24 -216, 22 -218, 44 -196 C66 -196, 86 -174, 72 -156 C52 -164, 24 -170, 2 -164 C-22 -170, -48 -174, -44 -192 Z"
            fill={isDark ? '#fdf2f8' : '#ffffff'}
            opacity={isDark ? '0.62' : '0.82'}
          />
          {/* Layer 5: Floating Outlying Blossom Sprigs */}
          <g fill={isDark ? '#fbcfe8' : '#fce7f3'} opacity={isDark ? '0.72' : '0.88'}>
            <circle cx="144" cy="-126" r="14" />
            <circle cx="158" cy="-114" r="9" />
            <circle cx="-128" cy="-148" r="11" />
            <circle cx="88" cy="-214" r="10" />
          </g>
        </g>

        {/* Hero Right Cherry Blossom Tree — Mirrored Organic Silhouette */}
        <g transform="translate(1324 292)">
          <ellipse cx="-6" cy="24" rx="76" ry="12" fill={isDark ? '#06110e' : '#14532d'} opacity={isDark ? '0.5' : '0.22'} />
          <path
            d="M-22 26 C-16 -18, -14 -58, -18 -98 C-48 -118, -80 -134, -114 -148 C-78 -142, -46 -132, -16 -116 C-22 -146, -28 -174, -34 -202 C-20 -176, -8 -150, 2 -128 C34 -146, 66 -156, 98 -160 C68 -144, 38 -130, 8 -114 C14 -64, 18 -14, 22 26 Z"
            fill="url(#springBark)"
          />
          <path
            d="M-126 -118 C-146 -150, -114 -188, -74 -182 C-52 -224, 12 -232, 46 -198 C86 -208, 128 -176, 120 -136 C144 -120, 134 -82, 96 -82 C72 -66, 26 -68, 4 -84 C-32 -66, -86 -72, -106 -94 C-132 -90, -144 -104, -126 -118 Z"
            fill={isDark ? '#702459' : '#f472b6'}
            opacity={isDark ? '0.68' : '0.46'}
          />
          <path
            d="M-118 -132 C-134 -168, -94 -202, -56 -190 C-34 -232, 26 -236, 56 -204 C96 -212, 132 -178, 120 -142 C138 -124, 122 -92, 86 -94 C64 -78, 24 -84, 4 -98 C-28 -84, -72 -90, -92 -108 C-116 -104, -130 -118, -118 -132 Z"
            fill={isDark ? '#d969a6' : '#f9a8d4'}
            opacity={isDark ? '0.84' : '0.92'}
          />
          <path
            d="M-96 -150 C-102 -180, -64 -206, -32 -194 C-12 -226, 38 -226, 58 -194 C88 -196, 108 -164, 90 -140 C70 -124, 30 -128, 10 -140 C-18 -126, -62 -130, -80 -144 Z"
            fill={isDark ? '#f9a8d4' : '#fce7f3'}
            opacity={isDark ? '0.76' : '0.94'}
          />
          <path
            d="M-76 -172 C-58 -204, -10 -216, 18 -196 C40 -200, 62 -182, 54 -162 C30 -168, 2 -170, -24 -162 C-48 -164, -76 -160, -76 -172 Z"
            fill={isDark ? '#fdf2f8' : '#ffffff'}
            opacity={isDark ? '0.58' : '0.80'}
          />
          <g fill={isDark ? '#fbcfe8' : '#fce7f3'} opacity={isDark ? '0.72' : '0.88'}>
            <circle cx="-142" cy="-134" r="14" />
            <circle cx="-158" cy="-120" r="8.5" />
            <circle cx="-94" cy="-214" r="10" />
          </g>
        </g>

        {/* Fallen Sakura Petal Carpets along Park Lawn & Promenade */}
        <g fill={isDark ? '#f9a8d4' : '#fbcfe8'} opacity={isDark ? '0.68' : '0.90'}>
          <ellipse cx="195" cy="310" rx="6" ry="2.2" transform="rotate(-8 195 310)" />
          <ellipse cx="242" cy="319" rx="4.5" ry="1.8" transform="rotate(12 242 319)" />
          <ellipse cx="322" cy="302" rx="5" ry="2" />
          <ellipse cx="520" cy="324" rx="5.5" ry="2" transform="rotate(-14 520 324)" />
          <ellipse cx="634" cy="312" rx="4.5" ry="1.8" />
          <ellipse cx="766" cy="322" rx="5" ry="2" transform="rotate(9 766 322)" />
          <ellipse cx="1084" cy="308" rx="5.5" ry="2.1" />
          <ellipse cx="1182" cy="318" rx="4.5" ry="1.8" transform="rotate(-10 1182 318)" />
          <ellipse cx="1264" cy="304" rx="6" ry="2.3" />
          <ellipse cx="1310" cy="320" rx="5" ry="2" />
        </g>
      </svg>
    );
  }

  if (motion === 'summer') {
    // 夏 => 海 (Atmospheric distant archipelago, coastal lighthouse with beam, layered turquoise/moonlit ocean, realistic shimmer ribbons, lacy surf & sandy beach)
    const shimmerBars = [
      { y: 162, w: 62, o: 0.72 },
      { y: 170, w: 86, o: 0.64 },
      { y: 179, w: 110, o: 0.56 },
      { y: 189, w: 136, o: 0.50 },
      { y: 200, w: 164, o: 0.44 },
      { y: 212, w: 192, o: 0.36 },
      { y: 225, w: 224, o: 0.30 },
      { y: 239, w: 256, o: 0.24 },
      { y: 254, w: 288, o: 0.18 },
    ];
    return (
      <svg
        viewBox="0 0 1440 340"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[240px] w-full sm:h-[300px]"
      >
        <defs>
          <linearGradient id="summerSeaDepth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#123e6b' : '#0284c7'} />
            <stop offset="32%" stopColor={isDark ? '#0b2b50' : '#0ea5e9'} />
            <stop offset="72%" stopColor={isDark ? '#071d3a' : '#06b6d4'} />
            <stop offset="100%" stopColor={isDark ? '#05152b' : '#22d3ee'} />
          </linearGradient>
          <linearGradient id="summerHorizonGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#7dd3fc' : '#ffffff'} stopOpacity={isDark ? '0.26' : '0.78'} />
            <stop offset="100%" stopColor={isDark ? '#0c2d52' : '#0284c7'} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="summerBeachGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#213a54' : '#fef0c7'} />
            <stop offset="48%" stopColor={isDark ? '#16293d' : '#f5d491'} />
            <stop offset="100%" stopColor={isDark ? '#0f1d2c' : '#e4b96e'} />
          </linearGradient>
          <linearGradient id="lighthouseBeam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.44" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <filter id="summerHazeBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Distant Misty Island Silhouette (Far) */}
        <path
          d="M840 156 C910 132, 976 136, 1048 122 C1106 112, 1164 134, 1220 156 Z"
          fill={isDark ? '#0e2542' : '#7dd3fc'}
          opacity={isDark ? '0.68' : '0.58'}
        />

        {/* Nearer Coastal Headland & Cape */}
        <path
          d="M1060 158 C1132 128, 1200 116, 1272 128 C1336 138, 1390 120, 1440 134 L1440 162 L1060 162 Z"
          fill={isDark ? '#0b1d33' : '#38bdf8'}
          opacity={isDark ? '0.92' : '0.68'}
        />
        <path
          d="M1126 158 C1194 136, 1252 132, 1326 142 C1376 148, 1412 138, 1440 144 L1440 160 L1126 160 Z"
          fill={isDark ? '#071526' : '#0284c7'}
          opacity={isDark ? '0.86' : '0.42'}
        />

        {/* Coastal Lighthouse with Delicate Beacon */}
        <g transform="translate(1254 106)">
          {isDark && (
            <polygon
              points="-2,4 -138,-22 -138,16"
              fill="url(#lighthouseBeam)"
              className="nein-lantern-glow"
            />
          )}
          <path d="M-4 22 L-2.6 4 L2.6 4 L4 22 Z" fill={isDark ? '#cbd5e1' : '#ffffff'} />
          <rect x="-3.4" y="2" width="6.8" height="2.8" fill={isDark ? '#94a3b8' : '#e11d48'} />
          <circle
            cx="0"
            cy="2"
            r={isDark ? '5.5' : '2.4'}
            fill={isDark ? '#fef08a' : '#fef9c3'}
            opacity={isDark ? '0.92' : '0.85'}
            className={isDark ? 'nein-lantern-glow' : undefined}
          />
        </g>

        {/* Quiet Soaring Seabirds in Daytime */}
        {!isDark && (
          <g stroke="#0369a1" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.52">
            <path d="M352 94 Q360 87 368 93 Q376 87 384 94" />
            <path d="M402 108 Q408 103 414 107 Q420 103 426 108" />
            <path d="M298 114 Q304 109 310 113 Q316 109 322 114" />
          </g>
        )}

        {/* Main Ocean Expanse */}
        <rect x="0" y="156" width="1440" height="184" fill="url(#summerSeaDepth)" />

        {/* Atmospheric Horizon Rim Shimmer */}
        <rect x="0" y="156" width="1440" height="18" fill="url(#summerHorizonGlow)" />
        <line
          x1="0"
          y1="157"
          x2="1440"
          y2="157"
          stroke={isDark ? '#bae6fd' : '#f0f9ff'}
          strokeWidth="1.6"
          opacity={isDark ? '0.42' : '0.90'}
        />

        {/* Painterly Staggered Sun/Moon Reflection Column */}
        <g filter="url(#summerHazeBlur)">
          {shimmerBars.map((bar, idx) => (
            <ellipse
              key={idx}
              cx={1115 + (idx % 2 === 0 ? -4 : 5)}
              cy={bar.y}
              rx={bar.w * 0.5}
              ry={2.6 + idx * 0.35}
              fill={isDark ? '#e0f2fe' : '#fef9c3'}
              opacity={bar.o * (isDark ? 0.52 : 0.72)}
            />
          ))}
        </g>

        {/* Rolling Ocean Swell Layer 1 (Far) */}
        <g className="nein-sea-wave-c">
          <path
            d="M-80 198 Q40 186 160 198 T400 198 T640 198 T880 198 T1120 198 T1360 198 T1560 198 L1560 340 L-80 340 Z"
            fill={isDark ? '#0c335c' : '#0ea5e9'}
            opacity={isDark ? '0.54' : '0.46'}
          />
        </g>

        {/* Rolling Ocean Swell Layer 2 (Mid) */}
        <g className="nein-sea-wave-a">
          <path
            d="M-80 232 Q60 216 200 232 T480 232 T760 232 T1040 232 T1320 232 T1580 232 L1580 340 L-80 340 Z"
            fill={isDark ? '#0e3f70' : '#06b6d4'}
            opacity={isDark ? '0.58' : '0.52'}
          />
          <path
            d="M-80 232 Q60 216 200 232 T480 232 T760 232 T1040 232 T1320 232 T1580 232"
            fill="none"
            stroke={isDark ? '#bae6fd' : '#e0f2fe'}
            strokeWidth="1.6"
            opacity={isDark ? '0.28' : '0.68'}
          />
        </g>

        {/* Translucent Shallow Surf Layer 3 */}
        <g className="nein-sea-wave-b">
          <path
            d="M-80 268 Q80 252 240 268 T560 268 T880 268 T1200 268 T1560 268 L1560 340 L-80 340 Z"
            fill={isDark ? '#145182' : '#38bdf8'}
            opacity={isDark ? '0.50' : '0.58'}
          />
          <path
            d="M-80 268 Q80 252 240 268 T560 268 T880 268 T1200 268 T1560 268"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.4"
            opacity={isDark ? '0.32' : '0.78'}
          />
        </g>

        {/* Curved Sandy Shoreline with Wet-Sand Reflection & Lacy Sea Foam */}
        <path
          d="M0 296 Q320 278 680 298 T1440 288 L1440 340 L0 340 Z"
          fill="url(#summerBeachGrad)"
        />
        {/* Wet-sand sheen edge */}
        <path
          d="M0 304 Q320 286 680 306 T1440 296"
          fill="none"
          stroke={isDark ? '#7dd3fc' : '#ffffff'}
          strokeWidth="6"
          opacity={isDark ? '0.12' : '0.34'}
        />
        {/* Delicate lacy white surf line */}
        <path
          d="M0 296 Q320 278 680 298 T1440 288"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.2"
          opacity={isDark ? '0.34' : '0.92'}
        />
      </svg>
    );
  }

  if (motion === 'autumn') {
    // 秋 => 紅葉で紅く染まった山 (4 sweeping Japanese mountain ridges, valley mist, multi-hue brocade tapestry slopes, quiet mountain tarn, framing maple branches)
    return (
      <svg
        viewBox="0 0 1440 340"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[250px] w-full sm:h-[315px]"
      >
        <defs>
          <linearGradient id="autumnMtnFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#542436' : '#f59e6c'} />
            <stop offset="100%" stopColor={isDark ? '#2a121d' : '#d96b43'} />
          </linearGradient>
          <linearGradient id="autumnMtnMidFar" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isDark ? '#7a1f28' : '#e25335'} />
            <stop offset="50%" stopColor={isDark ? '#92301a' : '#ea580c'} />
            <stop offset="100%" stopColor={isDark ? '#6c2516' : '#d97706'} />
          </linearGradient>
          <linearGradient id="autumnMtnMidNear" x1="0" y1="0" x2="1" y2="0.8">
            <stop offset="0%" stopColor={isDark ? '#8b1a1a' : '#c81e1e'} />
            <stop offset="45%" stopColor={isDark ? '#9a3412' : '#dc2626'} />
            <stop offset="82%" stopColor={isDark ? '#7c2d12' : '#ea580c'} />
            <stop offset="100%" stopColor={isDark ? '#5f1d14' : '#b45309'} />
          </linearGradient>
          <linearGradient id="autumnMtnFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#4a1216' : '#991b1b'} />
            <stop offset="100%" stopColor={isDark ? '#1e080a' : '#5c1414'} />
          </linearGradient>
          <linearGradient id="autumnValleyMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#fb923c' : '#fff7ed'} stopOpacity="0" />
            <stop offset="50%" stopColor={isDark ? '#f97316' : '#fff7ed'} stopOpacity={isDark ? '0.18' : '0.62'} />
            <stop offset="100%" stopColor={isDark ? '#7c2d12' : '#ffedd5'} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="autumnLake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#42191f' : '#f59e6c'} stopOpacity="0.82" />
            <stop offset="100%" stopColor={isDark ? '#1f0d14' : '#c2410c'} stopOpacity="0.88" />
          </linearGradient>
          <filter id="autumnMistBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* Ridge 1: Distant Misty Japanese Peaks (Soft Organic Curves) */}
        <path
          d="M0 218 C110 156, 210 120, 320 166 C420 206, 510 108, 635 124 C760 140, 845 198, 970 126 C1085 62, 1185 154, 1300 132 C1365 118, 1405 138, 1440 148 L1440 340 L0 340 Z"
          fill="url(#autumnMtnFar)"
          opacity={isDark ? '0.82' : '0.78'}
        />

        {/* Valley Mist Band 1 */}
        <rect x="0" y="156" width="1440" height="58" fill="url(#autumnValleyMist)" filter="url(#autumnMistBlur)" />

        {/* Ridge 2: Mid-Far Vermilion & Russet Mountain Range */}
        <path
          d="M0 238 C145 162, 265 186, 410 148 C545 112, 665 206, 815 162 C950 122, 1075 184, 1215 142 C1310 114, 1385 152, 1440 166 L1440 340 L0 340 Z"
          fill="url(#autumnMtnMidFar)"
        />
        {/* Warm Ridge-Line Rim Backlight */}
        <path
          d="M0 238 C145 162, 265 186, 410 148 C545 112, 665 206, 815 162 C950 122, 1075 184, 1215 142 C1310 114, 1385 152, 1440 166"
          fill="none"
          stroke={isDark ? '#fdba74' : '#fef3c7'}
          strokeWidth="1.4"
          opacity={isDark ? '0.26' : '0.68'}
        />

        {/* Valley Mist Band 2 */}
        <rect x="0" y="198" width="1440" height="52" fill="url(#autumnValleyMist)" filter="url(#autumnMistBlur)" />

        {/* Ridge 3: Brocade Tapestry (錦秋) Crimson & Amber Slopes */}
        <path
          d="M0 256 C180 184, 340 226, 520 188 C690 152, 845 232, 1040 184 C1195 146, 1320 202, 1440 190 L1440 340 L0 340 Z"
          fill="url(#autumnMtnMidNear)"
        />

        {/* Painterly Multi-Hue Koyo Foliage Patches (Crimson, Gold, Burnt Orange & Evergreen Cedar Contrast) */}
        <g opacity={isDark ? '0.52' : '0.70'} filter="url(#autumnMistBlur)">
          <ellipse cx="210" cy="238" rx="92" ry="26" fill="#f59e0b" />
          <ellipse cx="470" cy="222" rx="112" ry="30" fill="#dc2626" />
          <ellipse cx="640" cy="234" rx="74" ry="22" fill="#eab308" />
          <ellipse cx="890" cy="240" rx="88" ry="24" fill="#ea580c" />
          <ellipse cx="1095" cy="214" rx="108" ry="28" fill="#f59e0b" />
          <ellipse cx="1295" cy="232" rx="86" ry="24" fill="#b91c1c" />
        </g>
        {/* Subtle dark evergreen cedar patches for authentic Japanese mountain contrast */}
        <g opacity={isDark ? '0.36' : '0.28'}>
          <ellipse cx="348" cy="246" rx="56" ry="18" fill="#1e3a2f" />
          <ellipse cx="772" cy="244" rx="64" ry="18" fill="#1e3a2f" />
          <ellipse cx="1188" cy="242" rx="58" ry="18" fill="#1e3a2f" />
        </g>

        {/* Quiet Mountain Valley Lake Reflecting Crimson Slopes */}
        <path
          d="M420 296 Q720 278 1030 296 Q720 322 420 296 Z"
          fill="url(#autumnLake)"
        />
        <g stroke={isDark ? '#fdba74' : '#fef3c7'} strokeWidth="1.2" opacity={isDark ? '0.24' : '0.56'}>
          <line x1="560" y1="296" x2="660" y2="296" />
          <line x1="700" y1="302" x2="835" y2="302" />
          <line x1="620" y1="308" x2="730" y2="308" />
        </g>

        {/* Ridge 4: Foreground Deep-Crimson Slopes */}
        <path
          d="M0 274 Q260 236 530 288 Q720 314 910 288 Q1190 242 1440 268 L1440 340 L0 340 Z"
          fill="url(#autumnMtnFront)"
        />

        {/* Framing Foreground Silhouetted Maple Branches & Layered Crimson-Gold Canopies (Left) */}
        <g transform="translate(0 340)">
          <path
            d="M-10 -8 C26 -42, 68 -68, 128 -86 M52 -54 C74 -84, 98 -102, 134 -112"
            stroke={isDark ? '#1e0b0c' : '#451a12'}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-24 -76 C-8 -116, 44 -128, 76 -104 C112 -118, 152 -96, 150 -62 C180 -54, 184 -16, 150 -6 C112 8, 22 10, -24 4 Z"
            fill={isDark ? '#7f1d1d' : '#b91c1c'}
            opacity="0.94"
          />
          <path
            d="M12 -90 C36 -118, 86 -118, 108 -90 C138 -94, 162 -68, 144 -42 C112 -32, 48 -36, 18 -54 Z"
            fill={isDark ? '#c2410c' : '#ea580c'}
            opacity="0.86"
          />
          <path
            d="M68 -96 C92 -112, 128 -102, 134 -78 C114 -68, 82 -70, 68 -82 Z"
            fill={isDark ? '#d97706' : '#facc15'}
            opacity="0.72"
          />
        </g>

        {/* Framing Foreground Silhouetted Maple Branches & Layered Crimson-Gold Canopies (Right) */}
        <g transform="translate(1440 340) scale(-1 1)">
          <path
            d="M-10 -8 C32 -44, 78 -72, 142 -92 M58 -58 C82 -88, 112 -106, 150 -116"
            stroke={isDark ? '#1e0b0c' : '#451a12'}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-24 -84 C-6 -124, 48 -134, 84 -110 C120 -122, 164 -98, 160 -64 C190 -54, 192 -14, 156 -4 C116 8, 22 10, -24 4 Z"
            fill={isDark ? '#7f1d1d' : '#b91c1c'}
            opacity="0.94"
          />
          <path
            d="M16 -96 C42 -124, 94 -124, 118 -94 C148 -98, 170 -70, 150 -44 C118 -34, 52 -38, 22 -58 Z"
            fill={isDark ? '#c2410c' : '#ea580c'}
            opacity="0.86"
          />
          <path
            d="M78 -102 C104 -118, 142 -106, 146 -80 C124 -70, 92 -72, 78 -86 Z"
            fill={isDark ? '#d97706' : '#facc15'}
            opacity="0.72"
          />
        </g>
      </svg>
    );
  }

  if (motion === 'winter') {
    // 冬 => 雪が積もっている (3D-shaded alpine peaks, snow-laden organic evergreens, distant warm-lit cabin, pillowy snowdrifts with ice-blue creases)
    const evergreens = [
      { x: 96, y: 238, s: 1.18 },
      { x: 178, y: 254, s: 0.86 },
      { x: 244, y: 262, s: 0.64 },
      { x: 1216, y: 258, s: 0.68 },
      { x: 1278, y: 248, s: 0.90 },
      { x: 1356, y: 232, s: 1.22 },
    ];
    return (
      <svg
        viewBox="0 0 1440 340"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[240px] w-full sm:h-[300px]"
      >
        <defs>
          <linearGradient id="alpineLit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#94b2d4' : '#ffffff'} />
            <stop offset="100%" stopColor={isDark ? '#3a5478' : '#dbeafe'} />
          </linearGradient>
          <linearGradient id="alpineShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#334c6e' : '#bfd4eb'} />
            <stop offset="100%" stopColor={isDark ? '#1a2c47' : '#cbd5e1'} />
          </linearGradient>
          <linearGradient id="snowMidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#b8cee6' : '#f8fbff'} />
            <stop offset="55%" stopColor={isDark ? '#6f8eb0' : '#e2edf9'} />
            <stop offset="100%" stopColor={isDark ? '#3e597a' : '#cbdcf0'} />
          </linearGradient>
          <linearGradient id="snowFrontGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#dbeafe' : '#ffffff'} />
            <stop offset="50%" stopColor={isDark ? '#9db9d8' : '#eef5fc'} />
            <stop offset="100%" stopColor={isDark ? '#6b88ab' : '#d5e4f5'} />
          </linearGradient>
          <radialGradient id="cabinWindowGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity={isDark ? '0.72' : '0.32'} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Distant 3D-Shaded Snow-Blanketed Alpine Peaks */}
        <g opacity={isDark ? '0.68' : '0.92'}>
          {/* Peak 1 */}
          <polygon points="100,248 290,118 465,248" fill="url(#alpineLit)" />
          <polygon points="290,118 334,176 312,202 356,248 465,248" fill="url(#alpineShadow)" />
          {/* Peak 2 */}
          <polygon points="410,248 640,94 875,248" fill="url(#alpineLit)" />
          <polygon points="640,94 696,162 674,192 732,248 875,248" fill="url(#alpineShadow)" />
          {/* Peak 3 */}
          <polygon points="820,248 1060,108 1310,248" fill="url(#alpineLit)" />
          <polygon points="1060,108 1122,168 1096,198 1152,248 1310,248" fill="url(#alpineShadow)" />
        </g>

        {/* Soft Mid-Far Snowy Foothills */}
        <path
          d="M0 246 Q240 202 520 236 T1040 222 T1440 238 L1440 340 L0 340 Z"
          fill="url(#snowMidGrad)"
          opacity={isDark ? '0.78' : '0.96'}
        />

        {/* Charming Distant Mountain Lodge with Warm Glowing Windows */}
        <g transform="translate(998 206)">
          {isDark && <circle cx="16" cy="24" r="34" fill="url(#cabinWindowGlow)" className="nein-lantern-glow" />}
          {/* Soft chimney smoke wisp */}
          <path
            d="M27 2 C29 -6, 35 -10, 34 -18 C33 -24, 38 -29, 43 -34"
            fill="none"
            stroke={isDark ? '#cbd5e1' : '#94a3b8'}
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.34"
          />
          <rect x="24" y="2" width="5" height="10" fill={isDark ? '#334155' : '#64748b'} />
          <rect x="4" y="16" width="26" height="16" rx="1" fill={isDark ? '#2a2221' : '#57423a'} />
          {/* Snow-covered pitched roof */}
          <polygon points="0,17 17,4 34,17" fill={isDark ? '#e2e8f0' : '#ffffff'} />
          <path d="M-2 18 L17 3 L36 18" fill="none" stroke={isDark ? '#f8fafc' : '#ffffff'} strokeWidth="3.2" strokeLinecap="round" />
          {/* Two warm glowing amber windows */}
          <rect x="9" y="20" width="5.5" height="6" rx="0.8" fill="#fde68a" opacity={isDark ? '0.96' : '0.88'} />
          <rect x="19.5" y="20" width="5.5" height="6" rx="0.8" fill="#fcd34d" opacity={isDark ? '0.96' : '0.88'} />
        </g>

        {/* Detailed Multi-Tiered Snow-Laden Evergreens (Organic Drooping Boughs) */}
        {evergreens.map((tree, idx) => (
          <g key={idx} transform={`translate(${tree.x} ${tree.y}) scale(${tree.s})`}>
            {/* Trunk */}
            <rect x="-4" y="26" width="8" height="22" fill={isDark ? '#1a232e' : '#475569'} />
            {/* Lower tier */}
            <path
              d="M0 -24 C-16 -4, -34 14, -44 30 C-26 26, -12 32, 0 28 C12 32, 26 26, 44 30 C34 14, 16 -4, 0 -24 Z"
              fill={isDark ? '#102433' : '#263d4d'}
            />
            {/* Mid tier */}
            <path
              d="M0 -52 C-14 -34, -28 -16, -36 0 C-20 -4, -10 2, 0 -2 C10 2, 20 -4, 36 0 C28 -16, 14 -34, 0 -52 Z"
              fill={isDark ? '#163144' : '#314c5e'}
            />
            {/* Crown tier */}
            <path
              d="M0 -78 C-10 -62, -20 -44, -26 -30 C-14 -34, -6 -28, 0 -32 C6 -28, 14 -34, 26 -30 C20 -44, 10 -62, 0 -78 Z"
              fill={isDark ? '#1d3d54' : '#3e5d72'}
            />
            {/* Thick Pillowy Snow Caps on Boughs */}
            <path
              d="M0 -78 C-7 -65, -14 -52, -18 -44 C-10 -46, -4 -41, 0 -44 C4 -41, 10 -46, 18 -44 C14 -52, 7 -65, 0 -78 Z"
              fill={isDark ? '#b8d0e8' : '#ffffff'}
              opacity={isDark ? '0.88' : '0.98'}
            />
            <path
              d="M-24 -26 C-16 -20, -6 -16, 0 -20 C6 -16, 16 -20, 24 -26 C18 -34, 10 -44, 0 -52 C-10 -44, -18 -34, -24 -26 Z"
              fill={isDark ? '#9db9d6' : '#f8fbff'}
              opacity={isDark ? '0.82' : '0.92'}
            />
            <path
              d="M-32 4 C-22 10, -10 12, 0 8 C10 12, 22 10, 32 4 C24 -4, 14 -14, 0 -24 C-14 -14, -24 -4, -32 4 Z"
              fill={isDark ? '#89a7c7' : '#f1f7fe'}
              opacity={isDark ? '0.76' : '0.86'}
            />
          </g>
        ))}

        {/* Mid-Near Sculpted Snowdrift */}
        <path
          d="M0 264 Q310 226 670 266 T1440 248 L1440 340 L0 340 Z"
          fill="url(#snowMidGrad)"
          opacity={isDark ? '0.90' : '0.98'}
        />

        {/* Deep Accumulated Foreground Snow Blanket */}
        <path
          d="M0 282 Q240 256 520 286 Q850 318 1175 272 Q1325 252 1440 270 L1440 340 L0 340 Z"
          fill="url(#snowFrontGrad)"
        />
        {/* Soft Ice-Blue Contour Shadow Fold */}
        <path
          d="M120 308 Q410 288 680 314 T1290 296"
          fill="none"
          stroke={isDark ? '#6485ab' : '#bdd4ec'}
          strokeWidth="6"
          strokeLinecap="round"
          opacity={isDark ? '0.28' : '0.45'}
        />
        {/* Crisp Specular Snow Crest Highlight */}
        <path
          d="M0 282 Q240 256 520 286 Q850 318 1175 272 Q1325 252 1440 270"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.8"
          opacity={isDark ? '0.68' : '0.98'}
        />
      </svg>
    );
  }

  if (motion === 'space') {
    // 宇宙 => 静かな惑星の地平線 (Orbital curved Earth limb with multi-layer Rayleigh cyan-blue scattering, golden airglow hairline & subtle nocturnal city lights)
    return (
      <svg
        viewBox="0 0 1440 260"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[170px] w-full sm:h-[225px]"
      >
        <defs>
          <radialGradient id="spaceOuterHalo" cx="50%" cy="112%" r="76%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.46" />
            <stop offset="32%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="64%" stopColor="#4f46e5" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="spaceLimbArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="28%" stopColor="#7dd3fc" stopOpacity="0.72" />
            <stop offset="50%" stopColor="#f0f9ff" stopOpacity="0.96" />
            <stop offset="72%" stopColor="#7dd3fc" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="spaceAirglow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
            <stop offset="32%" stopColor="#5eead4" stopOpacity="0.24" />
            <stop offset="50%" stopColor="#fde68a" stopOpacity="0.30" />
            <stop offset="68%" stopColor="#5eead4" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="spacePlanetBody" cx="50%" cy="18%" r="72%">
            <stop offset="0%" stopColor="#0b1730" />
            <stop offset="52%" stopColor="#040915" />
            <stop offset="100%" stopColor="#02040a" />
          </radialGradient>
          <filter id="spaceLimbBlur" x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* Wide Rayleigh Atmospheric Scattering Corona */}
        <ellipse cx="720" cy="272" rx="960" ry="188" fill="url(#spaceOuterHalo)" />

        {/* Whisper-thin Upper Mesosphere Airglow Band */}
        <path
          d="M-20 202 Q720 100 1460 202"
          fill="none"
          stroke="url(#spaceAirglow)"
          strokeWidth="3.2"
          filter="url(#spaceLimbBlur)"
        />

        {/* Luminous Soft Cyan Atmospheric Rim */}
        <path
          d="M-20 220 Q720 116 1460 220"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="12"
          opacity="0.46"
          filter="url(#spaceLimbBlur)"
        />

        {/* Curved Planetary Night-Side Body */}
        <path
          d="M-20 224 Q720 120 1460 224 L1460 260 L-20 260 Z"
          fill="url(#spacePlanetBody)"
        />

        {/* Crisp Specular Atmospheric Horizon Line */}
        <path
          d="M-20 223 Q720 119 1460 223"
          fill="none"
          stroke="url(#spaceLimbArc)"
          strokeWidth="2.4"
        />

        {/* Ultra-Subtle Nocturnal City-Light Constellations on Curved Horizon */}
        <g fill="#fde68a" opacity="0.34">
          <circle cx="528" cy="210" r="1.4" />
          <circle cx="536" cy="213" r="1.0" />
          <circle cx="546" cy="208" r="1.2" />
          <circle cx="678" cy="196" r="1.5" />
          <circle cx="688" cy="199" r="1.1" />
          <circle cx="702" cy="194" r="1.6" />
          <circle cx="714" cy="198" r="1.0" />
          <circle cx="842" cy="204" r="1.4" />
          <circle cx="854" cy="208" r="1.1" />
          <circle cx="964" cy="222" r="1.3" />
          <circle cx="974" cy="225" r="0.9" />
        </g>
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

    let prefersReducedMotion = false;
    try {
      prefersReducedMotion =
        typeof window !== 'undefined' &&
        Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    } catch {
      prefersReducedMotion = false;
    }

    let width = Math.max(1, window.innerWidth || 1);
    let height = Math.max(1, window.innerHeight || 1);
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

    const resize = () => {
      width = Math.max(1, window.innerWidth || 1);
      height = Math.max(1, window.innerHeight || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // 1. Spring: 3-depth Sakura Petals + Quiet Night Stars/Lantern Motes (Dark)
    const petals: SakuraPetal[] =
      effectiveMotion === 'spring'
        ? Array.from({ length: 56 }, (_, i) => {
            const depth = i < 18 ? 0.35 + Math.random() * 0.25 : i < 46 ? 0.65 + Math.random() * 0.3 : 1.05 + Math.random() * 0.35;
            return {
              x: Math.random() * width,
              y: Math.random() * height,
              size: (3.6 + Math.random() * 4.2) * depth,
              depth,
              vx: (12 + Math.random() * 18) * depth,
              vy: (16 + Math.random() * 22) * depth,
              angle: Math.random() * Math.PI * 2,
              spin: (Math.random() - 0.5) * 1.4,
              swayPhase: Math.random() * Math.PI * 2,
              swaySpeed: 1.0 + Math.random() * 1.1,
              flipPhase: Math.random() * Math.PI * 2,
              flipSpeed: 1.4 + Math.random() * 1.7,
              colorIdx: Math.floor(Math.random() * 3),
              alpha: (isDark ? 0.42 : 0.56) + Math.min(0.42, depth * 0.3),
            };
          })
        : [];

    const ambientMotes: AmbientMote[] =
      isDark && (effectiveMotion === 'spring' || effectiveMotion === 'summer' || effectiveMotion === 'autumn' || effectiveMotion === 'winter')
        ? Array.from({ length: effectiveMotion === 'winter' ? 48 : 34 }, () => ({
            x: Math.random() * width,
            y: Math.random() * (height * 0.56),
            r: 0.6 + Math.random() * 1.15,
            phase: Math.random() * Math.PI * 2,
            speed: 0.7 + Math.random() * 1.6,
            baseAlpha: 0.22 + Math.random() * 0.48,
            color:
              effectiveMotion === 'spring'
                ? '#fce7f3'
                : effectiveMotion === 'autumn'
                  ? '#fef3c7'
                  : '#e0f2fe',
          }))
        : [];

    // 2. Summer: Multi-depth Volumetric Cumulus Clouds + Shimmering Ocean Glints
    const clouds: SummerCloud[] =
      effectiveMotion === 'summer'
        ? Array.from({ length: 8 }, (_, i) => {
            const depth = i < 3 ? 0.62 : i < 6 ? 0.92 : 1.18;
            return {
              x: (width / 7) * i + Math.random() * 140 - 110,
              y: 66 + (i % 3) * 62 + Math.random() * 34,
              scale: depth + Math.random() * 0.14,
              speed: (3.8 + (i % 3) * 2.6 + Math.random() * 1.8) * depth,
              alpha: isDark ? 0.38 + (i % 2) * 0.16 : 0.74 + (i % 2) * 0.18,
              variant: i,
              depth,
            };
          })
        : [];

    const sparkles: SeaSparkle[] =
      effectiveMotion === 'summer'
        ? Array.from({ length: 42 }, (_, idx) => {
            const inColumn = idx < 22;
            const yRatio = 0.74 + Math.random() * 0.20;
            const spread = (yRatio - 0.72) * 0.46 + 0.04;
            return {
              xRatio: inColumn
                ? 0.774 + (Math.random() - 0.5) * spread * 2
                : 0.04 + Math.random() * 0.92,
              yRatio,
              phase: Math.random() * Math.PI * 2,
              speed: 1.5 + Math.random() * 2.4,
              size: (inColumn ? 1.8 : 1.1) + Math.random() * 1.8,
              inColumn,
            };
          })
        : [];

    // 3. Autumn: 3-depth Momiji Maple Leaves
    const leaves: AutumnLeaf[] =
      effectiveMotion === 'autumn'
        ? Array.from({ length: 46 }, (_, i) => {
            const depth = i < 14 ? 0.55 + Math.random() * 0.2 : i < 38 ? 0.8 + Math.random() * 0.25 : 1.12 + Math.random() * 0.25;
            return {
              x: Math.random() * width,
              y: Math.random() * height,
              size: (5.8 + Math.random() * 5.2) * depth,
              depth,
              vx: (-8 + Math.random() * 24) * depth,
              vy: (18 + Math.random() * 24) * depth,
              angle: Math.random() * Math.PI * 2,
              spin: (Math.random() - 0.5) * 1.5,
              swayPhase: Math.random() * Math.PI * 2,
              swaySpeed: 0.95 + Math.random() * 1.15,
              flipPhase: Math.random() * Math.PI * 2,
              flipSpeed: 1.2 + Math.random() * 1.4,
              colorIdx: Math.floor(Math.random() * 4),
              alpha: (isDark ? 0.52 : 0.68) + Math.min(0.30, depth * 0.24),
            };
          })
        : [];

    // 4. Winter: Bokeh Snow Orbs + Powdery Flakes + Branched 6-Point Crystals
    const flakes: Snowflake[] =
      effectiveMotion === 'winter'
        ? Array.from({ length: 88 }, (_, i) => {
            const depth = Math.random();
            const kind: Snowflake['kind'] = i < 12 ? 'bokeh' : depth > 0.78 ? 'crystal' : 'powder';
            return {
              x: Math.random() * width,
              y: Math.random() * height,
              r: kind === 'bokeh' ? 4.5 + Math.random() * 4.5 : kind === 'crystal' ? 3.8 + depth * 3.0 : 1.3 + depth * 2.5,
              depth,
              vx: -5 + Math.random() * 12,
              vy: (kind === 'bokeh' ? 14 : 16 + depth * 30),
              swayPhase: Math.random() * Math.PI * 2,
              swaySpeed: 0.65 + Math.random() * 1.0,
              angle: Math.random() * Math.PI * 2,
              spin: (Math.random() - 0.5) * 0.9,
              alpha:
                kind === 'bokeh'
                  ? (isDark ? 0.14 : 0.26) + Math.random() * 0.16
                  : (isDark ? 0.42 : 0.56) + depth * 0.42,
              kind,
            };
          })
        : [];

    // 5. Space: Milky Way Galactic Band Stardust + Multi-Magnitude Stars + Hero Diffraction Spikes
    const starPalette = ['#ffffff', '#e0f2fe', '#bae6fd', '#fef3c7', '#ddd6fe', '#fed7aa'];
    const stars: StarPoint[] =
      effectiveMotion === 'space'
        ? Array.from({ length: 240 }, (_, i) => {
            const inMilkyWay = i < 110;
            let x = Math.random() * width;
            let y = Math.random() * (height * 0.88);
            if (inMilkyWay) {
              const t = Math.random();
              const bandX = t * width;
              const bandY = height * (0.76 - t * 0.68) + (Math.random() + Math.random() - 1) * (height * 0.16);
              x = Math.max(0, Math.min(width, bandX));
              y = Math.max(0, Math.min(height * 0.86, bandY));
            }
            const isHero = !inMilkyWay && i >= 224;
            return {
              x,
              y,
              r: isHero ? 1.75 + Math.random() * 0.85 : inMilkyWay ? 0.45 + Math.random() * 0.95 : 0.65 + Math.random() * 1.3,
              phase: Math.random() * Math.PI * 2,
              speed: isHero ? 1.1 + Math.random() * 1.4 : 0.6 + Math.random() * 2.0,
              baseAlpha: isHero ? 0.84 + Math.random() * 0.16 : inMilkyWay ? 0.18 + Math.random() * 0.46 : 0.28 + Math.random() * 0.62,
              color: starPalette[Math.floor(Math.random() * starPalette.length)],
              hasSpikes: isHero,
              halo: isHero || (!inMilkyWay && i >= 202),
            };
          })
        : [];

    const shootingStars: ShootingStar[] = [];
    let shootCooldown = 1.9;

    const sakuraPairs: Array<[string, string]> = isDark
      ? [
          ['#fbcfe8', '#f472b6'],
          ['#f9a8d4', '#ec4899'],
          ['#fce7f3', '#f9a8d4'],
        ]
      : [
          ['#f9a8d4', '#f472b6'],
          ['#fbcfe8', '#f472b6'],
          ['#fecdd3', '#fb7185'],
        ];

    const autumnPairs: Array<[string, string]> = isDark
      ? [
          ['#dc2626', '#fb923c'],
          ['#ea580c', '#fbbf24'],
          ['#b91c1c', '#f97316'],
          ['#d97706', '#fde047'],
        ]
      : [
          ['#b91c1c', '#f97316'],
          ['#dc2626', '#fb923c'],
          ['#c2410c', '#f59e0b'],
          ['#d97706', '#facc15'],
        ];

    let rafId = 0;
    let lastTs = performance.now();

    const drawAmbientStars = (dt: number) => {
      for (const m of ambientMotes) {
        if (!prefersReducedMotion) m.phase += m.speed * dt;
        const twinkle = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(m.phase));
        ctx.save();
        ctx.globalAlpha = m.baseAlpha * twinkle;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const renderFrame = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
      lastTs = ts;

      ctx.clearRect(0, 0, width, height);

      if (effectiveMotion === 'spring') {
        if (isDark) drawAmbientStars(dt);
        for (const p of petals) {
          if (!prefersReducedMotion) {
            p.swayPhase += p.swaySpeed * dt;
            p.flipPhase += p.flipSpeed * dt;
            p.angle += p.spin * dt;
            p.x += (p.vx + Math.sin(p.swayPhase) * 18 * p.depth) * dt;
            p.y += p.vy * dt;
            if (p.y > height + 24) {
              p.y = -20;
              p.x = Math.random() * width;
            }
            if (p.x > width + 28) p.x = -24;
            if (p.x < -28) p.x = width + 24;
          }

          const [topCol, baseCol] = sakuraPairs[p.colorIdx];
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.scale(1, 0.42 + 0.58 * Math.abs(Math.cos(p.flipPhase)));
          ctx.globalAlpha = p.alpha;
          drawSakuraPetal(ctx, p.size, topCol, baseCol, p.depth < 0.55);
          ctx.restore();
        }
      } else if (effectiveMotion === 'summer') {
        if (isDark) drawAmbientStars(dt);
        // Slowly drifting volumetric summer clouds
        for (const c of clouds) {
          if (!prefersReducedMotion) {
            c.x += c.speed * dt;
            if (c.x > width + 200 * c.scale) {
              c.x = -200 * c.scale;
            }
          }
          drawSummerCloud(ctx, c.x, c.y, c.scale, isDark, c.alpha, c.variant);
        }
        // Shimmering ocean water specular glints
        for (const sp of sparkles) {
          if (!prefersReducedMotion) {
            sp.phase += sp.speed * dt;
          }
          const pulse = Math.pow(0.5 + 0.5 * Math.sin(sp.phase), 3.2);
          const a = (sp.inColumn ? 0.18 : 0.08) + pulse * (sp.inColumn ? 0.72 : 0.42);
          const sx = width * sp.xRatio;
          const sy = height * sp.yRatio;
          ctx.save();
          ctx.globalAlpha = a * (isDark ? 0.65 : 0.85);
          ctx.fillStyle = isDark ? '#e0f2fe' : '#fffef0';
          ctx.beginPath();
          ctx.ellipse(sx, sy, sp.size * (sp.inColumn ? 4.4 : 2.8), sp.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          if (sp.inColumn && pulse > 0.65) {
            ctx.beginPath();
            ctx.ellipse(sx, sy, sp.size * 0.48, sp.size * 2.1, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      } else if (effectiveMotion === 'autumn') {
        if (isDark) drawAmbientStars(dt);
        for (const lf of leaves) {
          if (!prefersReducedMotion) {
            lf.swayPhase += lf.swaySpeed * dt;
            lf.flipPhase += lf.flipSpeed * dt;
            lf.angle += lf.spin * dt;
            lf.x += (lf.vx + Math.sin(lf.swayPhase) * 24 * lf.depth) * dt;
            lf.y += lf.vy * dt;
            if (lf.y > height + 28) {
              lf.y = -22;
              lf.x = Math.random() * width;
            }
            if (lf.x > width + 28) lf.x = -24;
            if (lf.x < -28) lf.x = width + 24;
          }
          const [outerCol, innerCol] = autumnPairs[lf.colorIdx];
          ctx.save();
          ctx.translate(lf.x, lf.y);
          ctx.rotate(lf.angle);
          ctx.scale(1, 0.48 + 0.52 * Math.abs(Math.cos(lf.flipPhase)));
          ctx.globalAlpha = lf.alpha;
          drawMapleLeaf(ctx, lf.size, outerCol, innerCol);
          ctx.restore();
        }
      } else if (effectiveMotion === 'winter') {
        if (isDark) drawAmbientStars(dt);
        for (const f of flakes) {
          if (!prefersReducedMotion) {
            f.swayPhase += f.swaySpeed * dt;
            f.angle += f.spin * dt;
            f.x += (f.vx + Math.sin(f.swayPhase) * 14) * dt;
            f.y += f.vy * dt;
            if (f.y > height + 20) {
              f.y = -16;
              f.x = Math.random() * width;
            }
            if (f.x > width + 20) f.x = -16;
            if (f.x < -20) f.x = width + 16;
          }
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.globalAlpha = f.alpha;
          if (f.kind === 'bokeh') {
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, f.r);
            grad.addColorStop(0, isDark ? 'rgba(240, 249, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.6, isDark ? 'rgba(186, 230, 253, 0.42)' : 'rgba(226, 232, 240, 0.45)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, f.r, 0, Math.PI * 2);
            ctx.fill();
          } else if (f.kind === 'crystal') {
            ctx.rotate(f.angle);
            drawSnowCrystal(ctx, f.r, isDark ? '#e0f2fe' : '#64748b');
          } else {
            ctx.fillStyle = isDark ? '#f8fafc' : '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, f.r, 0, Math.PI * 2);
            ctx.fill();
            if (!isDark) {
              ctx.strokeStyle = 'rgba(100, 116, 139, 0.30)';
              ctx.lineWidth = 0.65;
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      } else if (effectiveMotion === 'space') {
        // Multi-magnitude twinkling starfield with diffraction spikes on brightest stars
        for (const st of stars) {
          if (!prefersReducedMotion) {
            st.phase += st.speed * dt;
          }
          const twinkle = 0.44 + 0.56 * (0.5 + 0.5 * Math.sin(st.phase));
          const alpha = st.baseAlpha * twinkle;
          ctx.save();
          if (st.halo) {
            const haloR = st.r * (st.hasSpikes ? 5.2 : 3.4);
            const hGrad = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, haloR);
            hGrad.addColorStop(0, st.color);
            hGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.globalAlpha = alpha * 0.34;
            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.arc(st.x, st.y, haloR, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = alpha;
          ctx.fillStyle = st.color;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx.fill();

          if (st.hasSpikes) {
            const spLen = st.r * (3.8 + twinkle * 2.4);
            ctx.strokeStyle = st.color;
            ctx.lineWidth = 0.85;
            ctx.globalAlpha = alpha * 0.72;
            ctx.beginPath();
            ctx.moveTo(st.x - spLen, st.y);
            ctx.lineTo(st.x + spLen, st.y);
            ctx.moveTo(st.x, st.y - spLen);
            ctx.lineTo(st.x, st.y + spLen);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Occasional quiet shooting stars with glowing plasma heads
        if (!prefersReducedMotion) {
          shootCooldown -= dt;
          if (shootCooldown <= 0 && shootingStars.length < 2) {
            shootingStars.push({
              x: width * (0.22 + Math.random() * 0.68),
              y: height * (0.06 + Math.random() * 0.30),
              vx: -290 - Math.random() * 145,
              vy: 140 + Math.random() * 90,
              len: 95 + Math.random() * 75,
              life: 0,
              maxLife: 0.78 + Math.random() * 0.42,
            });
            shootCooldown = 2.8 + Math.random() * 4.2;
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
            const alpha = Math.sin(progress * Math.PI) * 0.92;
            const speedMag = Math.hypot(ss.vx, ss.vy) || 1;
            const tailX = ss.x - (ss.vx / speedMag) * ss.len;
            const tailY = ss.y - (ss.vy / speedMag) * ss.len;

            if (
              !Number.isFinite(ss.x) ||
              !Number.isFinite(ss.y) ||
              !Number.isFinite(tailX) ||
              !Number.isFinite(tailY)
            ) {
              continue;
            }

            const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(0.28, `rgba(186, 230, 253, ${alpha * 0.72})`);
            grad.addColorStop(1, 'rgba(125, 211, 252, 0)');

            ctx.save();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.0;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ss.x, ss.y, 1.9, 0, Math.PI * 2);
            ctx.fill();
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
      <CelestialSkyAccents motion={effectiveMotion} isDark={isDark} />
      <GroundScenery motion={effectiveMotion} isDark={isDark} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
