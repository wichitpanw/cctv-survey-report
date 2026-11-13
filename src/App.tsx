import { useEffect, useState } from 'react';
import type { SurveyProject } from '@/types/survey';
import { SAMPLE_PROJECT, createEmptyProject } from '@/data/sampleProject';
import {
  downloadProjectJson,
  loadProjectFromIndexedDb,
  parseProjectJsonFile,
  saveProjectToIndexedDb,
} from '@/lib/storage';
import { generateSurveyPptx } from '@/lib/pptxGenerator';
import { AppShell, type NavTabId } from '@/components/layout/AppShell';
import { ProjectOverviewSection } from '@/components/sections/ProjectOverviewSection';
import { SitesTableSection } from '@/components/sections/SitesTableSection';
import { SiteDetailStudio } from '@/components/sections/SiteDetailStudio';
import { DiagramAndSummarySection } from '@/components/sections/DiagramAndSummarySection';
import { SlidePreviewSection } from '@/components/sections/SlidePreviewSection';

export function App() {
  const [project, setProject] = useState<SurveyProject>(SAMPLE_PROJECT);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    SAMPLE_PROJECT.sites[5]?.id || SAMPLE_PROJECT.sites[0]?.id || ''
  );
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Load saved project from IndexedDB on mount
  useEffect(() => {
    loadProjectFromIndexedDb()
      .then((saved) => {
        if (saved && Array.isArray(saved.sites) && saved.sites.length > 0) {
          setProject(saved);
          const firstDetail = saved.sites.find((s) => s.includeDetailSlides) || saved.sites[0];
          if (firstDetail) setSelectedSiteId(firstDetail.id);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  // Debounced auto-save to IndexedDB
  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveProjectToIndexedDb(project)
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('saved'));
    }, 450);
    return () => clearTimeout(timer);
  }, [project, hydrated]);

  const handleLoadSample = () => {
    setProject(SAMPLE_PROJECT);
    setSelectedSiteId(SAMPLE_PROJECT.sites[5]?.id || SAMPLE_PROJECT.sites[0]?.id || '');
    setBannerError(null);
  };

  const handleNewProject = () => {
    const empty = createEmptyProject();
    setProject(empty);
    setSelectedSiteId(empty.sites[0]?.id || '');
    setBannerError(null);
  };

  const handleImportJson = async (file: File) => {
    try {
      const imported = await parseProjectJsonFile(file);
      setProject(imported);
      setSelectedSiteId(imported.sites[0]?.id || '');
      setBannerError(null);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'นำเข้าไฟล์ JSON ไม่สำเร็จ');
    }
  };

  const handleExportPptx = async () => {
    setExporting(true);
    setBannerError(null);
    try {
      await generateSurveyPptx(project);
    } catch (err) {
      setBannerError(
        err instanceof Error
          ? `ไม่สามารถสร้างไฟล์ PPTX ได้: ${err.message}`
          : 'เกิดข้อผิดพลาดระหว่างสร้างไฟล์ PPTX'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell
      project={project}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onLoadSample={handleLoadSample}
      onNewProject={handleNewProject}
      onExportJson={() => downloadProjectJson(project)}
      onImportJson={handleImportJson}
      onExportPptx={handleExportPptx}
      exporting={exporting}
      saveStatus={saveStatus}
      >
      {bannerError && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          <span>{bannerError}</span>
          <button
            type="button"
            onClick={() => setBannerError(null)}
            className="font-semibold underline cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {activeTab === 'overview' && (
        <ProjectOverviewSection project={project} onChange={setProject} />
      )}

      {activeTab === 'table' && (
        <SitesTableSection
          project={project}
          onChange={setProject}
          onJumpToSiteDetail={(siteId) => {
            setSelectedSiteId(siteId);
            setActiveTab('site-studio');
          }}
        />
      )}

      {activeTab === 'site-studio' && (
        <SiteDetailStudio
          project={project}
          selectedSiteId={selectedSiteId}
          onSelectSiteId={setSelectedSiteId}
          onChange={setProject}
        />
      )}

      {activeTab === 'diagram' && (
        <DiagramAndSummarySection project={project} onChange={setProject} />
      )}

      {activeTab === 'preview' && (
        <SlidePreviewSection
          project={project}
          onExportPptx={handleExportPptx}
          exporting={exporting}
        />
      )}
    </AppShell>
  );
}

export default App;
