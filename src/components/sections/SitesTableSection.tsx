import React, { useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  CameraItem,
  SlideLayoutMode,
  SupportLength,
  SurveyProject,
  SurveySite,
} from '@/types/survey';
import {
  computeProjectStats,
  extractGpsFromImage,
  parseLatLngString,
} from '@/lib/exifAndCoords';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MapPinModal } from '@/components/studio/MapPinModal';

interface SitesTableSectionProps {
  project: SurveyProject;
  onChange: (updater: (prev: SurveyProject) => SurveyProject) => void;
  onJumpToSiteDetail: (siteId: string) => void;
}

export function SitesTableSection({
  project,
  onChange,
  onJumpToSiteDetail,
}: SitesTableSectionProps) {
  const stats = computeProjectStats(project);
  const [mapModalSite, setMapModalSite] = useState<SurveySite | null>(null);
  const [exifNotice, setExifNotice] = useState<string | null>(null);

  const renumberSites = (sites: SurveySite[]): SurveySite[] =>
    sites.map((s, idx) => ({ ...s, siteNumber: idx + 1 }));

  const addNewSite = () => {
    const nextNum = project.sites.length + 1;
    const newSite: SurveySite = {
      id: `site-${Date.now()}`,
      siteNumber: nextNum,
      siteName: `จุดติดตั้งที่ ${nextNum}`,
      lat: '13.925000',
      lng: '100.492000',
      layoutMode: 'combined',
      includeDetailSlides: true,
      sharedPoleStickers: [
        {
          id: `st-${Date.now()}-1`,
          type: 'camera',
          label: 'CAM 1',
          x: 45,
          y: 12,
          direction: 'right',
        },
        { id: `st-${Date.now()}-2`, type: 'cam-label', label: 'CAM 1', x: 25, y: 15 },
        { id: `st-${Date.now()}-3`, type: 'cabinet', label: 'ตู้จัดเก็บอุปกรณ์', x: 50, y: 32 },
        {
          id: `st-${Date.now()}-4`,
          type: 'cabinet-label',
          label: 'ตู้จัดเก็บอุปกรณ์',
          x: 68,
          y: 40,
        },
      ],
      satelliteStickers: [
        { id: `sat-${Date.now()}-1`, type: 'cam-cone', label: 'C1', x: 48, y: 50, rotation: 0 },
        {
          id: `sat-${Date.now()}-2`,
          type: 'callout',
          label: 'จุดติดตั้งตู้อุปกรณ์',
          x: 52,
          y: 34,
        },
        {
          id: `sat-${Date.now()}-3`,
          type: 'meter',
          label: 'จุดติดตั้งมิเตอร์',
          x: 66,
          y: 34,
        },
      ],
      captionText: 'จุดติดตั้งตู้อุปกรณ์พร้อมกล้อง และจุดติดตั้งมิเตอร์',
      note: 'ขอมิเตอร์ใหม่',
      mapPinX: 50,
      mapPinY: 50,
      satCalloutX: 50,
      satCalloutY: 50,
      cameras: [
        {
          id: `cam-${Date.now()}`,
          camNumber: 1,
          lat: '13.925000',
          lng: '100.492000',
          supportLength: '1',
          cameraType: 'Bullet 5MP',
          mountingType: 'เสาการไฟฟ้า',
          poleStickers: [
            { id: `pc-${Date.now()}-1`, type: 'camera', label: 'CAM 1', x: 45, y: 12 },
            { id: `pc-${Date.now()}-2`, type: 'cam-label', label: 'CAM 1', x: 25, y: 15 },
          ],
        },
      ],
    };

    onChange((prev) => ({
      ...prev,
      sites: [...prev.sites, newSite],
    }));
  };

  const deleteSite = (siteId: string) => {
    onChange((prev) => ({
      ...prev,
      sites: renumberSites(prev.sites.filter((s) => s.id !== siteId)),
    }));
  };

  const moveSite = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= project.sites.length) return;
    onChange((prev) => {
      const copy = [...prev.sites];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return { ...prev, sites: renumberSites(copy) };
    });
  };

  const updateSite = (siteId: string, patch: Partial<SurveySite>) => {
    onChange((prev) => ({
      ...prev,
      sites: prev.sites.map((s) => (s.id === siteId ? { ...s, ...patch } : s)),
    }));
  };

  const setCameraCount = (site: SurveySite, count: number) => {
    const clamped = Math.max(1, Math.min(8, count));
    const prevCount = site.cameras.length;
    const current = [...site.cameras];
    const now = Date.now();

    if (clamped > current.length) {
      for (let i = current.length + 1; i <= clamped; i++) {
        current.push({
          id: `${site.id}-c${now}-${i}`,
          camNumber: i,
          lat: site.lat,
          lng: site.lng,
          supportLength: 'none',
          cameraType: current[0]?.cameraType || 'Bullet 5MP',
          mountingType: current[0]?.mountingType || 'เสาการไฟฟ้า',
          poleStickers: [
            {
              id: `pc-${now}-${i}-a`,
              type: 'camera',
              label: `CAM ${i}`,
              x: 50,
              y: 12,
              direction: 'right',
            },
            { id: `pc-${now}-${i}-b`, type: 'cam-label', label: `CAM ${i}`, x: 30, y: 15 },
          ],
        });
      }
    } else if (clamped < current.length) {
      current.length = clamped;
    }

    // Sync sharedPoleStickers (combined view) and satelliteStickers with camera count
    let nextShared = site.sharedPoleStickers.filter((st) => {
      if (st.type !== 'camera' && st.type !== 'cam-label') return true;
      const m = st.label.match(/^CAM\s*(\d+)$/i);
      return !m || Number(m[1]) <= clamped;
    });
    let nextSat = site.satelliteStickers.filter((st) => {
      if (st.type !== 'cam-cone') return true;
      const m = st.label.match(/^C(\d+)$/i);
      return !m || Number(m[1]) <= clamped;
    });

    if (clamped > prevCount) {
      for (let i = 1; i <= clamped; i++) {
        const yPos = Math.min(82, 10 + (i - 1) * 11);
        const dir: 'left' | 'right' = i % 2 === 1 ? 'left' : 'right';
        if (
          !nextShared.some(
            (s) => s.type === 'camera' && s.label.toUpperCase() === `CAM ${i}`
          )
        ) {
          nextShared.push({
            id: `st-sync-${now}-${i}-cam`,
            type: 'camera',
            label: `CAM ${i}`,
            x: dir === 'left' ? 38 : 62,
            y: yPos,
            direction: dir,
          });
        }
        if (
          !nextShared.some(
            (s) => s.type === 'cam-label' && s.label.toUpperCase() === `CAM ${i}`
          )
        ) {
          nextShared.push({
            id: `st-sync-${now}-${i}-lbl`,
            type: 'cam-label',
            label: `CAM ${i}`,
            x: dir === 'left' ? 22 : 78,
            y: yPos,
          });
        }
        if (
          !nextSat.some(
            (s) => s.type === 'cam-cone' && s.label.toUpperCase() === `C${i}`
          )
        ) {
          nextSat.push({
            id: `sat-sync-${now}-${i}`,
            type: 'cam-cone',
            label: `C${i}`,
            x: Math.min(80, 44 + (i - 1) * 6),
            y: Math.min(80, 44 + (i - 1) * 4),
            rotation: dir === 'left' ? 180 : 0,
          });
        }
      }
    }

    updateSite(site.id, {
      cameras: current,
      sharedPoleStickers: nextShared,
      satelliteStickers: nextSat,
    });
  };

  const updateSiteAllCameras = (siteId: string, patch: Partial<CameraItem>) => {
    onChange((prev) => ({
      ...prev,
      sites: prev.sites.map((s) =>
        s.id === siteId
          ? { ...s, cameras: s.cameras.map((c) => ({ ...c, ...patch })) }
          : s
      ),
    }));
  };

  const updateCameraField = (
    siteId: string,
    camId: string,
    patch: Partial<CameraItem>
  ) => {
    onChange((prev) => ({
      ...prev,
      sites: prev.sites.map((s) =>
        s.id === siteId
          ? {
              ...s,
              cameras: s.cameras.map((c) => (c.id === camId ? { ...c, ...patch } : c)),
            }
          : s
      ),
    }));
  };

  const handlePasteCoord = (site: SurveySite, raw: string) => {
    const parsed = parseLatLngString(raw);
    if (parsed) {
      onChange((prev) => ({
        ...prev,
        sites: prev.sites.map((s) =>
          s.id === site.id
            ? {
                ...s,
                lat: parsed.lat,
                lng: parsed.lng,
                cameras: s.cameras.map((c) => ({
                  ...c,
                  lat: parsed.lat,
                  lng: parsed.lng,
                })),
              }
            : s
        ),
      }));
    }
  };

  const handleExifUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    site: SurveySite
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const gps = await extractGpsFromImage(file);
    if (gps) {
      updateSite(site.id, {
        lat: gps.lat,
        lng: gps.lng,
        cameras: site.cameras.map((c) => ({ ...c, lat: gps.lat, lng: gps.lng })),
      });
      setExifNotice(`ดึงพิกัดจากรูปสำเร็จสำหรับจุดที่ ${site.siteNumber}: ${gps.lat}, ${gps.lng}`);
    } else {
      setExifNotice(`ไม่พบข้อมูลพิกัด GPS (EXIF) ในไฟล์รูปภาพ "${file.name}"`);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>ตารางแผนผังจุดติดตั้งกล้อง CCTV (Slide 4)</CardTitle>
            <CardDescription>
              แก้ไขชื่อจุด พิกัด (วางข้อความเช่น "13.919694, 100.495166" หรือดึงจาก EXIF รูป)
              จำนวนกล้อง ขนาดซับพอร์ต และการจับยึด
            </CardDescription>
          </div>
          <Button type="button" variant="primary" onClick={addNewSite}>
            <Plus className="h-4 w-4" />
            เพิ่มจุดติดตั้งใหม่
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {exifNotice && (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <span>{exifNotice}</span>
              <button
                type="button"
                onClick={() => setExifNotice(null)}
                className="font-semibold underline cursor-pointer"
              >
                ปิด
              </button>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/80">
                  <TableHead className="w-12 text-center">จุดที่</TableHead>
                  <TableHead className="min-w-[200px]">ชื่อจุด</TableHead>
                  <TableHead className="min-w-[210px]">พิกัด (Lat, Long)</TableHead>
                  <TableHead className="w-20 text-center">จำนวนกล้อง</TableHead>
                  <TableHead className="min-w-[155px]">ซับพอร์ต (เมตร)</TableHead>
                  <TableHead className="w-28">ชนิดกล้อง</TableHead>
                  <TableHead className="w-36">การจับยึด</TableHead>
                  <TableHead className="w-36">โหมดสไลด์</TableHead>
                  <TableHead className="w-28">หมายเหตุ</TableHead>
                  <TableHead className="w-28 text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.sites.map((site, index) => {
                  const mounting = site.cameras[0]?.mountingType || 'เสาการไฟฟ้า';
                  const camType = site.cameras[0]?.cameraType || 'Bullet 5MP';
                  const isPole = mounting.includes('ตั้งเสา');

                  return (
                    <TableRow key={site.id} className="align-top">
                      <TableCell className="text-center font-bold text-slate-900">
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{site.siteNumber}</span>
                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => moveSite(index, -1)}
                              disabled={index === 0}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                              title="เลื่อนขึ้น"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSite(index, 1)}
                              disabled={index === project.sites.length - 1}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                              title="เลื่อนลง"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Input
                          value={site.siteName}
                          onChange={(e) =>
                            updateSite(site.id, { siteName: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            <Input
                              value={site.lat}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateSite(site.id, { lat: v });
                                updateSiteAllCameras(site.id, { lat: v });
                              }}
                              onPaste={(e) => {
                                const text = e.clipboardData.getData('text');
                                if (text.includes(',') || text.trim().includes(' ')) {
                                  e.preventDefault();
                                  handlePasteCoord(site, text);
                                }
                              }}
                              placeholder="Lat"
                              className="h-7 px-1.5 font-mono text-[11px]"
                            />
                            <Input
                              value={site.lng}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateSite(site.id, { lng: v });
                                updateSiteAllCameras(site.id, { lng: v });
                              }}
                              placeholder="Long"
                              className="h-7 px-1.5 font-mono text-[11px]"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setMapModalSite(site)}
                              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <MapPin className="h-2.5 w-2.5 text-red-500" />
                              ปักหมุด
                            </button>
                            <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100">
                              <Camera className="h-2.5 w-2.5 text-blue-600" />
                              EXIF รูป
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleExifUpload(e, site)}
                              />
                            </label>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={1}
                          max={8}
                          value={site.cameras.length}
                          onChange={(e) =>
                            setCameraCount(site, Number(e.target.value) || 1)
                          }
                          className="h-8 w-16 text-center text-xs font-semibold mx-auto"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {site.cameras.map((cam) => (
                            <div key={cam.id} className="flex items-center gap-1">
                              <span className="w-8 text-[10px] font-medium text-slate-500">
                                C{cam.camNumber}:
                              </span>
                              <Select
                                value={cam.supportLength}
                                onChange={(e) =>
                                  updateCameraField(site.id, cam.id, {
                                    supportLength: e.target.value as SupportLength,
                                  })
                                }
                                className="h-7 px-1.5 text-[11px]"
                              >
                                <option value="0.5">0.5 เมตร</option>
                                <option value="1">1 เมตร</option>
                                <option value="1.5">1.5 เมตร</option>
                                <option value="2">2 เมตร</option>
                                <option value="none">ใช้ซับพอร์ตร่วม</option>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Input
                          value={camType}
                          onChange={(e) =>
                            updateSiteAllCameras(site.id, { cameraType: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            value={mounting}
                            onChange={(e) =>
                              updateSiteAllCameras(site.id, { mountingType: e.target.value })
                            }
                            className={`h-8 text-xs ${
                              isPole ? 'bg-yellow-200 font-semibold border-amber-400' : ''
                            }`}
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <Select
                            value={site.layoutMode}
                            onChange={(e) =>
                              updateSite(site.id, {
                                layoutMode: e.target.value as SlideLayoutMode,
                              })
                            }
                            className="h-7 px-1.5 text-[11px]"
                          >
                            <option value="per-camera">แยก 1 กล้อง/สไลด์</option>
                            <option value="combined">รวมใน 1 สไลด์</option>
                          </Select>
                          <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={site.includeDetailSlides}
                              onChange={(e) =>
                                updateSite(site.id, {
                                  includeDetailSlides: e.target.checked,
                                })
                              }
                            />
                            สร้างสไลด์รายละเอียด
                          </label>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Input
                          value={site.note || ''}
                          onChange={(e) =>
                            updateSite(site.id, { note: e.target.value })
                          }
                          placeholder="-"
                          className="h-8 text-xs"
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => onJumpToSiteDetail(site.id)}
                          >
                            <ImageIcon className="h-3 w-3" />
                            รูป/ป้าย
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => deleteSite(site.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer Strip matching Slide 4 totals */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
            <div className="font-semibold text-slate-700">สรุปยอดรวมในตาราง (Slide 4)</div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">รวมกล้อง: {stats.totalCameras} กล้อง</Badge>
              <Badge variant="success">0.5 ม.: {stats.supportTotals['0.5']}</Badge>
              <Badge variant="success">1 ม.: {stats.supportTotals['1']}</Badge>
              <Badge variant="success">1.5 ม.: {stats.supportTotals['1.5']}</Badge>
              <Badge variant="success">2 ม.: {stats.supportTotals['2']}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {mapModalSite && (
        <MapPinModal
          open={Boolean(mapModalSite)}
          onOpenChange={(open) => !open && setMapModalSite(null)}
          initialLat={mapModalSite.lat}
          initialLng={mapModalSite.lng}
          title={`ปักหมุดพิกัด: จุดที่ ${mapModalSite.siteNumber} ${mapModalSite.siteName}`}
          onConfirmCoord={(lat, lng) => {
            onChange((prev) => ({
              ...prev,
              sites: prev.sites.map((s) =>
                s.id === mapModalSite.id
                  ? {
                      ...s,
                      lat,
                      lng,
                      cameras: s.cameras.map((c) => ({ ...c, lat, lng })),
                    }
                  : s
              ),
            }));
          }}
          onCaptureSatellite={(dataUrl, lat, lng) => {
            onChange((prev) => ({
              ...prev,
              sites: prev.sites.map((s) =>
                s.id === mapModalSite.id
                  ? {
                      ...s,
                      lat,
                      lng,
                      satellitePhoto: dataUrl,
                      includeDetailSlides: true,
                    }
                  : s
              ),
            }));
          }}
        />
      )}
    </div>
  );
}
