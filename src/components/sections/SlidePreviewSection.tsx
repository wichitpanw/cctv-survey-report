import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import type { SurveyProject, SurveySite, StickerOverlay } from '@/types/survey';
import { computeProjectStats } from '@/lib/exifAndCoords';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConceptDiagramCanvas } from '@/components/studio/ConceptDiagramCanvas';
import { cn } from '@/lib/utils';

interface SlideDescriptor {
  id: string;
  title: string;
  kind:
    | 'cover'
    | 'overview-map'
    | 'overview-sat'
    | 'table'
    | 'diagram'
    | 'site-per-camera'
    | 'site-combined'
    | 'site-sat'
    | 'shop-drawing'
    | 'summary'
    | 'back-cover';
  site?: SurveySite;
  camIndex?: number;
  pageIndex?: number;
  totalPages?: number;
  sitesSlice?: SurveySite[];
}

interface SlidePreviewSectionProps {
  project: SurveyProject;
  onExportPptx: () => void;
  exporting: boolean;
}

function SlideHeaderFooter({ heading }: { heading?: string }) {
  return (
    <>
      <img
        src="./assets/template/nt-logo-header.jpeg"
        alt="NT"
        className="absolute left-[2%] top-[1.8%] h-[8%] object-contain"
      />
      <div className="absolute right-[1.5%] top-[3%] h-[12%] w-[0.7%] rounded-full bg-[#FFD100]" />
      {heading && (
        <div className="absolute right-[3.2%] top-[3%] w-[62%] text-right text-[1.15em] font-bold text-slate-800 truncate">
          {heading}
        </div>
      )}
      <img
        src="./assets/template/nt-cyfence-footer.png"
        alt="CYFENCE"
        className="absolute bottom-[1.8%] left-[1.2%] h-[6%] object-contain"
      />
      <div className="absolute bottom-[1.8%] right-[3.2%] text-[0.55em] text-slate-600">
        © National Telecom All Rights Reserved
      </div>
      <div className="absolute bottom-0 right-[1.5%] h-[5%] w-[1.3%] rounded-t bg-[#FFD100]" />
    </>
  );
}

function renderStickerOverlay(stickers: StickerOverlay[]) {
  return stickers.map((st) => (
    <div
      key={st.id}
      style={{
        left: `${st.x}%`,
        top: `${st.y}%`,
        transform: 'translate(-50%, -50%)',
        width: st.type === 'pole' ? `${st.w ?? 4}%` : undefined,
        height: st.type === 'pole' ? `${st.h ?? 65}%` : undefined,
      }}
      className="absolute pointer-events-none"
    >
      {st.type === 'pole' && <div className="h-full w-full bg-red-600 opacity-90" />}
      {st.type === 'camera' && (
        <img src="./assets/template/sticker-camera.png" alt="" className="h-6 w-8 object-contain" />
      )}
      {st.type === 'cabinet' && (
        <img src="./assets/template/sticker-cabinet.png" alt="" className="h-8 w-7 object-contain" />
      )}
      {(st.type === 'cam-label' || st.type === 'cabinet-label') && (
        <div className="whitespace-nowrap border border-white bg-[#FFC000] px-1.5 py-0 text-[0.65em] font-bold text-slate-900">
          {st.label}
        </div>
      )}
      {st.type === 'cam-cone' && (
        <div className="flex flex-col items-center">
          <div className="rounded border border-orange-500 bg-white px-1 text-[0.55em] font-bold text-slate-900">
            {st.label}
          </div>
          <div
            className="h-2.5 w-3.5 rounded-xs border border-white bg-red-600"
            style={{ transform: `rotate(${st.rotation ?? 0}deg)` }}
          />
        </div>
      )}
      {st.type === 'callout' && (
        <div className="whitespace-nowrap rounded border border-slate-800 bg-white px-1.5 py-0.5 text-[0.55em] font-bold">
          {st.label}
        </div>
      )}
      {st.type === 'meter' && (
        <div className="flex flex-col items-center">
          <div className="whitespace-nowrap border border-amber-400 bg-white px-1 text-[0.55em] font-bold">
            {st.label}
          </div>
          <div className="rounded border border-slate-800 bg-white p-0.5">
            <img src="./assets/template/sticker-meter.png" alt="" className="h-5 w-4 object-contain" />
          </div>
        </div>
      )}
      {st.type === 'cat6' && (
        <div className="rounded border border-sky-600 bg-white px-1 text-[0.55em] font-bold text-sky-700">
          {st.label}
        </div>
      )}
    </div>
  ));
}

