import PptxGenJS from 'pptxgenjs';
import type { SurveyProject, SurveySite, StickerOverlay } from '@/types/survey';
import { computeProjectStats, urlToDataUrl } from '@/lib/exifAndCoords';
import { DIAGRAM_NODE_SLOTS, getNodeImagePath } from '@/components/studio/ConceptDiagramCanvas';

const FONT_MAIN = 'TH Sarabun New';
const NT_YELLOW = 'FFD100';
const NT_GOLD = 'FFC000';
const TEXT_DARK = '1F2937';

async function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 4, h: 3 });
    img.src = dataUrl;
  });
}

function fitRect(
  natW: number,
  natH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
) {
  const ratio = Math.min(boxW / natW, boxH / natH);
  const w = natW * ratio;
  const h = natH * ratio;
  return {
    x: boxX + (boxW - w) / 2,
    y: boxY + (boxH - h) / 2,
    w,
    h,
  };
}

interface TemplateAssets {
  ntLogoHeader: string;
  ntCyfenceFooter: string;
  ntLogoLarge: string;
  coverCapsules: string;
  backCoverBg: string;
  stickerCamera: string;
  stickerCameraLeft: string;
  stickerCabinet: string;
  stickerMeter: string;
  shopDrawingDefault: string;
  controlTv: string;
  controlRack: string;
  controlRackFull: string;
  nodeCabinet: string;
  nodeLeft1: string;
  nodeLeft2: string;
  nodeLeft3: string;
  nodeRight1: string;
  nodeRight2: string;
  nodeRight3: string;
}

async function loadTemplateAssets(): Promise<TemplateAssets> {
  const [
    ntLogoHeader,
    ntCyfenceFooter,
    ntLogoLarge,
    coverCapsules,
    backCoverBg,
    stickerCamera,
    stickerCameraLeft,
    stickerCabinet,
    stickerMeter,
    shopDrawingDefault,
    controlTv,
    controlRack,
    controlRackFull,
    nodeCabinet,
    nodeLeft1,
    nodeLeft2,
    nodeLeft3,
    nodeRight1,
    nodeRight2,
    nodeRight3,
  ] = await Promise.all([
    urlToDataUrl('./assets/template/nt-logo-header.jpeg'),
    urlToDataUrl('./assets/template/nt-cyfence-footer.png'),
    urlToDataUrl('./assets/template/nt-logo-large.png'),
    urlToDataUrl('./assets/template/cover-capsules.png'),
    urlToDataUrl('./assets/template/back-cover-bg.jpeg'),
    urlToDataUrl('./assets/template/sticker-camera.png'),
    urlToDataUrl('./assets/template/sticker-camera-left.png'),
    urlToDataUrl('./assets/template/sticker-cabinet.png'),
    urlToDataUrl('./assets/template/sticker-meter.png'),
    urlToDataUrl('./assets/template/shop-drawing-default.png'),
    urlToDataUrl('./assets/template/control-tv.png'),
    urlToDataUrl('./assets/template/control-rack.png'),
    urlToDataUrl('./assets/template/control-rack-full.png'),
    urlToDataUrl('./assets/template/node-cabinet.jpeg'),
    urlToDataUrl('./assets/template/node-left-1cam.png'),
    urlToDataUrl('./assets/template/node-left-2cam.png'),
    urlToDataUrl('./assets/template/node-left-3cam.png'),
    urlToDataUrl('./assets/template/node-right-1cam.png'),
    urlToDataUrl('./assets/template/node-right-2cam.png'),
    urlToDataUrl('./assets/template/node-right-3cam.png'),
  ]);

  return {
    ntLogoHeader,
    ntCyfenceFooter,
    ntLogoLarge,
    coverCapsules,
    backCoverBg,
    stickerCamera,
    stickerCameraLeft,
    stickerCabinet,
    stickerMeter,
    shopDrawingDefault,
    controlTv,
    controlRack,
    controlRackFull,
    nodeCabinet,
    nodeLeft1,
    nodeLeft2,
    nodeLeft3,
    nodeRight1,
    nodeRight2,
    nodeRight3,
  };
}

function addMasterBranding(
  pres: PptxGenJS,
  slide: PptxGenJS.Slide,
  assets: TemplateAssets,
  heading?: string
) {
  slide.background = { color: 'FFFFFF' };

  if (assets.ntLogoHeader) {
    slide.addImage({
      data: assets.ntLogoHeader,
      x: 0.25,
      y: 0.12,
      w: 2.75,
      h: 0.62,
    });
  }

  // Top-right yellow accent bar
  slide.addShape(pres.ShapeType.roundRect, {
    x: 13.02,
    y: 0.22,
    w: 0.1,
    h: 0.92,
    fill: { color: NT_YELLOW },
    line: { type: 'none' },
    rectRadius: 0.5,
  });

  if (heading) {
    slide.addText(heading, {
      x: 4.5,
      y: 0.2,
      w: 8.35,
      h: 0.55,
      fontFace: FONT_MAIN,
      fontSize: 22,
      bold: true,
      color: TEXT_DARK,
      align: 'right',
      valign: 'middle',
    });
  }

  if (assets.ntCyfenceFooter) {
    slide.addImage({
      data: assets.ntCyfenceFooter,
      x: 0.15,
      y: 6.9,
      w: 1.25,
      h: 0.45,
    });
  }

  slide.addText('© National Telecom All Rights Reserved', {
    x: 9.75,
    y: 7.12,
    w: 3.1,
    h: 0.25,
    fontFace: 'Tahoma',
    fontSize: 8.5,
    color: '333333',
    align: 'right',
  });

  // Bottom-right yellow tab
  slide.addShape(pres.ShapeType.roundRect, {
    x: 12.88,
    y: 7.12,
    w: 0.18,
    h: 0.38,
    fill: { color: NT_YELLOW },
    line: { type: 'none' },
    rectRadius: 0.3,
  });
}

