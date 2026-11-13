import React, { useRef, useState } from 'react';
import {
  Camera,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Satellite,
  Sparkles,
} from 'lucide-react';
import type { SurveyProject, SurveySite } from '@/types/survey';
import { computeProjectStats, fileToCompressedDataUrl } from '@/lib/exifAndCoords';
import {
  captureSatelliteSnapshot,
  computeBoundsCenterZoom,
  projectCoordToPercent,
} from '@/lib/satelliteCapture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProjectOverviewSectionProps {
  project: SurveyProject;
  onChange: (updater: (prev: SurveyProject) => SurveyProject) => void;
}

export function ProjectOverviewSection({ project, onChange }: ProjectOverviewSectionProps) {
  const stats = computeProjectStats(project);
  const [capturingSat, setCapturingSat] = useState(false);
  const [satError, setSatError] = useState<string | null>(null);
  const [draggingPin, setDraggingPin] = useState<{
    mode: 'map' | 'sat';
    siteId: string;
  } | null>(null);

  const mapBoxRef = useRef<HTMLDivElement>(null);
  const satBoxRef = useRef<HTMLDivElement>(null);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'overviewMapImage' | 'overviewSatImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataUrl(file, 1600);
    onChange((prev) => ({ ...prev, [field]: dataUrl }));
  };

  const handleAutoCaptureOverviewSat = async () => {
    setCapturingSat(true);
    setSatError(null);
    try {
      const coords = project.sites
        .map((s) => ({ lat: Number(s.lat), lng: Number(s.lng), site: s }))
        .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng) && c.lat !== 0);

      const { lat, lng, zoom } = computeBoundsCenterZoom(coords);
      const dataUrl = await captureSatelliteSnapshot({
        lat,
        lng,
        zoom,
        width: 1100,
        height: 600,
        includeLabels: true,
      });

      onChange((prev) => ({
        ...prev,
        overviewSatImage: dataUrl,
        sites: prev.sites.map((s) => {
          const sla = Number(s.lat);
          const sln = Number(s.lng);
          if (!Number.isFinite(sla) || !Number.isFinite(sln) || sla === 0) return s;
          const pos = projectCoordToPercent(sla, sln, lat, lng, zoom, 1100, 600);
          return { ...s, satCalloutX: Number(pos.x.toFixed(1)), satCalloutY: Number(pos.y.toFixed(1)) };
        }),
      }));
    } catch {
      setSatError('ไม่สามารถดึงภาพดาวเทียมรวมได้ (กรุณาอัปโหลดภาพแคปหน้าจอแทน)');
    } finally {
      setCapturingSat(false);
    }
  };

  const handlePointerMove = (
    e: React.PointerEvent,
    mode: 'map' | 'sat',
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (!draggingPin || draggingPin.mode !== mode) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));

    onChange((prev) => ({
      ...prev,
      sites: prev.sites.map((s: SurveySite) => {
        if (s.id !== draggingPin.siteId) return s;
        return mode === 'map'
          ? { ...s, mapPinX: Number(x.toFixed(1)), mapPinY: Number(y.toFixed(1)) }
          : { ...s, satCalloutX: Number(x.toFixed(1)), satCalloutY: Number(y.toFixed(1)) };
      }),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Shadcn Block: stats-01 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">จำนวนจุดติดตั้ง</CardTitle>
            <MapPin className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSites} จุด</div>
            <p className="mt-1 text-xs text-slate-500">แสดงในตารางและแผนที่รวม</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">จำนวนกล้องรวม</CardTitle>
            <Camera className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalCameras} กล้อง</div>
            <p className="mt-1 text-xs text-slate-500">
              ซับพอร์ต: 0.5m({stats.supportTotals['0.5']}) • 1m({stats.supportTotals['1']}) • 1.5m(
              {stats.supportTotals['1.5']}) • 2m({stats.supportTotals['2']})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">สไลด์ที่จะถูกสร้าง</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.estimatedSlidesCount} หน้า</div>
            <p className="mt-1 text-xs text-slate-500">รวมสไลด์รายจุด {stats.detailSlidesCount} หน้า</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">ความพร้อมรูปถ่าย</CardTitle>
            <ImagePlus className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.sitesWithPhotos}/{stats.totalSites} จุด
            </div>
            <p className="mt-1 text-xs text-slate-500">ที่มีรูปจุดติดตั้งหรือดาวเทียม</p>
          </CardContent>
        </Card>
      </div>

      {/* Shadcn Block: form-layout-01 (Cover slide metadata) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ข้อมูลหน้าปกและโครงการ (Slide 1)</CardTitle>
              <CardDescription>
                กำหนดชื่องาน ชื่อหน่วยงาน และวันที่สำรวจที่จะแสดงบนหน้าปกและหัวสไลด์ทั้งหมด
              </CardDescription>
            </div>
            <Badge variant="warning">NT Template 16:9</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="projectTitle">ชื่องาน / หัวข้อรายงาน</Label>
            <Input
              id="projectTitle"
              value={project.projectTitle}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, projectTitle: e.target.value }))
              }
              placeholder="สำรวจจุดติดตั้งกล้อง CCTV"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="surveyDate">วันที่สำรวจ</Label>
            <Input
              id="surveyDate"
              value={project.surveyDate}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, surveyDate: e.target.value }))
              }
              placeholder="8 กรกฎาคม 2569"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgName">ชื่อหน่วยงานเต็ม (แสดงบนหน้าปก)</Label>
            <Input
              id="orgName"
              value={project.organizationName}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, organizationName: e.target.value }))
              }
              placeholder="องค์การบริหารส่วนตำบลบางตะไนย์"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgShort">ชื่อย่อหน่วยงาน (แสดงบนหัวสไลด์)</Label>
            <Input
              id="orgShort"
              value={project.organizationShortName}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, organizationShortName: e.target.value }))
              }
              placeholder="อบต.บางตะไนย์"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="gmapsUrl">ลิงก์ Google My Maps (แสดงท้าย Slide 3)</Label>
            <Input
              id="gmapsUrl"
              value={project.googleMapsUrl}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, googleMapsUrl: e.target.value }))
              }
              placeholder="https://www.google.com/maps/d/viewer?..."
              className="font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Slide 2 & Slide 3 Overview Map Editors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Slide 2 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>แผนที่ภาพรวมพื้นที่ + หมุดแดง (Slide 2)</CardTitle>
                <CardDescription>
                  อัปโหลดภาพแผนที่ลายเส้น/ผังตำบล แล้วลากวางหมุดสีแดงแต่ละจุดได้ทันที
                </CardDescription>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <ImagePlus className="h-3.5 w-3.5" />
                อัปโหลดแผนที่
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadImage(e, 'overviewMapImage')}
                />
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={mapBoxRef}
              onPointerMove={(e) => handlePointerMove(e, 'map', mapBoxRef)}
              onPointerUp={() => setDraggingPin(null)}
              className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 select-none touch-none"
            >
              {project.overviewMapImage ? (
                <img
                  src={project.overviewMapImage}
                  alt="Overview Map"
                  className="h-full w-full object-contain pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  ยังไม่มีภาพแผนที่รวม
                </div>
              )}

              {project.sites.map((site) => (
                <div
                  key={site.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setDraggingPin({ mode: 'map', siteId: site.id });
                  }}
                  title={`จุดที่ ${site.siteNumber}: ${site.siteName}`}
                  style={{
                    left: `${site.mapPinX ?? 50}%`,
                    top: `${site.mapPinY ?? 50}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                  className="absolute flex flex-col items-center cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 text-[9px] font-bold text-white shadow">
                    {site.siteNumber}
                  </div>
                  <div className="h-2.5 w-0.5 bg-red-700" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Slide 3 */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>แผนผังดาวเทียมรวม + ป้ายชื่อจุด (Slide 3)</CardTitle>
                <CardDescription>
                  ดึงภาพดาวเทียมจากพิกัดทุกจุดอัตโนมัติ หรืออัปโหลดภาพแล้วลากจัดตำแหน่งป้ายชื่อ
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={capturingSat}
                  onClick={handleAutoCaptureOverviewSat}
                >
                  {capturingSat ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  สร้างจากพิกัด
                </Button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Satellite className="h-3.5 w-3.5" />
                  อัปโหลดภาพ
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadImage(e, 'overviewSatImage')}
                  />
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {satError && (
              <div className="rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">{satError}</div>
            )}
            <div
              ref={satBoxRef}
              onPointerMove={(e) => handlePointerMove(e, 'sat', satBoxRef)}
              onPointerUp={() => setDraggingPin(null)}
              className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900 select-none touch-none"
            >
              {project.overviewSatImage ? (
                <img
                  src={project.overviewSatImage}
                  alt="Overview Satellite"
                  className="h-full w-full object-contain pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  ยังไม่มีภาพดาวเทียมรวม
                </div>
              )}

              {project.sites.map((site) => (
                <div
                  key={site.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setDraggingPin({ mode: 'sat', siteId: site.id });
                  }}
                  style={{
                    left: `${site.satCalloutX ?? 50}%`,
                    top: `${site.satCalloutY ?? 50}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute max-w-[160px] truncate rounded-md border border-slate-700 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-900 shadow cursor-grab active:cursor-grabbing"
                >
                  <span className="bg-cyan-300 px-0.5">
                    จุดที่ {site.siteNumber} {site.siteName}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
