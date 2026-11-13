import React, { useState } from 'react';
import {
  Camera,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  Satellite,
  Sparkles,
  Tag,
} from 'lucide-react';
import type {
  SlideLayoutMode,
  StickerOverlay,
  StickerType,
  SurveyProject,
  SurveySite,
} from '@/types/survey';
import { extractGpsFromImage, fileToCompressedDataUrl } from '@/lib/exifAndCoords';
import { captureSatelliteSnapshot } from '@/lib/satelliteCapture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StickerCanvas } from '@/components/studio/StickerCanvas';
import { MapPinModal } from '@/components/studio/MapPinModal';
import { cn } from '@/lib/utils';

interface SiteDetailStudioProps {
  project: SurveyProject;
  selectedSiteId: string;
  onSelectSiteId: (id: string) => void;
  onChange: (updater: (prev: SurveyProject) => SurveyProject) => void;
}

export function SiteDetailStudio({
  project,
  selectedSiteId,
  onSelectSiteId,
  onChange,
}: SiteDetailStudioProps) {
  const activeSite =
    project.sites.find((s) => s.id === selectedSiteId) || project.sites[0] || null;
  const [activeCamIdx, setActiveCamIdx] = useState(0);
  const [capturingSat, setCapturingSat] = useState(false);
  const [satError, setSatError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  if (!activeSite) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-slate-500">
          ยังไม่มีจุดติดตั้งในโครงการ กรุณาเพิ่มจุดติดตั้งในหน้าตารางก่อนค่ะ
        </CardContent>
      </Card>
    );
  }

  const safeCamIdx = Math.min(activeCamIdx, Math.max(0, activeSite.cameras.length - 1));
  const activeCam = activeSite.cameras[safeCamIdx];

  const updateSite = (patch: Partial<SurveySite>) => {
    onChange((prev) => ({
      ...prev,
      sites: prev.sites.map((s) => (s.id === activeSite.id ? { ...s, ...patch } : s)),
    }));
  };

  const addSticker = (
    target: 'shared-pole' | 'cam-pole' | 'satellite',
    type: StickerType,
    label: string
  ) => {
    const newSticker: StickerOverlay = {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      x: 50,
      y: type === 'pole' ? 45 : 35,
      w: type === 'pole' ? 4 : undefined,
      h: type === 'pole' ? 68 : undefined,
      rotation: type === 'cam-cone' ? 0 : undefined,
    };

    if (target === 'shared-pole') {
      updateSite({
        sharedPoleStickers: [...activeSite.sharedPoleStickers, newSticker],
      });
    } else if (target === 'satellite') {
      updateSite({
        satelliteStickers: [...activeSite.satelliteStickers, newSticker],
      });
    } else if (activeCam) {
      updateSite({
        cameras: activeSite.cameras.map((c, idx) =>
          idx === safeCamIdx
            ? { ...c, poleStickers: [...c.poleStickers, newSticker] }
            : c
        ),
      });
    }
  };

  const handleUploadPolePhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'shared' | 'per-cam'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const [dataUrl, gps] = await Promise.all([
      fileToCompressedDataUrl(file, 1500),
      extractGpsFromImage(file),
    ]);

    if (mode === 'shared') {
      updateSite({
        sharedPolePhoto: dataUrl,
        ...(gps ? { lat: gps.lat, lng: gps.lng } : {}),
      });
    } else if (activeCam) {
      updateSite({
        cameras: activeSite.cameras.map((c, idx) =>
          idx === safeCamIdx
            ? {
                ...c,
                polePhoto: dataUrl,
                ...(gps ? { lat: gps.lat, lng: gps.lng } : {}),
              }
            : c
        ),
      });
    }
    e.target.value = '';
  };

  const handleUploadViewPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    camIdx: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataUrl(file, 1500);
    updateSite({
      cameras: activeSite.cameras.map((c, idx) =>
        idx === camIdx ? { ...c, viewPhoto: dataUrl } : c
      ),
    });
    e.target.value = '';
  };

  const handleUploadSatPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataUrl(file, 1600);
    updateSite({ satellitePhoto: dataUrl });
    e.target.value = '';
  };

  const handleAutoCaptureSiteSat = async () => {
    const lat = Number(activeSite.lat);
    const lng = Number(activeSite.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setSatError('พิกัด Lat/Long ไม่ถูกต้อง');
      return;
    }
    setCapturingSat(true);
    setSatError(null);
    try {
      const dataUrl = await captureSatelliteSnapshot({
        lat,
        lng,
        zoom: 18,
        width: 1000,
        height: 680,
        includeLabels: true,
      });
      updateSite({ satellitePhoto: dataUrl });
    } catch {
      setSatError('ไม่สามารถดึงภาพดาวเทียมอัตโนมัติได้ กรุณาลองอัปโหลดภาพแคปหน้าจอแทน');
    } finally {
      setCapturingSat(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      {/* Left Site Picker List */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">รายการจุดติดตั้ง ({project.sites.length})</CardTitle>
          <CardDescription>เลือกจุดเพื่อจัดการรูปถ่ายและสติกเกอร์</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-3">
          {project.sites.map((site) => {
            const isSelected = site.id === activeSite.id;
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => {
                  onSelectSiteId(site.id);
                  setActiveCamIdx(0);
                }}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer',
                  isSelected
                    ? 'border-amber-400 bg-amber-50/80 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold">จุดที่ {site.siteNumber}</span>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={site.includeDetailSlides ? 'success' : 'secondary'}
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {site.includeDetailSlides ? 'เปิดสไลด์' : 'เฉพาะตาราง'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-0.5 truncate text-xs font-medium">{site.siteName}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{site.cameras.length} กล้อง</span>
                  <span>
                    {site.layoutMode === 'per-camera' ? 'แยก/กล้อง' : 'รวมสไลด์'}
                  </span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Main Studio Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  จุดที่ {activeSite.siteNumber} : {activeSite.siteName}
                </CardTitle>
                <CardDescription>
                  พิกัดหลัก ({activeSite.lat}, {activeSite.lng}) • จำนวน {activeSite.cameras.length} กล้อง
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <Switch
                    checked={activeSite.includeDetailSlides}
                    onCheckedChange={(checked) =>
                      updateSite({ includeDetailSlides: checked })
                    }
                  />
                  สร้างสไลด์รูปถ่าย & ดาวเทียมจุดนี้
                </label>

                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                  {(
                    [
                      { value: 'per-camera', label: 'แยก 1 กล้อง/สไลด์ (แบบจุดที่ 6)' },
                      { value: 'combined', label: 'รวมทุกกล้อง (แบบจุดที่ 9)' },
                    ] as Array<{ value: SlideLayoutMode; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSite({ layoutMode: opt.value })}
                      className={cn(
                        'rounded-md px-2.5 py-1 font-medium transition-all cursor-pointer',
                        activeSite.layoutMode === opt.value
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>คำบรรยายใต้รูปจุดติดตั้ง</Label>
                <Input
                  value={activeSite.captionText}
                  onChange={(e) => updateSite({ captionText: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label>ชื่อจุดติดตั้ง</Label>
                <Input
                  value={activeSite.siteName}
                  onChange={(e) => updateSite({ siteName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <Tabs defaultValue="photos">
              <TabsList>
                <TabsTrigger value="photos">
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  1. รูปจุดติดตั้ง & มุมมองกล้อง
                </TabsTrigger>
                <TabsTrigger value="satellite">
                  <Satellite className="mr-1.5 h-3.5 w-3.5" />
                  2. แผนผังดาวเทียมแสดงการติดตั้ง
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: POLE & VIEW PHOTOS */}
              <TabsContent value="photos" className="space-y-4">
                {activeSite.layoutMode === 'per-camera' && activeCam ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {activeSite.cameras.map((cam, idx) => (
                        <Button
                          key={cam.id}
                          type="button"
                          size="sm"
                          variant={idx === safeCamIdx ? 'primary' : 'outline'}
                          onClick={() => setActiveCamIdx(idx)}
                        >
                          CAM {cam.camNumber} ({cam.supportLength === 'none' ? 'ร่วม' : `${cam.supportLength}m`})
                        </Button>
                      ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      {/* Left: Per-camera Pole Photo + Stickers */}
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800">
                            รูปเสา/จุดติดตั้ง (CAM {activeCam.camNumber})
                          </span>
                          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                            <ImagePlus className="h-3.5 w-3.5" />
                            อัปโหลดรูปเสา
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadPolePhoto(e, 'per-cam')}
                            />
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() =>
                              addSticker('cam-pole', 'camera', `CAM ${activeCam.camNumber}`)
                            }
                          >
                            <Plus className="h-3 w-3" /> รูปกล้อง
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() =>
                              addSticker('cam-pole', 'cam-label', `CAM ${activeCam.camNumber}`)
                            }
                          >
                            <Tag className="h-3 w-3" /> ป้าย CAM {activeCam.camNumber}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() =>
                              addSticker('cam-pole', 'cabinet', 'ตู้จัดเก็บอุปกรณ์')
                            }
                          >
                            <Plus className="h-3 w-3" /> รูปตู้
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() =>
                              addSticker('cam-pole', 'cabinet-label', 'ตู้จัดเก็บอุปกรณ์')
                            }
                          >
                            <Tag className="h-3 w-3" /> ป้ายตู้
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() =>
                              addSticker('cam-pole', 'pole', 'เสาเหล็ก 4M')
                            }
                          >
                            <Plus className="h-3 w-3 text-red-600" /> เสาเหล็กแดง
                          </Button>
                        </div>

                        <StickerCanvas
                          imageUrl={activeCam.polePhoto || activeSite.sharedPolePhoto}
                          placeholderText="อัปโหลดรูปถ่ายจุดติดตั้ง (ด้านซ้ายของสไลด์)"
                          stickers={activeCam.poleStickers}
                          onChange={(stickers) =>
                            updateSite({
                              cameras: activeSite.cameras.map((c, idx) =>
                                idx === safeCamIdx ? { ...c, poleStickers: stickers } : c
                              ),
                            })
                          }
                          aspectClass="aspect-[3/4]"
                        />

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Input
                            value={activeCam.lat}
                            onChange={(e) =>
                              updateSite({
                                cameras: activeSite.cameras.map((c, idx) =>
                                  idx === safeCamIdx ? { ...c, lat: e.target.value } : c
                                ),
                              })
                            }
                            placeholder="Lat กล้องนี้"
                            className="h-7 font-mono text-xs"
                          />
                          <Input
                            value={activeCam.lng}
                            onChange={(e) =>
                              updateSite({
                                cameras: activeSite.cameras.map((c, idx) =>
                                  idx === safeCamIdx ? { ...c, lng: e.target.value } : c
                                ),
                              })
                            }
                            placeholder="Long กล้องนี้"
                            className="h-7 font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Right: Per-camera View Photo */}
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800">
                            รูปมุมมองกล้อง {activeCam.camNumber} (ด้านขวาของสไลด์)
                          </span>
                          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                            <ImagePlus className="h-3.5 w-3.5" />
                            อัปโหลดมุมมอง
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadViewPhoto(e, safeCamIdx)}
                            />
                          </label>
                        </div>

                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          {activeCam.viewPhoto ? (
                            <img
                              src={activeCam.viewPhoto}
                              alt={`Cam ${activeCam.camNumber} View`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                              ยังไม่มีรูปมุมมองกล้อง {activeCam.camNumber}
                            </div>
                          )}
                          <div className="absolute bottom-3 right-3 border-2 border-white bg-[#FFC000] px-3 py-0.5 text-xs font-bold text-slate-900 shadow">
                            มุมมองกล้อง {activeCam.camNumber}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* COMBINED MODE (Like Site 9) */
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          รูปเสา/จุดติดตั้งรวม (ใช้ร่วมทุกกล้องในสไลด์เดียว)
                        </span>
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <ImagePlus className="h-3.5 w-3.5" />
                          อัปโหลดรูปเสารวม
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadPolePhoto(e, 'shared')}
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() =>
                            addSticker(
                              'shared-pole',
                              'camera',
                              `CAM ${activeSite.cameras.length}`
                            )
                          }
                        >
                          <Plus className="h-3 w-3" /> รูปกล้อง
                        </Button>
                        {activeSite.cameras.map((c) => (
                          <Button
                            key={c.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() =>
                              addSticker('shared-pole', 'cam-label', `CAM ${c.camNumber}`)
                            }
                          >
                            <Tag className="h-3 w-3" /> CAM {c.camNumber}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() =>
                            addSticker('shared-pole', 'cabinet', 'ตู้จัดเก็บอุปกรณ์')
                          }
                        >
                          <Plus className="h-3 w-3" /> รูปตู้
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() =>
                            addSticker('shared-pole', 'cabinet-label', 'ตู้จัดเก็บอุปกรณ์')
                          }
                        >
                          <Tag className="h-3 w-3" /> ป้ายตู้
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => addSticker('shared-pole', 'pole', 'เสาเหล็ก 4M')}
                        >
                          <Plus className="h-3 w-3 text-red-600" /> เสาเหล็กแดง
                        </Button>
                      </div>

                      <StickerCanvas
                        imageUrl={activeSite.sharedPolePhoto}
                        placeholderText="อัปโหลดรูปจุดติดตั้งรวม (ด้านซ้ายของสไลด์)"
                        stickers={activeSite.sharedPoleStickers}
                        onChange={(stickers) => updateSite({ sharedPoleStickers: stickers })}
                        aspectClass="aspect-[3/4]"
                      />
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                      <span className="text-xs font-semibold text-slate-800">
                        รูปมุมมองกล้องทั้งหมด ({activeSite.cameras.length} กล้อง)
                      </span>
                      <div className="space-y-3">
                        {activeSite.cameras.map((cam, idx) => (
                          <div
                            key={cam.id}
                            className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700">
                                มุมมองกล้อง {cam.camNumber}
                              </span>
                              <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100">
                                <ImagePlus className="h-3 w-3" />
                                เลือกรูป
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleUploadViewPhoto(e, idx)}
                                />
                              </label>
                            </div>
                            <div className="relative aspect-[16/10] w-full overflow-hidden rounded border border-slate-200 bg-slate-100">
                              {cam.viewPhoto ? (
                                <img
                                  src={cam.viewPhoto}
                                  alt={`View ${cam.camNumber}`}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                  ยังไม่มีรูปมุมมองกล้อง {cam.camNumber}
                                </div>
                              )}
                              <div className="absolute bottom-2 right-2 border-2 border-white bg-[#FFC000] px-2.5 py-0.5 text-[11px] font-bold text-slate-900 shadow">
                                มุมมองกล้อง {cam.camNumber}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: SITE SATELLITE MAP PLAN */}
              <TabsContent value="satellite" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      disabled={capturingSat}
                      onClick={handleAutoCaptureSiteSat}
                    >
                      {capturingSat ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      ดึงภาพดาวเทียมจากพิกัดอัตโนมัติ
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setMapModalOpen(true)}
                    >
                      <MapPin className="h-3.5 w-3.5 text-red-500" />
                      เลือกมุม/ซูมบนแผนที่
                    </Button>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      <ImagePlus className="h-3.5 w-3.5" />
                      อัปโหลดภาพดาวเทียมเอง
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadSatPhoto}
                      />
                    </label>
                  </div>
                </div>

                {satError && (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {satError}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {activeSite.cameras.map((c) => (
                    <Button
                      key={c.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => addSticker('satellite', 'cam-cone', `C${c.camNumber}`)}
                    >
                      <Plus className="h-3 w-3 text-red-600" /> กล้อง C{c.camNumber} + รัศมี
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() =>
                      addSticker('satellite', 'callout', 'จุดติดตั้งตู้อุปกรณ์')
                    }
                  >
                    <Plus className="h-3 w-3" /> ป้ายตู้อุปกรณ์
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => addSticker('satellite', 'meter', 'จุดติดตั้งมิเตอร์')}
                  >
                    <Plus className="h-3 w-3" /> จุดติดตั้งมิเตอร์
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => addSticker('satellite', 'cat6', 'CAT6')}
                  >
                    <Plus className="h-3 w-3" /> ป้าย CAT6
                  </Button>
                </div>

                <StickerCanvas
                  imageUrl={activeSite.satellitePhoto}
                  placeholderText="กด 'ดึงภาพดาวเทียมจากพิกัดอัตโนมัติ' หรืออัปโหลดภาพดาวเทียมจุดติดตั้ง"
                  stickers={activeSite.satelliteStickers}
                  onChange={(stickers) => updateSite({ satelliteStickers: stickers })}
                  aspectClass="aspect-[16/10]"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <MapPinModal
        open={mapModalOpen}
        onOpenChange={setMapModalOpen}
        initialLat={activeSite.lat}
        initialLng={activeSite.lng}
        title={`แผนที่ดาวเทียม: จุดที่ ${activeSite.siteNumber} ${activeSite.siteName}`}
        onConfirmCoord={(lat, lng) => updateSite({ lat, lng })}
        onCaptureSatellite={(dataUrl, lat, lng) =>
          updateSite({ satellitePhoto: dataUrl, lat, lng })
        }
      />
    </div>
  );
}
