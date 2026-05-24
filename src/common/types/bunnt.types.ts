export interface BunnyVideoDetail {
  videoLibraryId: number;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number;
  status: number;
  framerate: number;
  width: number;
  height: number;
  outputCodecs: string;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  hasMP4Fallback: boolean;
  averageWatchTime: number;
  totalWatchTime: number;
  description: string | null;
  rotation: number | null;
  availableResolutions: string | null;
  captions:
    | {
        srclang: string;
      }[]
    | null;
}