function addPoleStickers(
  pres: PptxGenJS,
  slide: PptxGenJS.Slide,
  stickers: StickerOverlay[],
  imgBox: { x: number; y: number; w: number; h: number },
  assets: TemplateAssets
) {
  for (const st of stickers) {
    const px = imgBox.x + (st.x / 100) * imgBox.w;
    const py = imgBox.y + (st.y / 100) * imgBox.h;

    if (st.type === 'pole') {
      const pw = ((st.w ?? 4) / 100) * imgBox.w;
      const ph = ((st.h ?? 65) / 100) * imgBox.h;
      slide.addShape(pres.ShapeType.rect, {
        x: px - pw / 2,
        y: py - ph / 2,
        w: pw,
        h: ph,
        fill: { color: 'FF0000' },
        line: { color: '990000', pt: 0.75 },
      });
    } else if (st.type === 'camera' && assets.stickerCamera) {
      const w = 0.68;
      const h = 0.42;
      const camData =
        st.direction === 'left' && assets.stickerCameraLeft
          ? assets.stickerCameraLeft
          : assets.stickerCamera;
      slide.addImage({
        data: camData,
        x: px - w / 2,
        y: py - h / 2,
        w,
        h,
      });
    } else if (st.type === 'cabinet' && assets.stickerCabinet) {
      const w = 0.48;
      const h = 0.56;
      slide.addImage({
        data: assets.stickerCabinet,
        x: px - w / 2,
        y: py - h / 2,
        w,
        h,
      });
    } else if (st.type === 'cam-label' || st.type === 'cabinet-label') {
      const w = st.type === 'cabinet-label' ? 1.35 : 0.98;
      const h = 0.36;
      slide.addShape(pres.ShapeType.rect, {
        x: px - w / 2,
        y: py - h / 2,
        w,
        h,
        fill: { color: NT_GOLD },
        line: { color: 'FFFFFF', pt: 1.5 },
      });
      slide.addText(st.label, {
        x: px - w / 2,
        y: py - h / 2,
        w,
        h,
        fontFace: FONT_MAIN,
        fontSize: 13,
        bold: true,
        color: '111827',
        align: 'center',
        valign: 'middle',
      });
    }
  }
}

function addSatelliteStickers(
  pres: PptxGenJS,
  slide: PptxGenJS.Slide,
  stickers: StickerOverlay[],
  imgBox: { x: number; y: number; w: number; h: number },
  assets: TemplateAssets
) {
  for (const st of stickers) {
    const px = imgBox.x + (st.x / 100) * imgBox.w;
    const py = imgBox.y + (st.y / 100) * imgBox.h;

    if (st.type === 'cam-cone') {
      // Yellow FOV cone wedge + red camera dot + label pill
      const angle = st.rotation ?? 0;
      const rad = (angle * Math.PI) / 180;
      const coneLen = 0.72;
      const cx = px + Math.cos(rad) * 0.28;
      const cy = py + Math.sin(rad) * 0.28;

      slide.addShape(pres.ShapeType.triangle, {
        x: cx - 0.32,
        y: cy - coneLen / 2,
        w: 0.64,
        h: coneLen,
        rotate: (angle + 270) % 360,
        fill: { color: NT_YELLOW, transparency: 55 },
        line: { type: 'none' },
      });

      slide.addShape(pres.ShapeType.roundRect, {
        x: px - 0.12,
        y: py - 0.08,
        w: 0.24,
        h: 0.16,
        rotate: angle,
        fill: { color: 'DC2626' },
        line: { color: 'FFFFFF', pt: 0.75 },
        rectRadius: 0.2,
      });

      slide.addShape(pres.ShapeType.roundRect, {
        x: px - 0.22,
        y: py - 0.36,
        w: 0.44,
        h: 0.22,
        fill: { color: 'FFFFFF' },
        line: { color: 'EA580C', pt: 1.2 },
        rectRadius: 0.2,
      });
      slide.addText(st.label, {
        x: px - 0.22,
        y: py - 0.36,
        w: 0.44,
        h: 0.22,
        fontFace: FONT_MAIN,
        fontSize: 11,
        bold: true,
        color: '111827',
        align: 'center',
        valign: 'middle',
      });
    } else if (st.type === 'callout') {
      const w = 1.15;
      const h = 0.62;
      slide.addShape(pres.ShapeType.wedgeRoundRectCallout, {
        x: px - w / 2,
        y: py - h / 2,
        w,
        h,
        fill: { color: 'FFFFFF' },
        line: { color: '111827', pt: 1 },
      });
      slide.addText(st.label, {
        x: px - w / 2 + 0.04,
        y: py - h / 2 + 0.02,
        w: w - 0.08,
        h: h - 0.04,
        fontFace: FONT_MAIN,
        fontSize: 12,
        bold: true,
        color: '111827',
        align: 'center',
        valign: 'middle',
      });
    } else if (st.type === 'meter') {
      const w = 0.92;
      const h = 0.74;
      slide.addShape(pres.ShapeType.wedgeRoundRectCallout, {
        x: px - w / 2,
        y: py - h / 2 + 0.15,
        w,
        h,
        fill: { color: 'FFFFFF' },
        line: { color: '111827', pt: 1 },
      });
      if (assets.stickerMeter) {
        slide.addImage({
          data: assets.stickerMeter,
          x: px - 0.24,
          y: py - 0.16,
          w: 0.48,
          h: 0.6,
        });
      }
      slide.addShape(pres.ShapeType.rect, {
        x: px - 0.68,
        y: py - 0.64,
        w: 1.36,
        h: 0.32,
        fill: { color: 'FFFFFF' },
        line: { color: NT_GOLD, pt: 1.2 },
      });
      slide.addText(st.label || 'จุดติดตั้งมิเตอร์', {
        x: px - 0.68,
        y: py - 0.64,
        w: 1.36,
        h: 0.32,
        fontFace: FONT_MAIN,
        fontSize: 12,
        bold: true,
        color: '111827',
        align: 'center',
        valign: 'middle',
      });
    } else if (st.type === 'cat6') {
      const w = 0.62;
      const h = 0.24;
      slide.addShape(pres.ShapeType.roundRect, {
        x: px - w / 2,
        y: py - h / 2,
        w,
        h,
        fill: { color: 'FFFFFF' },
        line: { color: '0284C7', pt: 1.2 },
        rectRadius: 0.2,
      });
      slide.addText(st.label || 'CAT6', {
        x: px - w / 2,
        y: py - h / 2,
        w,
        h,
        fontFace: FONT_MAIN,
        fontSize: 10,
        bold: true,
        color: '0369A1',
        align: 'center',
        valign: 'middle',
      });
    }
  }
}

