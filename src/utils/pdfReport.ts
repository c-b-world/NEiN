import { geoCircle, geoPath } from 'd3';
import { jsPDF } from 'jspdf';
import type { P2PQuakeRecord } from '../types/quake';
import {
  createEpicenterProjection,
  getJapanAndNeighborFeatures,
  getNearbyCities,
  kmToGeoDegrees,
} from './d3MapUtils';
import { type PdfReportModel, buildPdfReportModel } from './pdfReportModel';

const PAGE_W = 1240; // A4 @ ~150dpi
const PAGE_H = 1754;
const MARGIN_X = 72;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const FOOTER_Y = PAGE_H - 56;
const MAX_BODY_Y = PAGE_H - 94;
const FONT_SANS =
  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif';
const FONT_MONO =
  '"JetBrains Mono", "Noto Sans JP", ui-monospace, monospace';

function createPageCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('PDF描画用の2Dコンテキストを初期化できませんでした');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  return { canvas, ctx };
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  model: PdfReportModel,
  isContinuation: boolean
): number {
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, PAGE_W, isContinuation ? 84 : 112);

  ctx.fillStyle = model.isTest ? '#D97706' : '#0284C7';
  ctx.fillRect(0, isContinuation ? 80 : 108, PAGE_W, 4);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${isContinuation ? 22 : 28}px ${FONT_SANS}`;
  ctx.fillText('NEiN 防災情報レポート', MARGIN_X, isContinuation ? 48 : 56);

  if (!isContinuation) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = `500 17px ${FONT_SANS}`;
    ctx.fillText(
      `記録ID: ${model.recordId}  /  出力日時: ${model.issuedAt}`,
      MARGIN_X,
      86
    );
  } else {
    ctx.fillStyle = '#94A3B8';
    ctx.font = `500 17px ${FONT_SANS}`;
    ctx.fillText(`${model.title}（${model.occurredAt}）続き`, MARGIN_X + 300, 48);
  }

  return isContinuation ? 116 : 150;
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  pageIndex: number,
  totalPages: number
): void {
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, FOOTER_Y - 22);
  ctx.lineTo(PAGE_W - MARGIN_X, FOOTER_Y - 22);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = `400 15px ${FONT_SANS}`;
  ctx.fillText(
    '出典：P2P地震情報 API (v2) / 気象庁　｜　NEiN Disaster Intelligence System',
    MARGIN_X,
    FOOTER_Y
  );

  const pageLabel = `${pageIndex} / ${totalPages}`;
  ctx.font = `600 15px ${FONT_MONO}`;
  const w = ctx.measureText(pageLabel).width;
  ctx.fillText(pageLabel, PAGE_W - MARGIN_X - w, FOOTER_Y);
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawEpicenterMapPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  model: PdfReportModel
): void {
  drawRoundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = `700 18px ${FONT_SANS}`;
  ctx.fillText('震源位置マップ', x + 20, y + 34);

  const mapX = x + 16;
  const mapY = y + 48;
  const mapW = w - 32;
  const mapH = h - 86;

  ctx.save();
  drawRoundRect(ctx, mapX, mapY, mapW, mapH, 6);
  ctx.clip();

  ctx.fillStyle = '#E2EDF8';
  ctx.fillRect(mapX, mapY, mapW, mapH);

  const projection = createEpicenterProjection({
    width: mapW,
    height: mapH,
    mode: model.coordinates ? 'vicinity' : 'national',
    centerLat: model.coordinates?.latitude,
    centerLon: model.coordinates?.longitude,
  });

  ctx.translate(mapX, mapY);
  const path = geoPath(projection, ctx);
  const { japan, neighbors } = getJapanAndNeighborFeatures();

  ctx.fillStyle = '#E2E8F0';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  for (const neighbor of neighbors) {
    ctx.beginPath();
    path(neighbor);
    ctx.fill();
    ctx.stroke();
  }

  if (japan) {
    ctx.fillStyle = '#CBD5E1';
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    path(japan);
    ctx.fill();
    ctx.stroke();
  }

  if (model.coordinates) {
    const { latitude, longitude } = model.coordinates;
    const isUrgent = model.categoryLabel.includes('緊急地震速報');
    const accent = isUrgent ? '#DC2626' : '#0284C7';

    for (const km of [50, 100, 200]) {
      const circle = geoCircle()
        .center([longitude, latitude])
        .radius(kmToGeoDegrees(km))();
      ctx.beginPath();
      path(circle);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = km === 50 ? 0.65 : 0.35;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    const nearby = getNearbyCities(latitude, longitude, 4);
    for (const city of nearby) {
      const pt = projection([city.lon, city.lat]);
      if (!pt) continue;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `500 13px ${FONT_SANS}`;
      ctx.fillText(city.name, pt[0] + 6, pt[1] + 4);
    }

    const epiPt = projection([longitude, latitude]);
    if (epiPt) {
      const [ex, ey] = epiPt;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(ex, ey, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ex - 5, ey - 5);
      ctx.lineTo(ex + 5, ey + 5);
      ctx.moveTo(ex + 5, ey - 5);
      ctx.lineTo(ex - 5, ey + 5);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#475569';
    ctx.font = `500 16px ${FONT_SANS}`;
    ctx.fillText('震源座標情報なし', 20, mapH / 2);
  }

  ctx.restore();

  ctx.fillStyle = '#475569';
  ctx.font = `500 14px ${FONT_MONO}`;
  const coordFooter = model.coordinates
    ? `北緯 ${model.coordinates.latitude.toFixed(1)}° / 東経 ${model.coordinates.longitude.toFixed(1)}°`
    : '座標未収録';
  ctx.fillText(coordFooter, x + 20, y + h - 14);
}

function drawDistributionChartPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  model: PdfReportModel
): void {
  drawRoundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const dist = model.scaleDistribution;
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 18px ${FONT_SANS}`;
  ctx.fillText(dist.title, x + 20, y + 34);

  const totalText = `合計 ${dist.totalCount} ${dist.unitLabel}`;
  ctx.font = `600 15px ${FONT_MONO}`;
  ctx.fillStyle = '#475569';
  const tw = ctx.measureText(totalText).width;
  ctx.fillText(totalText, x + w - 20 - tw, y + 34);

  if (dist.totalCount === 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = `400 15px ${FONT_SANS}`;
    ctx.fillText('震度分布データはありません。', x + 24, y + h / 2);
    return;
  }

  const plotX = x + 46;
  const plotY = y + 66;
  const plotW = w - 68;
  const plotH = h - 114;

  const maxCount = Math.max(1, ...dist.bins.map((b) => b.count));

  // Horizontal grid lines
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const gy = plotY + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(plotX, gy);
    ctx.lineTo(plotX + plotW, gy);
    ctx.stroke();
  }

  const slotW = plotW / dist.bins.length;
  const barW = Math.min(34, slotW * 0.62);

  dist.bins.forEach((bin, idx) => {
    const cx = plotX + slotW * idx + slotW / 2;
    const bx = cx - barW / 2;

    if (bin.count > 0) {
      const barH = Math.max(6, (bin.count / maxCount) * (plotH - 22));
      const by = plotY + plotH - barH;
      drawRoundRect(ctx, bx, by, barW, barH, 4);
      ctx.fillStyle = bin.color;
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = `700 13px ${FONT_MONO}`;
      const label = String(bin.count);
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, cx - lw / 2, by - 6);
    }

    ctx.fillStyle = '#475569';
    ctx.font = `600 13px ${FONT_SANS}`;
    const slw = ctx.measureText(bin.shortLabel).width;
    ctx.fillText(bin.shortLabel, cx - slw / 2, plotY + plotH + 22);
  });
}

