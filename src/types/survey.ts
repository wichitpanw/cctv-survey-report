export type SupportLength = '0.5' | '1' | '1.5' | '2' | 'none';

export type SlideLayoutMode = 'per-camera' | 'combined';

export type StickerType =
  | 'camera'
  | 'cam-label'
  | 'cabinet'
  | 'cabinet-label'
  | 'meter'
  | 'meter-label'
  | 'pole'
  | 'callout'
  | 'cam-cone'
  | 'cat6';

export interface StickerOverlay {
  id: string;
  type: StickerType;
  label: string;
  x: number; // Normalized percentage (0-100)
  y: number; // Normalized percentage (0-100)
  w?: number; // Optional percentage width
  h?: number; // Optional percentage height
  rotation?: number; // Degrees for cam-cone
  direction?: 'left' | 'right'; // Direction for single camera sticker
  color?: string;
}

export interface CameraItem {
  id: string;
  camNumber: number;
  lat: string;
  lng: string;
  supportLength: SupportLength;
  cameraType: string;
  mountingType: string;
  polePhoto?: string;
  viewPhoto?: string;
  poleStickers: StickerOverlay[];
}

export interface SurveySite {
  id: string;
  siteNumber: number;
  siteName: string;
  lat: string;
  lng: string;
  layoutMode: SlideLayoutMode;
  includeDetailSlides: boolean;
  sharedPolePhoto?: string;
  sharedPoleStickers: StickerOverlay[];
  satellitePhoto?: string;
  satelliteStickers: StickerOverlay[];
  captionText: string;
  note?: string;
  mapPinX?: number;
  mapPinY?: number;
  satCalloutX?: number;
  satCalloutY?: number;
  cameras: CameraItem[];
}

export interface ControlRoomConfig {
  title: string;
  displaySpec: string;
  networkLabel: string;
  linkLabel: string;
  equipments: string[];
}

export interface SurveyProject {
  id: string;
  projectTitle: string;
  organizationName: string;
  organizationShortName: string;
  surveyDate: string;
  googleMapsUrl: string;
  overviewMapImage?: string;
  overviewSatImage?: string;
  shopDrawingImage?: string;
  subCircuitCount: number;
  mainCircuitCount: number;
  summaryNotes: string[];
  controlRoom: ControlRoomConfig;
  sites: SurveySite[];
}
