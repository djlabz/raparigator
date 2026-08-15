export type AnnouncementMediaArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AnnouncementMediaOperationKind = "blur" | "edit";

export type AnnouncementMediaBlurMode = "crop" | "brush";

export type AnnouncementMediaHistoryEntry = {
  parent: string;
  operation: AnnouncementMediaOperationKind;
  cropArea?: AnnouncementMediaArea;
  blurMode?: AnnouncementMediaBlurMode;
  blurMaskDataUrl?: string;
};

export type AnnouncementMediaHistoryMap = Record<string, AnnouncementMediaHistoryEntry>;

export type AnnouncementMediaHistoryItem = {
  src: string;
  entry: AnnouncementMediaHistoryEntry;
};

export type AnnouncementMediaSourceOffset = {
  x: number;
  y: number;
};

export type AnnouncementMediaRebuildResult = {
  src: string;
  entries: AnnouncementMediaHistoryItem[];
};

export type AnnouncementMediaBlurInput = {
  src: string;
  mode: AnnouncementMediaBlurMode;
  cropArea?: AnnouncementMediaArea;
  maskDataUrl?: string;
};