function wrapLinesByWidth(
  ctx: CanvasRenderingContext2D,
  tokens: string[],
  separator: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let current = '';

  for (const token of tokens) {
    const candidate = current ? `${current}${separator}${token}` : token;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
        current = token;
      } else {
        lines.push(token);
        current = '';
      }
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

export async function exportQuakePdfReport(
  record: P2PQuakeRecord
): Promise<{ filename: string; pageCount: number }> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const model = buildPdfReportModel(record);
  const pages: Array<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> = [];

  const startNewPage = (isContinuation: boolean) => {
    const page = createPageCanvas();
    pages.push(page);
    const y = drawHeader(page.ctx, model, isContinuation);
    return { ...page, y };
  };

  let cur = startNewPage(false);

  // Category & Timestamp
  cur.ctx.fillStyle = model.isTest ? '#B45309' : '#0369A1';
  cur.ctx.font = `700 18px ${FONT_SANS}`;
  const tagText = model.isTest
    ? `${model.categoryLabel}  ·  テスト配信データ  ·  ${model.occurredAt}`
    : `${model.categoryLabel}  ·  ${model.occurredAt}`;
  cur.ctx.fillText(tagText, MARGIN_X, cur.y);
  cur.y += 42;

  // Main Title
  cur.ctx.fillStyle = '#0F172A';
  cur.ctx.font = `700 36px ${FONT_SANS}`;
  cur.ctx.fillText(model.title, MARGIN_X, cur.y);
  cur.y += 32;

  // 4-column Metrics Strip
  const cardGap = 14;
  const cardW = (CONTENT_W - cardGap * 3) / 4;
  const cardH = 92;
  model.metrics.forEach((m, idx) => {
    const mx = MARGIN_X + idx * (cardW + cardGap);
    drawRoundRect(cur.ctx, mx, cur.y, cardW, cardH, 8);
    cur.ctx.fillStyle = idx === 0 ? '#F1F5F9' : '#F8FAFC';
    cur.ctx.fill();
    cur.ctx.strokeStyle = idx === 0 ? '#94A3B8' : '#CBD5E1';
    cur.ctx.lineWidth = 1.5;
    cur.ctx.stroke();

    cur.ctx.fillStyle = '#64748B';
    cur.ctx.font = `600 15px ${FONT_SANS}`;
    cur.ctx.fillText(m.label, mx + 16, cur.y + 30);

    cur.ctx.fillStyle = '#0F172A';
    cur.ctx.font = `700 22px ${FONT_SANS}`;
    cur.ctx.fillText(m.value, mx + 16, cur.y + 68, cardW - 32);
  });
  cur.y += cardH + 26;

  // Map & Distribution Chart 2-col row
  const panelGap = 20;
  const panelW = (CONTENT_W - panelGap) / 2;
  const panelH = 380;
  drawEpicenterMapPanel(cur.ctx, MARGIN_X, cur.y, panelW, panelH, model);
  drawDistributionChartPanel(
    cur.ctx,
    MARGIN_X + panelW + panelGap,
    cur.y,
    panelW,
    panelH,
    model
  );
  cur.y += panelH + 34;

  const ensureSpace = (neededH: number) => {
    if (cur.y + neededH > MAX_BODY_Y) {
      cur = startNewPage(true);
    }
  };

  // Detailed Municipality / Area Breakdown
  if (model.municipalityGroups.length > 0) {
    ensureSpace(64);
    cur.ctx.fillStyle = '#0F172A';
    cur.ctx.font = `700 22px ${FONT_SANS}`;
    cur.ctx.fillText('各地の震度（市区町村別）', MARGIN_X, cur.y);
    cur.y += 14;
    cur.ctx.strokeStyle = '#0F172A';
    cur.ctx.lineWidth = 2;
    cur.ctx.beginPath();
    cur.ctx.moveTo(MARGIN_X, cur.y);
    cur.ctx.lineTo(PAGE_W - MARGIN_X, cur.y);
    cur.ctx.stroke();
    cur.y += 28;

    for (const group of model.municipalityGroups) {
      ensureSpace(64);
      drawRoundRect(cur.ctx, MARGIN_X, cur.y - 24, 118, 32, 6);
      cur.ctx.fillStyle = '#0F172A';
      cur.ctx.fill();
      cur.ctx.fillStyle = '#FFFFFF';
      cur.ctx.font = `700 17px ${FONT_SANS}`;
      cur.ctx.fillText(`〔${group.scaleLabel}〕`, MARGIN_X + 10, cur.y - 2);
      cur.y += 24;

      for (const p of group.prefectures) {
        cur.ctx.font = `400 17px ${FONT_SANS}`;
        const wrappedLines = wrapLinesByWidth(
          cur.ctx,
          p.cities,
          '　',
          CONTENT_W - 24
        );
        const blockH = 26 + wrappedLines.length * 26 + 10;
        ensureSpace(Math.min(blockH, 80));

        cur.ctx.fillStyle = '#0F172A';
        cur.ctx.font = `700 18px ${FONT_SANS}`;
        cur.ctx.fillText(`█ ${p.pref}`, MARGIN_X + 6, cur.y);
        cur.y += 28;

        cur.ctx.fillStyle = '#334155';
        cur.ctx.font = `400 17px ${FONT_SANS}`;
        for (const line of wrappedLines) {
          ensureSpace(30);
          cur.ctx.fillText(line, MARGIN_X + 16, cur.y);
          cur.y += 26;
        }
        cur.y += 8;
      }
      cur.y += 10;
    }
  } else if (model.eewAreas.length > 0) {
    ensureSpace(80);
    cur.ctx.fillStyle = '#0F172A';
    cur.ctx.font = `700 22px ${FONT_SANS}`;
    cur.ctx.fillText('緊急地震速報 警報対象地域・予想震度', MARGIN_X, cur.y);
    cur.y += 28;

    for (const area of model.eewAreas) {
      ensureSpace(36);
      cur.ctx.fillStyle = '#0F172A';
      cur.ctx.font = `600 17px ${FONT_SANS}`;
      cur.ctx.fillText(`• ${area.name}`, MARGIN_X + 8, cur.y);
      cur.ctx.fillStyle = '#B91C1C';
      cur.ctx.font = `700 17px ${FONT_MONO}`;
      cur.ctx.fillText(area.scaleText, MARGIN_X + 340, cur.y);
      cur.y += 30;
    }
  } else if (model.tsunamiAreas.length > 0) {
    ensureSpace(80);
    cur.ctx.fillStyle = '#0F172A';
    cur.ctx.font = `700 22px ${FONT_SANS}`;
    cur.ctx.fillText('津波予報 対象沿岸地域', MARGIN_X, cur.y);
    cur.y += 28;

    for (const area of model.tsunamiAreas) {
      ensureSpace(36);
      cur.ctx.fillStyle = '#0F172A';
      cur.ctx.font = `600 17px ${FONT_SANS}`;
      cur.ctx.fillText(`• ${area.name}`, MARGIN_X + 8, cur.y);
      cur.ctx.fillStyle = '#0369A1';
      cur.ctx.font = `700 17px ${FONT_SANS}`;
      cur.ctx.fillText(area.gradeText, MARGIN_X + 340, cur.y);
      cur.y += 30;
    }
  }

  if (model.comment) {
    ensureSpace(64);
    cur.y += 12;
    cur.ctx.fillStyle = '#475569';
    cur.ctx.font = `600 16px ${FONT_SANS}`;
    const commentLines = wrapLinesByWidth(
      cur.ctx,
      model.comment.split(''),
      '',
      CONTENT_W
    );
    for (const line of commentLines) {
      ensureSpace(26);
      cur.ctx.fillText(line, MARGIN_X, cur.y);
      cur.y += 24;
    }
  }

  const totalPages = pages.length;
  pages.forEach((p, idx) => drawFooter(p.ctx, idx + 1, totalPages));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pages.forEach((p, idx) => {
    if (idx > 0) {
      doc.addPage();
    }
    const imgData = p.canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  });

  doc.save(model.filename);
  return { filename: model.filename, pageCount: totalPages };
}
