import exifr from 'exifr';
import type { SurveyProject, SupportLength } from '@/types/survey';

export function parseLatLngString(input: string): { lat: string; lng: string } | null {
  const cleaned = input.trim().replace(/[()]/g, '');
  const parts = cleaned.split(/[,\s]+/).filter(Boolean);
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return {
    lat: String(Number(lat.toFixed(6))),
    lng: String(Number(lng.toFixed(6))),
  };
}

export async function extractGpsFromImage(file: File): Promise<{ lat: string; lng: string } | null> {
  try {
    const gps = await exifr.gps(file);
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      return {
        lat: gps.latitude.toFixed(6),
        lng: gps.longitude.toFixed(6),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fileToCompressedDataUrl(file: File, maxDim = 1600): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  if (!file.type.startsWith('image/')) {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= maxDim && h <= maxDim && file.size < 900_000) {
        resolve(rawDataUrl);
        return;
      }
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(mime, 0.88));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

const dataUrlCache = new Map<string, string>();

export async function urlToDataUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  const normalizedUrl = url.startsWith('/assets/')
    ? `./assets/${url.slice('/assets/'.length)}`
    : url;
  const cached = dataUrlCache.get(normalizedUrl);
  if (cached) return cached;

  const res = await fetch(normalizedUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch asset: ${normalizedUrl}`);
  }
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  dataUrlCache.set(normalizedUrl, dataUrl);
  return dataUrl;
}

export interface ProjectStats {
  totalSites: number;
  totalCameras: number;
  supportTotals: Record<Exclude<SupportLength, 'none'>, number>;
  detailSlidesCount: number;
  estimatedSlidesCount: number;
  sitesWithPhotos: number;
}

export function computeProjectStats(project: SurveyProject): ProjectStats {
  const supportTotals: Record<Exclude<SupportLength, 'none'>, number> = {
    '0.5': 0,
    '1': 0,
    '1.5': 0,
    '2': 0,
  };

  let totalCameras = 0;
  let detailSlidesCount = 0;
  let sitesWithPhotos = 0;

  for (const site of project.sites) {
    totalCameras += site.cameras.length;
    for (const cam of site.cameras) {
      if (cam.supportLength !== 'none') {
        supportTotals[cam.supportLength] += 1;
      }
    }

    const hasPhoto =
      Boolean(site.sharedPolePhoto) ||
      Boolean(site.satellitePhoto) ||
      site.cameras.some((c) => Boolean(c.polePhoto) || Boolean(c.viewPhoto));
    if (hasPhoto) sitesWithPhotos += 1;

    if (site.includeDetailSlides) {
      const camSlides = site.layoutMode === 'per-camera' ? Math.max(1, site.cameras.length) : 1;
      detailSlidesCount += camSlides + 1; // +1 for site satellite slide
    }
  }

  const tablePages = Math.max(1, Math.ceil(project.sites.length / 12));
  const diagramPages = Math.max(1, Math.ceil(project.sites.length / 11));
  // Cover(1) + Map(1) + SatOverview(1) + Table(tablePages) + Diagram(diagramPages) + Detail(detailSlidesCount) + ShopDrawing(1) + Summary(1) + BackCover(1)
  const estimatedSlidesCount = 1 + 1 + 1 + tablePages + diagramPages + detailSlidesCount + 1 + 1 + 1;

  return {
    totalSites: project.sites.length,
    totalCameras,
    supportTotals,
    detailSlidesCount,
    estimatedSlidesCount,
    sitesWithPhotos,
  };
}
