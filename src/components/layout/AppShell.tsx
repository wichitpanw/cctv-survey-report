import React from 'react';
import {
  Camera,
  Download,
  FileJson,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  Network,
  Presentation,
  RotateCcw,
  Table2,
} from 'lucide-react';
import type { SurveyProject } from '@/types/survey';
import { computeProjectStats } from '@/lib/exifAndCoords';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type NavTabId = 'overview' | 'table' | 'site-studio' | 'diagram' | 'preview';

interface AppShellProps {
  project: SurveyProject;
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onLoadSample: () => void;
  onNewProject: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onExportPptx: () => void;
  exporting: boolean;
  saveStatus: 'saved' | 'saving';
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: NavTabId;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'overview',
    label: 'ข้อมูลโครงการ & แผนที่รวม',
    sublabel: 'หน้าปก, Slide 1-3',
    icon: LayoutDashboard,
  },
  {
    id: 'table',
    label: 'ตารางจุดติดตั้งทั้งหมด',
    sublabel: 'พิกัด, ซับพอร์ต, Slide 4',
    icon: Table2,
  },
  {
    id: 'site-studio',
    label: 'รายละเอียดรายจุด & รูปถ่าย',
    sublabel: 'สติกเกอร์, ดาวเทียม, Slide 6-11',
    icon: Camera,
  },
  {
    id: 'diagram',
    label: 'ผังระบบ & สรุปวงจร',
    sublabel: 'Diagram, แบบเสา, Slide 5, 12-13',
    icon: Network,
  },
  {
    id: 'preview',
    label: 'พรีวิวสไลด์ & ส่งออก PPTX',
    sublabel: 'ตรวจสอบทุกหน้าก่อน Export',
    icon: Presentation,
  },
];

export function AppShell({
  project,
  activeTab,
  onSelectTab,
  onLoadSample,
  onNewProject,
  onExportJson,
  onImportJson,
  onExportPptx,
  exporting,
  saveStatus,
  children,
}: AppShellProps) {
  const stats = computeProjectStats(project);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50">
      {/* Sidebar (blocks.so sidebar-01 style) */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-72 lg:border-b-0 lg:border-r flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD100] font-bold text-slate-900 shadow-2xs">
            NT
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">
              CCTV Survey Studio
            </div>
            <div className="truncate text-[11px] text-slate-500">
              รายงานสำรวจจุดติดตั้ง {'->'} PPTX
            </div>
          </div>
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer',
                  active
                    ? 'bg-amber-50 text-slate-900 ring-1 ring-amber-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    active ? 'text-amber-600' : 'text-slate-400'
                  )}
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">{item.label}</div>
                  <div className="truncate text-[10px] text-slate-500">{item.sublabel}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <Separator />

        {/* Project quick actions */}
        <div className="space-y-2 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            จัดการโปรเจกต์
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={onLoadSample}
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
            โหลดข้อมูลตัวอย่าง (อบต.บางตะไนย์)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={onNewProject}
          >
            <FilePlus2 className="h-3.5 w-3.5 text-slate-600" />
            เริ่มโครงการใหม่ (ว่าง)
          </Button>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onExportJson}
            >
              <FileJson className="h-3.5 w-3.5" />
              Save JSON
            </Button>
            <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <FolderOpen className="h-3.5 w-3.5" />
              Open JSON
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportJson(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Action Bar */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-bold text-slate-900">
                {project.projectTitle} — {project.organizationShortName}
              </h1>
              <Badge variant={saveStatus === 'saved' ? 'success' : 'secondary'}>
                {saveStatus === 'saved' ? 'บันทึกอัตโนมัติแล้ว' : 'กำลังบันทึก...'}
              </Badge>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{stats.totalSites} จุดติดตั้ง</span>
              <span>•</span>
              <span>{stats.totalCameras} กล้อง</span>
              <span>•</span>
              <span>
                วงจรย่อย {project.subCircuitCount} / หลัก {project.mainCircuitCount}
              </span>
              <span>•</span>
              <span>รวม {stats.estimatedSlidesCount} สไลด์</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectTab('preview')}
            >
              <Presentation className="h-4 w-4" />
              พรีวิวสไลด์
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={exporting}
              onClick={onExportPptx}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              สร้างไฟล์ PowerPoint (.pptx)
            </Button>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
