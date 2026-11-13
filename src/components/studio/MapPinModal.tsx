import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Camera, Check, Loader2, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { captureSatelliteSnapshot } from '@/lib/satelliteCapture';

interface MapPinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat: string;
  initialLng: string;
  title?: string;
  onConfirmCoord: (lat: string, lng: string) => void;
  onCaptureSatellite?: (dataUrl: string, lat: string, lng: string) => void;
}

export function MapPinModal({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  title = 'ปักหมุดพิกัดบนแผนที่ดาวเทียม',
  onConfirmCoord,
  onCaptureSatellite,
}: MapPinModalProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const parsedLat = Number(initialLat) || 13.925;
  const parsedLng = Number(initialLng) || 100.492;

  const [lat, setLat] = useState(parsedLat.toFixed(6));
  const [lng, setLng] = useState(parsedLng.toFixed(6));
  const [zoom, setZoom] = useState(18);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const la = Number(initialLat) || 13.925;
      const ln = Number(initialLng) || 100.492;
      setLat(la.toFixed(6));
      setLng(ln.toFixed(6));
      setCaptureError(null);
    }
  }, [open, initialLat, initialLng]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (!mapElRef.current) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const startLat = Number(lat) || 13.925;
      const startLng = Number(lng) || 100.492;

      const map = L.map(mapElRef.current, {
        center: [startLat, startLng],
        zoom: zoom,
      });

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri World Imagery',
          maxZoom: 19,
        }
      ).addTo(map);

      L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);

      const marker = L.circleMarker([startLat, startLng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 1,
      }).addTo(map);

      map.on('click', (ev: L.LeafletMouseEvent) => {
        const newLat = ev.latlng.lat.toFixed(6);
        const lngStr = ev.latlng.lng.toFixed(6);
        setLat(newLat);
        setLng(lngStr);
        marker.setLatLng(ev.latlng);
      });

      map.on('zoomend', () => {
        setZoom(map.getZoom());
      });

      mapRef.current = map;
      markerRef.current = marker;
    }, 80);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open]);

  const handleCapture = async () => {
    setCapturing(true);
    setCaptureError(null);
    try {
      const center = mapRef.current?.getCenter();
      const targetLat = center ? center.lat : Number(lat);
      const targetLng = center ? center.lng : Number(lng);
      const targetZoom = mapRef.current?.getZoom() ?? zoom;

      const dataUrl = await captureSatelliteSnapshot({
        lat: targetLat,
        lng: targetLng,
        zoom: Math.min(18, Math.max(14, targetZoom)),
        width: 1000,
        height: 680,
      });
      onCaptureSatellite?.(dataUrl, lat, lng);
      onOpenChange(false);
    } catch {
      setCaptureError(
        'ไม่สามารถดึงภาพดาวเทียมอัตโนมัติได้ (อาจติดข้อจำกัดเครือข่าย/CORS) คุณสามารถแคปหน้าจอแล้วอัปโหลดรูปเองได้ค่ะ'
      );
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium text-slate-600">Latitude</span>
              <Input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">Longitude</span>
              <Input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>

          <div
            ref={mapElRef}
            className="h-[360px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900"
          />

          <p className="text-xs text-slate-500">
            คลิกบนแผนที่เพื่อเลื่อนจุดปักหมุดสีแดง • ซูมระดับ {zoom}
          </p>

          {captureError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {captureError}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            {onCaptureSatellite && (
              <Button
                type="button"
                variant="secondary"
                disabled={capturing}
                onClick={handleCapture}
              >
                {capturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                ใช้ภาพดาวเทียมมุมนี้ลงสไลด์
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onConfirmCoord(lat, lng);
                onOpenChange(false);
              }}
            >
              <Check className="h-4 w-4" />
              ยืนยันพิกัดนี้
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
