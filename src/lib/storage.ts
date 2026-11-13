import { get, set } from 'idb-keyval';
import type { SurveyProject } from '@/types/survey';

const STORAGE_KEY = 'nt-cctv-survey-project-v1';

export async function saveProjectToIndexedDb(project: SurveyProject): Promise<void> {
  await set(STORAGE_KEY, project);
}

export async function loadProjectFromIndexedDb(): Promise<SurveyProject | undefined> {
  return get<SurveyProject>(STORAGE_KEY);
}

export function downloadProjectJson(project: SurveyProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeOrg = (project.organizationShortName || 'survey').replace(/[\\/:*?"<>|]/g, '_');
  a.download = `cctv-survey-${safeOrg}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseProjectJsonFile(file: File): Promise<SurveyProject> {
  const text = await file.text();
  const parsed = JSON.parse(text) as SurveyProject;
  if (!parsed || !Array.isArray(parsed.sites)) {
    throw new Error('ไฟล์ JSON ไม่ถูกต้อง (ไม่พบข้อมูลจุดติดตั้ง)');
  }
  return parsed;
}
