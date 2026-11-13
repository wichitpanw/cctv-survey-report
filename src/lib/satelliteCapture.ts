function latLngToTilePixel(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return {
    tileX: Math.floor(x),
    tileY: Math.floor(y),
    pixelX: (x - Math.floor(x)) * 256,
    pixelY: (y - Math.floor(y)) * 256,
    worldX: x * 256,
    worldY: y * 256,
  };
}

function loadTileImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Tile load failed: ${url}`));
    img.src = url;
  });
}

export interface CaptureSatelliteOptions {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
  includeLabels?: boolean;
}

export async function captureSatelliteSnapshot({
  lat,
  lng,
  zoom = 18,
  width = 1000,
  height = 680,
  includeLabels = true,
}: CaptureSatelliteOptions): Promise<string> {
  const center = latLngToTilePixel(lat, lng, zoom);
  const topLeftWorldX = center.worldX - width / 2;
  const topLeftWorldY = center.worldY - height / 2;
  const bottomRightWorldX = center.worldX + width / 2;
  const bottomRightWorldY = center.worldY + height / 2;

  const minTileX = Math.floor(topLeftWorldX / 256);
  const maxTileX = Math.floor(bottomRightWorldX / 256);
  const minTileY = Math.floor(topLeftWorldY / 256);
  const maxTileY = Math.floor(bottomRightWorldY / 256);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, height);

  const maxTileIdx = Math.pow(2, zoom);
  const tasks: Array<Promise<void>> = [];

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    if (ty < 0 || ty >= maxTileIdx) continue;
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const wrappedTx = ((tx % maxTileIdx) + maxTileIdx) % maxTileIdx;
      const drawX = tx * 256 - topLeftWorldX;
      const drawY = ty * 256 - topLeftWorldY;
      const satUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${wrappedTx}`;

      tasks.push(
        loadTileImage(satUrl).then((img) => {
          ctx.drawImage(img, drawX, drawY, 256, 256);
        })
      );
    }
  }

  await Promise.all(tasks);

  if (includeLabels) {
    const labelTasks: Array<Promise<void>> = [];
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      if (ty < 0 || ty >= maxTileIdx) continue;
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const wrappedTx = ((tx % maxTileIdx) + maxTileIdx) % maxTileIdx;
        const drawX = tx * 256 - topLeftWorldX;
        const drawY = ty * 256 - topLeftWorldY;
        const lblUrl = `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${zoom}/${ty}/${wrappedTx}`;
        labelTasks.push(
          loadTileImage(lblUrl)
            .then((img) => {
              ctx.drawImage(img, drawX, drawY, 256, 256);
            })
            .catch(() => undefined)
        );
      }
    }
    await Promise.all(labelTasks);
  }

  return canvas.toDataURL('image/png');
}

export function computeBoundsCenterZoom(coords: Array<{ lat: number; lng: number }>) {
  if (coords.length === 0) {
    return { lat: 13.925, lng: 100.492, zoom: 15 };
  }
  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const span = Math.max(maxLat - minLat, maxLng - minLng);
  let zoom = 15;
  if (span > 0.08) zoom = 12;
  else if (span > 0.04) zoom = 13;
  else if (span > 0.018) zoom = 14;
  else if (span > 0.008) zoom = 15;
  else zoom = 16;

  return { lat: centerLat, lng: centerLng, zoom };
}

export function projectCoordToPercent(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  width = 1100,
  height = 600
): { x: number; y: number } {
  const c = latLngToTilePixel(centerLat, centerLng, zoom);
  const p = latLngToTilePixel(lat, lng, zoom);
  const dx = p.worldX - c.worldX + width / 2;
  const dy = p.worldY - c.worldY + height / 2;
  return {
    x: Math.max(5, Math.min(95, (dx / width) * 100)),
    y: Math.max(8, Math.min(92, (dy / height) * 100)),
  };
}