export function SlidePreviewSection({
  project,
  onExportPptx,
  exporting,
}: SlidePreviewSectionProps) {
  const stats = computeProjectStats(project);

  const slides = useMemo<SlideDescriptor[]>(() => {
    const list: SlideDescriptor[] = [
      { id: 'cover', title: '1. หน้าปก (Cover)', kind: 'cover' },
      { id: 'ov-map', title: '2. แผนที่รวมพื้นที่', kind: 'overview-map' },
      { id: 'ov-sat', title: '3. แผนผังดาวเทียมรวม', kind: 'overview-sat' },
    ];

    const tablePages = Math.max(1, Math.ceil(project.sites.length / 12));
    for (let p = 0; p < tablePages; p++) {
      list.push({
        id: `tbl-${p}`,
        title: `4. ตารางสรุปจุดติดตั้ง${tablePages > 1 ? ` (${p + 1})` : ''}`,
        kind: 'table',
        pageIndex: p,
        totalPages: tablePages,
        sitesSlice: project.sites.slice(p * 12, (p + 1) * 12),
      });
    }

    const diagPages = Math.max(1, Math.ceil(project.sites.length / 11));
    for (let p = 0; p < diagPages; p++) {
      list.push({
        id: `diag-${p}`,
        title: `5. Concept Diagram${diagPages > 1 ? ` (${p + 1})` : ''}`,
        kind: 'diagram',
        pageIndex: p,
        totalPages: diagPages,
        sitesSlice: project.sites.slice(p * 11, (p + 1) * 11),
      });
    }

    for (const site of project.sites) {
      if (!site.includeDetailSlides) continue;
      if (site.layoutMode === 'per-camera') {
        site.cameras.forEach((_, idx) => {
          list.push({
            id: `site-${site.id}-cam-${idx}`,
            title: `จุดที่ ${site.siteNumber} (${idx + 1}) รูปติดตั้ง`,
            kind: 'site-per-camera',
            site,
            camIndex: idx,
          });
        });
      } else {
        list.push({
          id: `site-${site.id}-comb`,
          title: `จุดที่ ${site.siteNumber} รวมรูปติดตั้ง`,
          kind: 'site-combined',
          site,
        });
      }
      list.push({
        id: `site-${site.id}-sat`,
        title: `จุดที่ ${site.siteNumber} ดาวเทียม`,
        kind: 'site-sat',
        site,
      });
    }

    list.push({ id: 'shop', title: 'แบบมาตรฐานติดตั้งเสา/ตู้', kind: 'shop-drawing' });
    list.push({ id: 'summary', title: 'สรุปจำนวนกล้องและวงจร', kind: 'summary' });
    list.push({ id: 'back', title: 'หน้าปิดท้าย NT', kind: 'back-cover' });
    return list;
  }, [project]);

  const [activeIdx, setActiveIdx] = useState(0);
  const safeIdx = Math.min(activeIdx, slides.length - 1);
  const current = slides[safeIdx];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>พรีวิวสไลด์ทั้งหมดก่อนส่งออก ({slides.length} หน้า)</CardTitle>
            <CardDescription>
              ตรวจสอบลำดับสไลด์ ข้อความ รูปถ่าย และสติกเกอร์ ก่อนกดสร้างไฟล์ PowerPoint (.pptx)
            </CardDescription>
          </div>
          <Button type="button" variant="primary" disabled={exporting} onClick={onExportPptx}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            สร้างไฟล์ PowerPoint (.pptx)
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Navigation bar */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={safeIdx === 0}
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
            </Button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Badge variant="warning">
                สไลด์ {safeIdx + 1} / {slides.length}
              </Badge>
              <span>{current.title}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={safeIdx === slides.length - 1}
              onClick={() => setActiveIdx((i) => Math.min(slides.length - 1, i + 1))}
            >
              ถัดไป <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Main 16:9 Slide Canvas */}
          <div className="mx-auto w-full max-w-4xl">
            <div className="font-slide relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md text-[clamp(9px,1.25vw,16px)]">
              {current.kind === 'cover' && (
                <>
                  <img
                    src="./assets/template/cover-capsules.png"
                    alt=""
                    className="absolute left-[4%] top-[22%] h-[56%] object-contain"
                  />
                  <img
                    src="./assets/template/nt-logo-large.png"
                    alt="NT"
                    className="absolute right-[13%] top-[30%] h-[17%] object-contain"
                  />
                  <div className="absolute right-[5%] top-[59%] w-[56%] text-center font-bold text-[#595959] leading-snug">
                    <div className="text-[1.75em]">{project.projectTitle}</div>
                    <div className="text-[1.65em]">{project.organizationName}</div>
                    <div className="mt-1 text-[1.45em]">{project.surveyDate}</div>
                  </div>
                </>
              )}

              {current.kind === 'overview-map' && (
                <>
                  <SlideHeaderFooter
                    heading={`จุดติดตั้งกล้องทั้งหมดในพื้นที่ ${project.organizationShortName}`}
                  />
                  <div className="absolute left-[15%] top-[12%] h-[78%] w-[70%] overflow-hidden">
                    {project.overviewMapImage && (
                      <img
                        src={project.overviewMapImage}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    )}
                    {project.sites.map((s) => (
                      <div
                        key={s.id}
                        style={{ left: `${s.mapPinX ?? 50}%`, top: `${s.mapPinY ?? 50}%` }}
                        className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center"
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-red-600 border border-white" />
                        <div className="h-1.5 w-0.5 bg-red-700" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {current.kind === 'overview-sat' && (
                <>
                  <SlideHeaderFooter
                    heading={`แผนผังจุดติดตั้งกล้อง CCTV ${project.organizationShortName}`}
                  />
                  <div className="absolute left-[10%] top-[12%] h-[78%] w-[80%] overflow-hidden">
                    {project.overviewSatImage && (
                      <img
                        src={project.overviewSatImage}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    )}
                    {project.sites.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          left: `${s.satCalloutX ?? 50}%`,
                          top: `${s.satCalloutY ?? 50}%`,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded border border-slate-600 bg-white px-1 py-0 text-[0.55em] font-bold shadow"
                      >
                        <span className="bg-cyan-300 px-0.5">
                          จุดที่ {s.siteNumber} {s.siteName}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {current.kind === 'table' && (
                <>
                  <SlideHeaderFooter
                    heading={`แผนผังจุดติดตั้งกล้อง CCTV ${project.organizationShortName}`}
                  />
                  <div className="absolute inset-x-[2%] top-[13%] bottom-[9%] overflow-hidden">
                    <table className="w-full border-collapse text-[0.56em] border border-slate-600">
                      <thead>
                        <tr className="bg-white font-bold">
                          <th rowSpan={2} className="border border-slate-600 px-1">จุดที่</th>
                          <th rowSpan={2} className="border border-slate-600 px-1">ชื่อจุด</th>
                          <th colSpan={2} className="border border-slate-600 px-1">พิกัด</th>
                          <th rowSpan={2} className="border border-slate-600 px-1">กล้อง</th>
                          <th colSpan={4} className="border border-slate-600 px-1">ซับพอร์ต (ม.)</th>
                          <th rowSpan={2} className="border border-slate-600 px-1">ชนิด</th>
                          <th rowSpan={2} className="border border-slate-600 px-1">การจับยึด</th>
                          <th rowSpan={2} className="border border-slate-600 px-1">หมายเหตุ</th>
                        </tr>
                        <tr className="font-bold">
                          <th className="border border-slate-600 bg-white">Lat</th>
                          <th className="border border-slate-600 bg-white">Long</th>
                          <th className="border border-slate-600 bg-[#D8E4BC]">0.5</th>
                          <th className="border border-slate-600 bg-[#D8E4BC]">1</th>
                          <th className="border border-slate-600 bg-[#D8E4BC]">1.5</th>
                          <th className="border border-slate-600 bg-[#D8E4BC]">2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(current.sitesSlice ?? []).map((site, idx) => {
                          const bg = idx % 2 === 0 ? 'bg-[#B8CCE4]' : 'bg-white';
                          const mount = site.cameras[0]?.mountingType || 'เสาการไฟฟ้า';
                          const sup = { '0.5': 0, '1': 0, '1.5': 0, '2': 0 };
                          site.cameras.forEach((c) => {
                            if (c.supportLength !== 'none') sup[c.supportLength]++;
                          });
                          return (
                            <tr key={site.id} className={bg}>
                              <td className="border border-slate-600 text-center">{site.siteNumber}</td>
                              <td className="border border-slate-600 px-1">{site.siteName}</td>
                              <td className="border border-slate-600 text-center font-mono">{site.lat}</td>
                              <td className="border border-slate-600 text-center font-mono">{site.lng}</td>
                              <td className="border border-slate-600 text-center">{site.cameras.length}</td>
                              <td className="border border-slate-600 bg-[#D8E4BC] text-center">{sup['0.5'] || ''}</td>
                              <td className="border border-slate-600 bg-[#D8E4BC] text-center">{sup['1'] || ''}</td>
                              <td className="border border-slate-600 bg-[#D8E4BC] text-center">{sup['1.5'] || ''}</td>
                              <td className="border border-slate-600 bg-[#D8E4BC] text-center">{sup['2'] || ''}</td>
                              <td className="border border-slate-600 text-center">
                                {site.cameras[0]?.cameraType}
                              </td>
                              <td
                                className={cn(
                                  'border border-slate-600 text-center',
                                  mount.includes('ตั้งเสา') && 'bg-yellow-300 font-bold'
                                )}
                              >
                                {mount}
                              </td>
                              <td className="border border-slate-600 bg-white text-center">{site.note}</td>
                            </tr>
                          );
                        })}
                        {current.pageIndex === (current.totalPages ?? 1) - 1 && (
                          <tr className="bg-white font-bold">
                            <td colSpan={3} />
                            <td className="border border-slate-600 text-center">รวม</td>
                            <td className="border border-slate-600 text-center">{stats.totalCameras}</td>
                            <td className="border border-slate-600 text-center">{stats.supportTotals['0.5']}</td>
                            <td className="border border-slate-600 text-center">{stats.supportTotals['1']}</td>
                            <td className="border border-slate-600 text-center">{stats.supportTotals['1.5']}</td>
                            <td className="border border-slate-600 text-center">{stats.supportTotals['2']}</td>
                            <td colSpan={3} />
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {current.kind === 'diagram' && (
                <>
                  <SlideHeaderFooter heading="Concept Diagram" />
                  <ConceptDiagramCanvas
                    project={project}
                    sites={current.sitesSlice ?? project.sites}
                  />
                </>
              )}

              {current.kind === 'site-per-camera' && current.site && (
                <>
                  {(() => {
                    const cam = current.site.cameras[current.camIndex ?? 0];
                    return (
                      <>
                        <SlideHeaderFooter
                          heading={`จุดที่ ${current.site.siteNumber} (${cam.camNumber}) : ${current.site.siteName} : จำนวน ${cam.camNumber}/${current.site.cameras.length} กล้อง`}
                        />
                        <div className="absolute left-[7%] top-[13%] h-[65%] w-[30%] overflow-hidden bg-slate-50">
                          {(cam.polePhoto || current.site.sharedPolePhoto) && (
                            <img
                              src={cam.polePhoto || current.site.sharedPolePhoto}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          )}
                          {renderStickerOverlay(cam.poleStickers)}
                        </div>
                        <div className="absolute left-[7%] top-[80%] w-[30%] text-center text-[0.75em]">
                          <div>{current.site.captionText}</div>
                          <div className="font-bold text-[#0070C0]">
                            ({cam.lat || current.site.lat} , {cam.lng || current.site.lng})
                          </div>
                        </div>
                        <div className="absolute left-[40%] top-[43%] text-[1.4em] font-bold text-blue-600">
                          ➡
                        </div>
                        <div className="absolute right-[6%] top-[16%] h-[60%] w-[47%] overflow-hidden bg-slate-50">
                          {cam.viewPhoto && (
                            <img src={cam.viewPhoto} alt="" className="h-full w-full object-contain" />
                          )}
                          <div className="absolute bottom-2 right-2 border border-white bg-[#FFC000] px-2 py-0.5 text-[0.75em] font-bold">
                            มุมมองกล้อง {cam.camNumber}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {current.kind === 'site-combined' && current.site && (
                <>
                  <SlideHeaderFooter
                    heading={`จุดที่ ${current.site.siteNumber} : ${current.site.siteName} : จำนวน ${current.site.cameras.length} กล้อง`}
                  />
                  <div className="absolute left-[6%] top-[13%] h-[66%] w-[30%] overflow-hidden bg-slate-50">
                    {current.site.sharedPolePhoto && (
                      <img
                        src={current.site.sharedPolePhoto}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    )}
                    {renderStickerOverlay(current.site.sharedPoleStickers)}
                  </div>
                  <div className="absolute left-[6%] top-[81%] w-[30%] text-center text-[0.75em]">
                    <div>{current.site.captionText}</div>
                    <div className="font-bold text-[#0070C0]">
                      ({current.site.lat} , {current.site.lng})
                    </div>
                  </div>
                  <div className="absolute right-[6%] top-[14%] flex h-[72%] w-[42%] flex-col gap-2">
                    {current.site.cameras.map((cam) => (
                      <div key={cam.id} className="relative flex-1 overflow-hidden bg-slate-50">
                        {cam.viewPhoto && (
                          <img src={cam.viewPhoto} alt="" className="h-full w-full object-contain" />
                        )}
                        <div className="absolute bottom-1.5 right-1.5 border border-white bg-[#FFC000] px-2 py-0 text-[0.65em] font-bold">
                          มุมมองกล้อง {cam.camNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {current.kind === 'site-sat' && current.site && (
                <>
                  <SlideHeaderFooter
                    heading={`จุดที่ ${current.site.siteNumber} : ${current.site.siteName} : จำนวน ${current.site.cameras.length} กล้อง`}
                  />
                  <div className="absolute right-[3.2%] top-[9%] text-[0.9em] font-bold text-slate-800">
                    แผนผังดาวเทียมแสดงการติดตั้ง
                  </div>
                  <div className="absolute left-[15%] top-[16%] h-[72%] w-[70%] overflow-hidden bg-slate-900">
                    {current.site.satellitePhoto && (
                      <img
                        src={current.site.satellitePhoto}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    )}
                    {renderStickerOverlay(current.site.satelliteStickers)}
                  </div>
                </>
              )}

              {current.kind === 'shop-drawing' && (
                <>
                  <SlideHeaderFooter />
                  <img
                    src={project.shopDrawingImage || './assets/template/shop-drawing-default.png'}
                    alt="Shop Drawing"
                    className="absolute left-[6%] top-[11%] h-[78%] w-[88%] object-contain"
                  />
                </>
              )}

              {current.kind === 'summary' && (
                <>
                  <SlideHeaderFooter heading="สรุปจำนวนกล้องและอุปกรณ์ติดตั้ง" />
                  <div className="absolute left-[21%] top-[19%] w-[58%] overflow-hidden border border-white text-[1.15em]">
                    <div className="grid grid-cols-2 border-b-2 border-white">
                      <div className="bg-[#FFC000] px-4 py-2 font-bold text-white">จำนวนกล้องทั้งหมด</div>
                      <div className="bg-[#FCE4D6] px-4 py-2 text-center font-semibold">
                        {stats.totalCameras} กล้อง
                      </div>
                    </div>
                    <div className="grid grid-cols-2 border-b-2 border-white">
                      <div className="bg-[#FFC000] px-4 py-2 font-bold text-white">จำนวนวงจรย่อย</div>
                      <div className="bg-[#FDF2EA] px-4 py-2 text-center font-semibold">
                        {project.subCircuitCount} วงจร
                      </div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="bg-[#FFC000] px-4 py-2 font-bold text-white">จำนวนวงจรหลัก</div>
                      <div className="bg-[#FCE4D6] px-4 py-2 text-center font-semibold">
                        {project.mainCircuitCount} วงจร
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-[5%] top-[53%] text-[1.05em]">
                    <div className="font-bold">หมายเหตุ</div>
                    <div className="ml-8 mt-1 space-y-0.5">
                      {project.summaryNotes.map((n, i) => (
                        <div key={i}>- {n}</div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {current.kind === 'back-cover' && (
                <>
                  <img
                    src="./assets/template/back-cover-bg.jpeg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute -left-[6%] top-[31%] flex h-[41%] w-[45%] items-center justify-center rounded-r-full bg-white pl-[10%]">
                    <img
                      src="./assets/template/nt-logo-large.png"
                      alt="NT"
                      className="h-[44%] object-contain"
                    />
                  </div>
                  <div className="absolute -right-[6%] top-[31%] flex h-[41%] w-[63%] flex-col items-center justify-center rounded-l-full bg-white pr-[8%] text-center">
                    <div className="text-[1.25em] font-bold text-slate-800">
                      บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)
                    </div>
                    <div className="text-[1.05em] text-slate-700">
                      National Telecom Public Company Limited
                    </div>
                    <div className="my-2 h-1 w-[70%] rounded-full bg-[#FFD100]" />
                    <div className="text-[1.05em] text-slate-800">
                      www.ntplc.co.th | Contact Center 1888
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  'shrink-0 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors cursor-pointer',
                  idx === safeIdx
                    ? 'border-amber-500 bg-amber-50 font-semibold text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                <span className="mr-1.5 text-[10px] text-slate-400">#{idx + 1}</span>
                {s.title}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