export async function generateSurveyPptx(project: SurveyProject): Promise<void> {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 inches (16:9)
  pres.title = `${project.projectTitle} ${project.organizationName}`;
  pres.author = 'NT CCTV Survey Report Generator';

  const assets = await loadTemplateAssets();
  const stats = computeProjectStats(project);

  // =========================================================
  // SLIDE 1: COVER
  // =========================================================
  {
    const s1 = pres.addSlide();
    s1.background = { color: 'FFFFFF' };
    if (assets.coverCapsules) {
      s1.addImage({
        data: assets.coverCapsules,
        x: 0.55,
        y: 1.65,
        w: 5.5,
        h: 4.15,
      });
    }
    if (assets.ntLogoLarge) {
      s1.addImage({
        data: assets.ntLogoLarge,
        x: 8.35,
        y: 2.35,
        w: 3.15,
        h: 1.28,
      });
    }
    s1.addText(
      [
        { text: `${project.projectTitle}\n`, options: { fontSize: 36, bold: true, color: '595959' } },
        { text: `${project.organizationName}\n`, options: { fontSize: 34, bold: true, color: '595959' } },
        { text: project.surveyDate, options: { fontSize: 30, bold: true, color: '595959' } },
      ],
      {
        x: 5.1,
        y: 4.55,
        w: 7.8,
        h: 2.45,
        fontFace: FONT_MAIN,
        align: 'center',
        valign: 'top',
      }
    );
    s1.addText('© National Telecom All Rights Reserved', {
      x: 9.75,
      y: 7.12,
      w: 3.1,
      h: 0.25,
      fontFace: 'Tahoma',
      fontSize: 8.5,
      color: '333333',
      align: 'right',
    });
  }

  // =========================================================
  // SLIDE 2: OVERVIEW MAP WITH RED PINS
  // =========================================================
  {
    const s2 = pres.addSlide();
    addMasterBranding(pres, s2, assets, `จุดติดตั้งกล้องทั้งหมดในพื้นที่ ${project.organizationShortName}`);

    const mapBox = { x: 2.0, y: 0.88, w: 9.3, h: 5.95 };
    let actualBox = mapBox;
    if (project.overviewMapImage) {
      const data = await urlToDataUrl(project.overviewMapImage);
      const dim = await getImageDimensions(data);
      actualBox = fitRect(dim.w, dim.h, mapBox.x, mapBox.y, mapBox.w, mapBox.h);
      s2.addImage({ data, ...actualBox });
    } else {
      s2.addShape(pres.ShapeType.rect, {
        ...mapBox,
        fill: { color: 'F1F5F9' },
        line: { color: 'CBD5E1', pt: 1, dashType: 'dash' },
      });
      s2.addText('ยังไม่ได้อัปโหลดรูปแผนที่ภาพรวมพื้นที่', {
        ...mapBox,
        fontFace: FONT_MAIN,
        fontSize: 18,
        color: '64748B',
        align: 'center',
        valign: 'middle',
      });
    }

    // Native movable red pins
    for (const site of project.sites) {
      const px = actualBox.x + ((site.mapPinX ?? 50) / 100) * actualBox.w;
      const py = actualBox.y + ((site.mapPinY ?? 50) / 100) * actualBox.h;
      s2.addShape(pres.ShapeType.line, {
        x: px,
        y: py - 0.14,
        w: 0,
        h: 0.14,
        line: { color: 'C00000', pt: 2.5 },
      });
      s2.addShape(pres.ShapeType.ellipse, {
        x: px - 0.09,
        y: py - 0.3,
        w: 0.18,
        h: 0.18,
        fill: { color: 'FF0000' },
        line: { color: 'C00000', pt: 1 },
      });
    }
  }

  // =========================================================
  // SLIDE 3: OVERVIEW SATELLITE MAP WITH CALLOUTS
  // =========================================================
  {
    const s3 = pres.addSlide();
    addMasterBranding(pres, s3, assets, `แผนผังจุดติดตั้งกล้อง CCTV ${project.organizationShortName}`);

    const satBox = { x: 1.25, y: 0.85, w: 10.85, h: 5.85 };
    let actualBox = satBox;
    if (project.overviewSatImage) {
      const data = await urlToDataUrl(project.overviewSatImage);
      const dim = await getImageDimensions(data);
      actualBox = fitRect(dim.w, dim.h, satBox.x, satBox.y, satBox.w, satBox.h);
      s3.addImage({ data, ...actualBox });
    } else {
      s3.addShape(pres.ShapeType.rect, {
        ...satBox,
        fill: { color: '0F172A' },
        line: { color: '334155', pt: 1 },
      });
      s3.addText('ยังไม่ได้อัปโหลดภาพดาวเทียมภาพรวม', {
        ...satBox,
        fontFace: FONT_MAIN,
        fontSize: 18,
        color: '94A3B8',
        align: 'center',
        valign: 'middle',
      });
    }

    for (const site of project.sites) {
      const px = actualBox.x + ((site.satCalloutX ?? 50) / 100) * actualBox.w;
      const py = actualBox.y + ((site.satCalloutY ?? 50) / 100) * actualBox.h;
      const label = `จุดที่ ${site.siteNumber} ${site.siteName}`;
      const w = Math.min(2.8, Math.max(1.3, label.length * 0.075));
      const h = 0.32;
      s3.addShape(pres.ShapeType.wedgeRoundRectCallout, {
        x: Math.max(0.4, Math.min(12.9 - w, px - w / 2)),
        y: Math.max(0.85, Math.min(6.4, py - h / 2)),
        w,
        h,
        fill: { color: 'FFFFFF' },
        line: { color: '475569', pt: 0.75 },
      });
      s3.addText(label, {
        x: Math.max(0.4, Math.min(12.9 - w, px - w / 2)),
        y: Math.max(0.85, Math.min(6.4, py - h / 2)),
        w,
        h,
        fontFace: FONT_MAIN,
        fontSize: 10.5,
        bold: true,
        color: '111827',
        highlight: '00FFFF',
        align: 'center',
        valign: 'middle',
      });
    }

    if (project.googleMapsUrl) {
      s3.addText(project.googleMapsUrl, {
        x: 1.5,
        y: 7.05,
        w: 8.2,
        h: 0.25,
        fontFace: 'Tahoma',
        fontSize: 9.5,
        color: '334155',
      });
    }
  }

  // =========================================================
  // SLIDE 4: SUMMARY TABLE (Auto-paginated if > 12 sites)
  // =========================================================
  const TABLE_CHUNK = 12;
  const siteChunks: SurveySite[][] = [];
  for (let i = 0; i < project.sites.length; i += TABLE_CHUNK) {
    siteChunks.push(project.sites.slice(i, i + TABLE_CHUNK));
  }
  if (siteChunks.length === 0) siteChunks.push([]);

  siteChunks.forEach((chunk, pageIdx) => {
    const s4 = pres.addSlide();
    addMasterBranding(
      pres,
      s4,
      assets,
      `แผนผังจุดติดตั้งกล้อง CCTV ${project.organizationShortName}${
        siteChunks.length > 1 ? ` (${pageIdx + 1}/${siteChunks.length})` : ''
      }`
    );

    const rows: PptxGenJS.TableRow[] = [];

    // Header Row 1
    rows.push([
      { text: 'จุดที่', options: { rowspan: 2, bold: true, fill: { color: 'FFFFFF' } } },
      { text: 'ชื่อจุด', options: { rowspan: 2, bold: true, fill: { color: 'FFFFFF' } } },
      { text: 'พิกัด', options: { colspan: 2, bold: true, fill: { color: 'FFFFFF' } } },
      { text: 'จำนวน\nกล้อง', options: { rowspan: 2, bold: true, fill: { color: 'FFFFFF' } } },
      { text: 'ซับพอร์ต (เมตร)', options: { colspan: 4, bold: true, fill: { color: 'FFFFFF' } } },
      { text: 'ชนิดกล้อง', options: { rowspan: 2, bold: true, fill: { color: 'FFFFFF' } } },
      { text: 'การจับยึด', options: { rowspan: 2, bold: true, fill: { color: 'FFFFFF' } } },
      { text: 'หมายเหตุ', options: { rowspan: 2, bold: true, fill: { color: 'FFFFFF' } } },
    ]);

    // Header Row 2
    rows.push([
      { text: 'Lat', options: { bold: true, fill: { color: 'FFFFFF' } } },
      { text: 'Long', options: { bold: true, fill: { color: 'FFFFFF' } } },
      { text: '0.5', options: { bold: true, fill: { color: 'D8E4BC' } } },
      { text: '1', options: { bold: true, fill: { color: 'D8E4BC' } } },
      { text: '1.5', options: { bold: true, fill: { color: 'D8E4BC' } } },
      { text: '2', options: { bold: true, fill: { color: 'D8E4BC' } } },
    ]);

    chunk.forEach((site, idx) => {
      const rowBg = idx % 2 === 0 ? 'B8CCE4' : 'FFFFFF';
      const supCounts = { '0.5': 0, '1': 0, '1.5': 0, '2': 0 };
      site.cameras.forEach((c) => {
        if (c.supportLength !== 'none') {
          supCounts[c.supportLength] += 1;
        }
      });

      const uniqueCoords = Array.from(
        new Set(site.cameras.map((c) => `${c.lat || site.lat}|${c.lng || site.lng}`))
      );
      const latLines = uniqueCoords.map((p) => p.split('|')[0]).join('\n');
      const lngLines = uniqueCoords.map((p) => p.split('|')[1]).join('\n');

      const camType = site.cameras[0]?.cameraType || 'Bullet 5MP';
      const mounting = site.cameras[0]?.mountingType || 'เสาการไฟฟ้า';
      const isPoleInstall = mounting.includes('ตั้งเสา');

      rows.push([
        { text: String(site.siteNumber), options: { fill: { color: rowBg }, align: 'center' } },
        { text: site.siteName, options: { fill: { color: rowBg }, align: 'left' } },
        { text: latLines || site.lat, options: { fill: { color: rowBg }, align: 'center', fontSize: 11 } },
        { text: lngLines || site.lng, options: { fill: { color: rowBg }, align: 'center', fontSize: 11 } },
        { text: String(site.cameras.length), options: { fill: { color: rowBg }, align: 'center' } },
        { text: supCounts['0.5'] ? String(supCounts['0.5']) : '', options: { fill: { color: 'D8E4BC' }, align: 'center' } },
        { text: supCounts['1'] ? String(supCounts['1']) : '', options: { fill: { color: 'D8E4BC' }, align: 'center' } },
        { text: supCounts['1.5'] ? String(supCounts['1.5']) : '', options: { fill: { color: 'D8E4BC' }, align: 'center' } },
        { text: supCounts['2'] ? String(supCounts['2']) : '', options: { fill: { color: 'D8E4BC' }, align: 'center' } },
        { text: camType, options: { fill: { color: rowBg }, align: 'center' } },
        {
          text: mounting,
          options: {
            fill: { color: isPoleInstall ? 'FFFF00' : rowBg },
            bold: isPoleInstall,
            align: 'center',
          },
        },
        { text: site.note || '', options: { fill: { color: 'FFFFFF' }, align: 'center' } },
      ]);
    });

    // Total Row on last page
    if (pageIdx === siteChunks.length - 1) {
      rows.push([
        { text: '', options: { fill: { color: 'FFFFFF' }, border: { type: 'none' } } },
        { text: '', options: { fill: { color: 'FFFFFF' }, border: { type: 'none' } } },
        { text: '', options: { fill: { color: 'FFFFFF' }, border: { type: 'none' } } },
        { text: 'รวม', options: { bold: true, fill: { color: 'FFFFFF' }, align: 'center' } },
        { text: String(stats.totalCameras), options: { bold: true, fill: { color: 'FFFFFF' }, align: 'center' } },
        { text: String(stats.supportTotals['0.5']), options: { bold: true, fill: { color: 'FFFFFF' }, align: 'center' } },
        { text: String(stats.supportTotals['1']), options: { bold: true, fill: { color: 'FFFFFF' }, align: 'center' } },
        { text: String(stats.supportTotals['1.5']), options: { bold: true, fill: { color: 'FFFFFF' }, align: 'center' } },
        { text: String(stats.supportTotals['2']), options: { bold: true, fill: { color: 'FFFFFF' }, align: 'center' } },
        { text: '', options: { fill: { color: 'FFFFFF' }, border: { type: 'none' } } },
        { text: '', options: { fill: { color: 'FFFFFF' }, border: { type: 'none' } } },
        { text: '', options: { fill: { color: 'FFFFFF' }, border: { type: 'none' } } },
      ]);
    }

    s4.addTable(rows, {
      x: 0.25,
      y: 0.92,
      w: 12.83,
      colW: [0.6, 3.0, 1.15, 1.25, 0.72, 0.55, 0.55, 0.55, 0.55, 1.2, 1.4, 1.31],
      fontFace: FONT_MAIN,
      fontSize: 12.5,
      color: '111827',
      border: { type: 'solid', color: '475569', pt: 0.75 },
      valign: 'middle',
      align: 'center',
      autoPage: false,
    });
  });

  // =========================================================
  // SLIDE 5: CONCEPT DIAGRAM (Auto-paginated up to 11 sites/slide)
  // =========================================================
  const DIAGRAM_CHUNK = 11;
  const diagChunks: SurveySite[][] = [];
  for (let i = 0; i < project.sites.length; i += DIAGRAM_CHUNK) {
    diagChunks.push(project.sites.slice(i, i + DIAGRAM_CHUNK));
  }
  if (diagChunks.length === 0) diagChunks.push([]);

  diagChunks.forEach((chunk, pageIdx) => {
    const s5 = pres.addSlide();
    addMasterBranding(
      pres,
      s5,
      assets,
      `Concept Diagram${diagChunks.length > 1 ? ` (${pageIdx + 1}/${diagChunks.length})` : ''}`
    );

    // Control Room top center (matching Slide 5 EMUs)
    s5.addText(project.controlRoom.title, {
      x: 4.55,
      y: 0.18,
      w: 3.75,
      h: 0.35,
      fontFace: FONT_MAIN,
      fontSize: 13,
      bold: true,
      color: 'C00000',
      align: 'center',
    });

    if (assets.controlTv) {
      s5.addImage({ data: assets.controlTv, x: 5.48, y: 0.58, w: 1.95, h: 1.12 });
    }
    s5.addText(project.controlRoom.displaySpec, {
      x: 7.45,
      y: 0.96,
      w: 1.5,
      h: 0.3,
      fontFace: FONT_MAIN,
      fontSize: 11,
      color: '111827',
    });

    // HDMI vertical line
    s5.addShape(pres.ShapeType.line, {
      x: 6.34,
      y: 1.66,
      w: 0,
      h: 0.4,
      line: { color: '0070C0', pt: 1.5, endArrowType: 'triangle' },
    });
    s5.addText('HDMI', {
      x: 5.65,
      y: 1.7,
      w: 0.65,
      h: 0.25,
      fontFace: FONT_MAIN,
      fontSize: 10,
      color: '0070C0',
      align: 'right',
    });

    if (assets.controlRackFull) {
      s5.addImage({ data: assets.controlRackFull, x: 5.33, y: 2.0, w: 2.52, h: 1.46 });
    }
    s5.addText(project.controlRoom.equipments[0] || 'Ethernet Router', {
      x: 6.82,
      y: 2.1,
      w: 1.55,
      h: 0.3,
      fontFace: FONT_MAIN,
      fontSize: 10,
      color: '111827',
    });

    // Cloud NT Network center
    const cloudX = 5.45;
    const cloudY = 3.76;
    const cloudW = 2.03;
    const cloudH = 0.87;
    s5.addShape(pres.ShapeType.line, {
      x: 6.45,
      y: 3.1,
      w: 0,
      h: 0.72,
      line: { color: '0070C0', pt: 1.5, dashType: 'dash', endArrowType: 'triangle' },
    });
    s5.addText(project.controlRoom.linkLabel, {
      x: 6.5,
      y: 3.38,
      w: 1.35,
      h: 0.28,
      fontFace: FONT_MAIN,
      fontSize: 10,
      color: '0096D6',
    });

    s5.addShape(pres.ShapeType.cloud, {
      x: cloudX,
      y: cloudY,
      w: cloudW,
      h: cloudH,
      fill: { color: '8FAADC' },
      line: { color: '4472C4', pt: 1.2 },
    });
    s5.addText(project.controlRoom.networkLabel, {
      x: cloudX,
      y: cloudY,
      w: cloudW,
      h: cloudH,
      fontFace: FONT_MAIN,
      fontSize: 14,
      bold: true,
      color: '1E293B',
      align: 'center',
      valign: 'middle',
    });

    const slideW = 13.333;
    const slideH = 7.5;

    chunk.forEach((site, idx) => {
      const slot = DIAGRAM_NODE_SLOTS[idx % DIAGRAM_NODE_SLOTS.length];
      const portX = (slot.portX / 100) * slideW;
      const portY = (slot.portY / 100) * slideH;
      const targetCloudX = (slot.cloudX / 100) * slideW;
      const targetCloudY = (slot.cloudY / 100) * slideH;

      const lx = Math.min(portX, targetCloudX);
      const ly = Math.min(portY, targetCloudY);
      const lw = Math.abs(targetCloudX - portX);
      const lh = Math.abs(targetCloudY - portY);
      const flipH = portX > targetCloudX;
      const flipV = portY > targetCloudY;

      // Dashed fiber line to cloud
      s5.addShape(pres.ShapeType.line, {
        x: lx,
        y: ly,
        w: Math.max(0.05, lw),
        h: Math.max(0.05, lh),
        flipH,
        flipV,
        line: { color: '5B9BD5', pt: 1.2, dashType: 'dash', endArrowType: 'triangle' },
      });

      // Angled NT Fiber optic label along the line
      const midX = (portX + targetCloudX) / 2;
      const midY = (portY + targetCloudY) / 2;
      let angle = (Math.atan2(targetCloudY - portY, targetCloudX - portX) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;

      s5.addText(project.controlRoom.linkLabel, {
        x: midX - 0.65,
        y: midY - 0.2,
        w: 1.3,
        h: 0.25,
        rotate: Math.round(angle),
        fontFace: FONT_MAIN,
        fontSize: 9.5,
        color: '0096D6',
        align: 'center',
      });

      // Site title
      s5.addText(`จุดที่ ${site.siteNumber} : ${site.siteName}`, {
        x: (slot.titleX / 100) * slideW,
        y: (slot.titleY / 100) * slideH,
        w: (slot.titleW / 100) * slideW,
        h: 0.28,
        fontFace: FONT_MAIN,
        fontSize: 10.5,
        bold: true,
        color: 'C00000',
        align: 'left',
      });

      // Authentic node group image (1/2/3 cameras + PoE Switch + Cabinet + ONU + 220VAC)
      const imgPath = getNodeImagePath(site, slot.side);
      const nodeData = imgPath.includes('right')
        ? imgPath.includes('1cam')
          ? assets.nodeRight1
          : imgPath.includes('2cam')
          ? assets.nodeRight2
          : assets.nodeRight3
        : imgPath.includes('1cam')
        ? assets.nodeLeft1
        : imgPath.includes('2cam')
        ? assets.nodeLeft2
        : assets.nodeLeft3;

      if (nodeData) {
        s5.addImage({
          data: nodeData,
          x: (slot.nodeX / 100) * slideW,
          y: (slot.nodeY / 100) * slideH,
          w: (slot.nodeW / 100) * slideW,
          h: (slot.nodeH / 100) * slideH,
        });
      }
    });
  });

  // =========================================================
  // SLIDES 6..N: SITE DETAIL + SITE SATELLITE SLIDES
  // =========================================================
  for (const site of project.sites) {
    if (!site.includeDetailSlides) continue;

    if (site.layoutMode === 'per-camera') {
      // One slide per camera (like Site 6)
      for (let i = 0; i < site.cameras.length; i++) {
        const cam = site.cameras[i];
        const s = pres.addSlide();
        addMasterBranding(
          pres,
          s,
          assets,
          `จุดที่ ${site.siteNumber} (${cam.camNumber}) : ${site.siteName} : จำนวน ${cam.camNumber}/${site.cameras.length} กล้อง`
        );

        const poleBox = { x: 0.9, y: 0.92, w: 4.0, h: 4.95 };
        let actualPoleBox = poleBox;
        const poleImgUrl = cam.polePhoto || site.sharedPolePhoto;
        if (poleImgUrl) {
          const data = await urlToDataUrl(poleImgUrl);
          const dim = await getImageDimensions(data);
          actualPoleBox = fitRect(dim.w, dim.h, poleBox.x, poleBox.y, poleBox.w, poleBox.h);
          s.addImage({ data, ...actualPoleBox });
        } else {
          s.addShape(pres.ShapeType.rect, {
            ...poleBox,
            fill: { color: 'F1F5F9' },
            line: { color: 'CBD5E1', pt: 1, dashType: 'dash' },
          });
          s.addText(`รูปจุดติดตั้งกล้อง ${cam.camNumber}`, {
            ...poleBox,
            fontFace: FONT_MAIN,
            fontSize: 16,
            color: '64748B',
            align: 'center',
            valign: 'middle',
          });
        }

        addPoleStickers(pres, s, cam.poleStickers, actualPoleBox, assets);

        // Caption & coordinates below pole photo
        s.addText(
          [
            { text: `${site.captionText}\n`, options: { color: '111827', bold: false, fontSize: 15 } },
            {
              text: `(${cam.lat || site.lat} , ${cam.lng || site.lng})`,
              options: { color: '0070C0', bold: true, fontSize: 15 },
            },
          ],
          {
            x: 0.85,
            y: 5.95,
            w: 4.1,
            h: 0.95,
            fontFace: FONT_MAIN,
            align: 'center',
            valign: 'top',
          }
        );

        // Center blue arrow
        s.addShape(pres.ShapeType.rightArrow, {
          x: 5.2,
          y: 3.15,
          w: 0.55,
          h: 0.36,
          fill: { color: '4472C4' },
          line: { color: '2F5597', pt: 0.75 },
        });

        // Right camera view photo
        const viewBox = { x: 6.1, y: 1.15, w: 6.3, h: 4.55 };
        let actualViewBox = viewBox;
        if (cam.viewPhoto) {
          const data = await urlToDataUrl(cam.viewPhoto);
          const dim = await getImageDimensions(data);
          actualViewBox = fitRect(dim.w, dim.h, viewBox.x, viewBox.y, viewBox.w, viewBox.h);
          s.addImage({ data, ...actualViewBox });
        } else {
          s.addShape(pres.ShapeType.rect, {
            ...viewBox,
            fill: { color: 'F1F5F9' },
            line: { color: 'CBD5E1', pt: 1, dashType: 'dash' },
          });
          s.addText(`รูปมุมมองกล้อง ${cam.camNumber}`, {
            ...viewBox,
            fontFace: FONT_MAIN,
            fontSize: 16,
            color: '64748B',
            align: 'center',
            valign: 'middle',
          });
        }

        // Yellow badge bottom-right of view photo
        const badgeW = 1.45;
        const badgeH = 0.38;
        s.addShape(pres.ShapeType.rect, {
          x: actualViewBox.x + actualViewBox.w - badgeW - 0.12,
          y: actualViewBox.y + actualViewBox.h - badgeH - 0.12,
          w: badgeW,
          h: badgeH,
          fill: { color: NT_GOLD },
          line: { color: 'FFFFFF', pt: 1.5 },
        });
        s.addText(`มุมมองกล้อง ${cam.camNumber}`, {
          x: actualViewBox.x + actualViewBox.w - badgeW - 0.12,
          y: actualViewBox.y + actualViewBox.h - badgeH - 0.12,
          w: badgeW,
          h: badgeH,
          fontFace: FONT_MAIN,
          fontSize: 14,
          bold: true,
          color: '111827',
          align: 'center',
          valign: 'middle',
        });
      }
    } else {
      // Combined layout (like Site 9)
      const s = pres.addSlide();
      addMasterBranding(
        pres,
        s,
        assets,
        `จุดที่ ${site.siteNumber} : ${site.siteName} : จำนวน ${site.cameras.length} กล้อง`
      );

      const poleBox = { x: 0.72, y: 0.9, w: 4.05, h: 5.05 };
      let actualPoleBox = poleBox;
      if (site.sharedPolePhoto) {
        const data = await urlToDataUrl(site.sharedPolePhoto);
        const dim = await getImageDimensions(data);
        actualPoleBox = fitRect(dim.w, dim.h, poleBox.x, poleBox.y, poleBox.w, poleBox.h);
        s.addImage({ data, ...actualPoleBox });
      } else {
        s.addShape(pres.ShapeType.rect, {
          ...poleBox,
          fill: { color: 'F1F5F9' },
          line: { color: 'CBD5E1', pt: 1, dashType: 'dash' },
        });
        s.addText('รูปจุดติดตั้งเสา/ตู้รวม', {
          ...poleBox,
          fontFace: FONT_MAIN,
          fontSize: 16,
          color: '64748B',
          align: 'center',
          valign: 'middle',
        });
      }

      addPoleStickers(pres, s, site.sharedPoleStickers, actualPoleBox, assets);

      s.addText(
        [
          { text: `${site.captionText}\n`, options: { color: '111827', fontSize: 15 } },
          { text: `(${site.lat} , ${site.lng})`, options: { color: '0070C0', bold: true, fontSize: 15 } },
        ],
        {
          x: 0.7,
          y: 6.0,
          w: 4.1,
          h: 0.9,
          fontFace: FONT_MAIN,
          align: 'center',
        }
      );

      // Stack camera views on the right
      const nCams = Math.max(1, site.cameras.length);
      const areaTop = 1.0;
      const areaHeight = 5.6;
      const gap = 0.25;
      const itemH = (areaHeight - gap * (nCams - 1)) / nCams;

      for (let i = 0; i < site.cameras.length; i++) {
        const cam = site.cameras[i];
        const vy = areaTop + i * (itemH + gap);

        // Arrow pointing to this camera view
        s.addShape(pres.ShapeType.rightArrow, {
          x: 5.55,
          y: vy + itemH / 2 - 0.16,
          w: 0.5,
          h: 0.32,
          fill: { color: '4472C4' },
          line: { color: '2F5597', pt: 0.75 },
        });

        const viewBox = { x: 6.65, y: vy, w: 5.2, h: itemH };
        let actualViewBox = viewBox;
        if (cam.viewPhoto) {
          const data = await urlToDataUrl(cam.viewPhoto);
          const dim = await getImageDimensions(data);
          actualViewBox = fitRect(dim.w, dim.h, viewBox.x, viewBox.y, viewBox.w, viewBox.h);
          s.addImage({ data, ...actualViewBox });
        } else {
          s.addShape(pres.ShapeType.rect, {
            ...viewBox,
            fill: { color: 'F1F5F9' },
            line: { color: 'CBD5E1', pt: 1, dashType: 'dash' },
          });
          s.addText(`มุมมองกล้อง ${cam.camNumber}`, {
            ...viewBox,
            fontFace: FONT_MAIN,
            fontSize: 15,
            color: '64748B',
            align: 'center',
            valign: 'middle',
          });
        }

        const badgeW = 1.35;
        const badgeH = 0.34;
        s.addShape(pres.ShapeType.rect, {
          x: actualViewBox.x + actualViewBox.w - badgeW - 0.08,
          y: actualViewBox.y + actualViewBox.h - badgeH - 0.08,
          w: badgeW,
          h: badgeH,
          fill: { color: NT_GOLD },
          line: { color: 'FFFFFF', pt: 1.5 },
        });
        s.addText(`มุมมองกล้อง ${cam.camNumber}`, {
          x: actualViewBox.x + actualViewBox.w - badgeW - 0.08,
          y: actualViewBox.y + actualViewBox.h - badgeH - 0.08,
          w: badgeW,
          h: badgeH,
          fontFace: FONT_MAIN,
          fontSize: 13,
          bold: true,
          color: '111827',
          align: 'center',
          valign: 'middle',
        });
      }
    }

    // Site Satellite Plan Slide (Slide 9 / Slide 11 style)
    {
      const satSlide = pres.addSlide();
      addMasterBranding(
        pres,
        satSlide,
        assets,
        `จุดที่ ${site.siteNumber} : ${site.siteName} : จำนวน ${site.cameras.length} กล้อง`
      );
      satSlide.addText('แผนผังดาวเทียมแสดงการติดตั้ง', {
        x: 8.2,
        y: 0.65,
        w: 4.65,
        h: 0.38,
        fontFace: FONT_MAIN,
        fontSize: 18,
        bold: true,
        color: TEXT_DARK,
        align: 'right',
      });

      const satBox = { x: 2.0, y: 1.15, w: 9.3, h: 5.55 };
      let actualSatBox = satBox;
      if (site.satellitePhoto) {
        const data = await urlToDataUrl(site.satellitePhoto);
        const dim = await getImageDimensions(data);
        actualSatBox = fitRect(dim.w, dim.h, satBox.x, satBox.y, satBox.w, satBox.h);
        satSlide.addImage({ data, ...actualSatBox });
      } else {
        satSlide.addShape(pres.ShapeType.rect, {
          ...satBox,
          fill: { color: '0F172A' },
          line: { color: '334155', pt: 1 },
        });
        satSlide.addText('ยังไม่ได้บันทึกภาพดาวเทียมจุดติดตั้ง', {
          ...satBox,
          fontFace: FONT_MAIN,
          fontSize: 16,
          color: '94A3B8',
          align: 'center',
          valign: 'middle',
        });
      }

      addSatelliteStickers(pres, satSlide, site.satelliteStickers, actualSatBox, assets);
    }
  }

  // =========================================================
  // SLIDE 12: SHOP DRAWING (STANDARD POLE & CABINET)
  // =========================================================
  {
    const s12 = pres.addSlide();
    addMasterBranding(pres, s12, assets);
    const drawUrl = project.shopDrawingImage || './assets/template/shop-drawing-default.png';
    const data = await urlToDataUrl(drawUrl);
    const dim = await getImageDimensions(data);
    const fitted = fitRect(dim.w, dim.h, 0.75, 0.75, 11.85, 6.15);
    s12.addImage({ data, ...fitted });
  }

  // =========================================================
  // SLIDE 13: SUMMARY COUNTS & NOTES
  // =========================================================
  {
    const s13 = pres.addSlide();
    addMasterBranding(pres, s13, assets, 'สรุปจำนวนกล้องและอุปกรณ์ติดตั้ง');

    s13.addTable(
      [
        [
          {
            text: 'จำนวนกล้องทั้งหมด',
            options: { fill: { color: NT_GOLD }, color: 'FFFFFF', bold: true, align: 'left' },
          },
          {
            text: `${stats.totalCameras} กล้อง`,
            options: { fill: { color: 'FCE4D6' }, color: '111827', align: 'center' },
          },
        ],
        [
          {
            text: 'จำนวนวงจรย่อย',
            options: { fill: { color: NT_GOLD }, color: 'FFFFFF', bold: true, align: 'left' },
          },
          {
            text: `${project.subCircuitCount} วงจร`,
            options: { fill: { color: 'FDF2EA' }, color: '111827', align: 'center' },
          },
        ],
        [
          {
            text: 'จำนวนวงจรหลัก',
            options: { fill: { color: NT_GOLD }, color: 'FFFFFF', bold: true, align: 'left' },
          },
          {
            text: `${project.mainCircuitCount} วงจร`,
            options: { fill: { color: 'FCE4D6' }, color: '111827', align: 'center' },
          },
        ],
      ],
      {
        x: 2.75,
        y: 1.4,
        w: 7.85,
        colW: [3.95, 3.9],
        rowH: 0.72,
        fontFace: FONT_MAIN,
        fontSize: 22,
        border: { type: 'solid', color: 'FFFFFF', pt: 2 },
        valign: 'middle',
      }
    );

    s13.addText('หมายเหตุ', {
      x: 0.55,
      y: 3.95,
      w: 2.0,
      h: 0.5,
      fontFace: FONT_MAIN,
      fontSize: 22,
      bold: true,
      color: '111827',
    });

    const notesText = project.summaryNotes.map((n) => `- ${n}`).join('\n');
    s13.addText(notesText, {
      x: 1.9,
      y: 4.35,
      w: 9.5,
      h: 2.0,
      fontFace: FONT_MAIN,
      fontSize: 20,
      color: '111827',
      valign: 'top',
    });
  }

  // =========================================================
  // SLIDE 14: BACK COVER
  // =========================================================
  {
    const s14 = pres.addSlide();
    if (assets.backCoverBg) {
      s14.addImage({
        data: assets.backCoverBg,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
      });
    } else {
      s14.background = { color: NT_YELLOW };
    }

    // Left white rounded capsule
    s14.addShape(pres.ShapeType.roundRect, {
      x: -0.9,
      y: 2.35,
      w: 6.1,
      h: 3.1,
      fill: { color: 'FFFFFF' },
      line: { type: 'none' },
      rectRadius: 0.9,
    });

    if (assets.ntLogoLarge) {
      s14.addImage({
        data: assets.ntLogoLarge,
        x: 0.65,
        y: 3.18,
        w: 3.35,
        h: 1.36,
      });
    }

    // Right white rounded capsule
    s14.addShape(pres.ShapeType.roundRect, {
      x: 5.7,
      y: 2.35,
      w: 8.6,
      h: 3.1,
      fill: { color: 'FFFFFF' },
      line: { type: 'none' },
      rectRadius: 0.9,
    });

    s14.addText(
      [
        { text: 'บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)\n', options: { fontSize: 24, bold: true, color: '1F2937' } },
        { text: 'National Telecom Public Company Limited', options: { fontSize: 20, bold: false, color: '1F2937' } },
      ],
      {
        x: 6.1,
        y: 2.65,
        w: 6.8,
        h: 1.15,
        fontFace: FONT_MAIN,
        align: 'center',
        valign: 'middle',
      }
    );

    s14.addShape(pres.ShapeType.roundRect, {
      x: 6.6,
      y: 4.02,
      w: 6.1,
      h: 0.08,
      fill: { color: NT_YELLOW },
      line: { type: 'none' },
      rectRadius: 0.5,
    });

    s14.addText('www.ntplc.co.th  |  Contact Center 1888', {
      x: 6.1,
      y: 4.35,
      w: 6.8,
      h: 0.55,
      fontFace: FONT_MAIN,
      fontSize: 20,
      color: '1F2937',
      align: 'center',
      valign: 'middle',
    });
  }

  const safeOrg = (project.organizationShortName || 'Survey').replace(/[\\/:*?"<>|]/g, '_');
  await pres.writeFile({ fileName: `จุดติดตั้ง CCTV ${safeOrg}.pptx` });
}
