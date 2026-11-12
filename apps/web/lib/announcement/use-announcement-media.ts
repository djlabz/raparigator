"use client";

import { useState } from "react";
import {
  getCurrentMediaOffset,
  hasOperationInHistory,
  translateAreaFromSource,
} from "@sigillus/domain";
import { getCroppedImg } from "@/lib/cropImage";
import { rebuildMediaChainAfterUndo } from "@/lib/announcement/media-canvas";
import type {
  AnnouncementMediaArea,
  AnnouncementMediaBlurInput,
  AnnouncementMediaHistoryMap,
  AnnouncementMediaOperationKind,
} from "@/lib/announcement-media-types";

export function useAnnouncementMedia() {
  const [historyMap, setHistoryMap] = useState<AnnouncementMediaHistoryMap>({});

  return {
    historyMap,
    hasOperation: (src: string, operation: AnnouncementMediaOperationKind) =>
      hasOperationInHistory(src, historyMap, operation),
    applyEdit: async (
      currentSrc: string,
      croppedAreaPixels: AnnouncementMediaArea,
    ): Promise<string | null> => {
      try {
        const sourceOffset = getCurrentMediaOffset(currentSrc, historyMap);
        const croppedUrl = await getCroppedImg(currentSrc, croppedAreaPixels);

        if (!croppedUrl) {
          return null;
        }

        if (historyMap[currentSrc] && currentSrc.startsWith("blob:")) {
          URL.revokeObjectURL(currentSrc);
        }

        setHistoryMap((prev) => {
          const next = { ...prev };
          next[croppedUrl] = {
            parent: currentSrc,
            operation: "edit",
            cropArea: translateAreaFromSource(croppedAreaPixels, sourceOffset),
          };
          return next;
        });

        return croppedUrl;
      } catch {
        return null;
      }
    },
    applyBlur: (currentSrc: string, blurred: AnnouncementMediaBlurInput): string => {
      const sourceOffset = getCurrentMediaOffset(currentSrc, historyMap);

      if (historyMap[currentSrc] && currentSrc.startsWith("blob:")) {
        URL.revokeObjectURL(currentSrc);
      }

      setHistoryMap((prev) => {
        const next = { ...prev };
        next[blurred.src] = {
          parent: currentSrc,
          operation: "blur",
          blurMode: blurred.mode,
          cropArea: blurred.cropArea
            ? translateAreaFromSource(blurred.cropArea, sourceOffset)
            : undefined,
          blurMaskDataUrl: blurred.maskDataUrl,
        };
        return next;
      });

      return blurred.src;
    },
    revertOperation: async (
      currentSrc: string,
      operation: AnnouncementMediaOperationKind,
    ): Promise<string | null> => {
      const rebuilt = await rebuildMediaChainAfterUndo(currentSrc, historyMap, operation);

      if (!rebuilt) {
        return null;
      }

      if (currentSrc.startsWith("blob:")) {
        URL.revokeObjectURL(currentSrc);
      }

      setHistoryMap((prev) => {
        const next = { ...prev };
        rebuilt.entries.forEach((item) => {
          next[item.src] = item.entry;
        });
        return next;
      });

      return rebuilt.src;
    },
  };
}
