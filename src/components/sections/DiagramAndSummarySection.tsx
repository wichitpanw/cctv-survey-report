import React from 'react';
import { ImagePlus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { SurveyProject } from '@/types/survey';
import { computeProjectStats, fileToCompressedDataUrl } from '@/lib/exifAndCoords';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConceptDiagramCanvas } from '@/components/studio/ConceptDiagramCanvas';

interface DiagramAndSummarySectionProps {
  project: SurveyProject;
  onChange: (updater: (prev: SurveyProject) => SurveyProject) => void;
}

export function DiagramAndSummarySection({
  project,
  onChange,
}: DiagramAndSummarySectionProps) {
  const stats = computeProjectStats(project);

  const handleUploadShopDrawing = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataUrl(file, 1800);
    onChange((prev) => ({ ...prev, shopDrawingImage: dataUrl }));
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Slide 5: Concept Diagram */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ผังระบบ Concept Diagram (Slide 5)</CardTitle>
              <CardDescription>
                ระบบจะสร้างผังเชื่อมโยงทุกจุด ({stats.totalSites} จุด) ผ่าน NT Network เข้าห้อง Control อัตโนมัติในไฟล์ PPTX
              </CardDescription>
            </div>
            <Badge variant="info">Auto Native PPTX</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>ชื่อหัวข้อห้องควบคุม (Control Room)</Label>
              <Input
                value={project.controlRoom.title}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    controlRoom: { ...prev.controlRoom, title: e.target.value },
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>จอแสดงผล</Label>
                <Input
                  value={project.controlRoom.displaySpec}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      controlRoom: { ...prev.controlRoom, displaySpec: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>เครือข่ายกลาง</Label>
                <Input
                  value={project.controlRoom.networkLabel}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      controlRoom: { ...prev.controlRoom, networkLabel: e.target.value },
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>อุปกรณ์ในตู้ Control (คั่นด้วยเครื่องหมายจุลภาค ,)</Label>
              <Input
                value={project.controlRoom.equipments.join(', ')}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    controlRoom: {
                      ...prev.controlRoom,
                      equipments: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  }))
                }
              />
            </div>
          </div>

          {/* Live visual preview of Concept Diagram topology */}
          <div className="font-slide relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs text-[clamp(7px,0.9vw,11px)]">
            <ConceptDiagramCanvas
              project={project}
              sites={project.sites.slice(0, 11)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Slide 12: Shop Drawing */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>แบบมาตรฐานติดตั้งเสาและตู้ (Slide 12)</CardTitle>
                <CardDescription>ใช้แบบมาตรฐาน NT หรืออัปโหลดแบบใหม่เฉพาะโครงการได้</CardDescription>
              </div>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      shopDrawingImage: './assets/template/shop-drawing-default.png',
                    }))
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  ค่าเริ่มต้น
                </Button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <ImagePlus className="h-3.5 w-3.5" />
                  เปลี่ยนแบบ
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadShopDrawing}
                  />
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={
                  project.shopDrawingImage || './assets/template/shop-drawing-default.png'
                }
                alt="Shop Drawing"
                className="h-full w-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Slide 13: Summary Counts & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>สรุปจำนวนกล้องและวงจรติดตั้ง (Slide 13)</CardTitle>
            <CardDescription>
              กำหนดจำนวนวงจรย่อย วงจรหลัก และหมายเหตุท้ายรายงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-slate-200 text-sm">
              <div className="grid grid-cols-2 border-b border-white">
                <div className="bg-[#FFC000] px-4 py-2.5 font-bold text-white">
                  จำนวนกล้องทั้งหมด
                </div>
                <div className="bg-[#FCE4D6] px-4 py-2.5 text-center font-semibold text-slate-900">
                  {stats.totalCameras} กล้อง (คำนวณอัตโนมัติ)
                </div>
              </div>
              <div className="grid grid-cols-2 border-b border-white">
                <div className="bg-[#FFC000] px-4 py-2.5 font-bold text-white">
                  จำนวนวงจรย่อย
                </div>
                <div className="flex items-center justify-center gap-2 bg-[#FDF2EA] px-4 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={project.subCircuitCount}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        subCircuitCount: Number(e.target.value) || 0,
                      }))
                    }
                    className="h-7 w-20 bg-white text-center font-semibold"
                  />
                  <span className="text-xs font-medium text-slate-700">วงจร</span>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div className="bg-[#FFC000] px-4 py-2.5 font-bold text-white">
                  จำนวนวงจรหลัก
                </div>
                <div className="flex items-center justify-center gap-2 bg-[#FCE4D6] px-4 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={project.mainCircuitCount}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        mainCircuitCount: Number(e.target.value) || 0,
                      }))
                    }
                    className="h-7 w-20 bg-white text-center font-semibold"
                  />
                  <span className="text-xs font-medium text-slate-700">วงจร</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>หมายเหตุ</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      summaryNotes: [...prev.summaryNotes, ''],
                    }))
                  }
                >
                  <Plus className="h-3 w-3" /> เพิ่มบรรทัด
                </Button>
              </div>
              {project.summaryNotes.map((note, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">-</span>
                  <Input
                    value={note}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        summaryNotes: prev.summaryNotes.map((n, i) =>
                          i === idx ? e.target.value : n
                        ),
                      }))
                    }
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500"
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        summaryNotes: prev.summaryNotes.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
