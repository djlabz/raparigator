import { planMediaUndo, translateAreaToSource } from "@sigillus/domain";
import { getCroppedImg } from "@/lib/cropImage";
import type {
  AnnouncementMediaHistoryEntry,
  AnnouncementMediaHistoryItem,
  AnnouncementMediaHistoryMap,
  AnnouncementMediaOperationKind,
  AnnouncementMediaRebuildResult,
  AnnouncementMediaSourceOffset,
} from "@/lib/announcement-media-types";

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToObjectUrl(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao gerar imagem editada"));
          return;
        }

        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.95,
    );
  });
}

async function applyBlurEntry(
  sourceSrc: string,
  entry: AnnouncementMediaHistoryEntry,
  sourceOffset: AnnouncementMediaSourceOffset,
) {
  const image = await loadImageElement(sourceSrc);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return sourceSrc;
  }

  ctx.drawImage(image, 0, 0);

  if (entry.blurMode === "brush") {
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = image.naturalWidth;
    blurCanvas.height = image.naturalHeight;

    const blurCtx = blurCanvas.getContext("2d");
    if (!blurCtx) {
      return sourceSrc;
    }

    blurCtx.filter = "blur(25px)";
    blurCtx.drawImage(image, 0, 0);

    blurCtx.globalCompositeOperation = "destination-in";
    if (entry.blurMaskDataUrl) {
      const maskImage = await loadImageElement(entry.blurMaskDataUrl);
      blurCtx.drawImage(
        maskImage,
        -sourceOffset.x,
        -sourceOffset.y,
        image.naturalWidth,
        image.naturalHeight,
      );
    }

    ctx.drawImage(blurCanvas, 0, 0);
    return canvasToObjectUrl(canvas);
  }

  if (!entry.cropArea) {
    return sourceSrc;
  }

  const localArea = translateAreaToSource(entry.cropArea, sourceOffset);
  const safeX = Math.max(0, Math.floor(localArea.x));
  const safeY = Math.max(0, Math.floor(localArea.y));
  const safeWidth = Math.min(
    Math.max(1, Math.floor(localArea.width)),
    Math.max(1, image.naturalWidth - safeX),
  );
  const safeHeight = Math.min(
    Math.max(1, Math.floor(localArea.height)),
    Math.max(1, image.naturalHeight - safeY),
  );

  ctx.save();
  ctx.beginPath();
  ctx.rect(safeX, safeY, safeWidth, safeHeight);
  ctx.clip();
  const blurAmount = Math.max(25, (image.naturalWidth / 1000) * 25);
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(image, 0, 0);
  ctx.restore();

  return canvasToObjectUrl(canvas);
}

export async function rebuildMediaChainAfterUndo(
  currentSrc: string,
  historyMap: AnnouncementMediaHistoryMap,
  operation: AnnouncementMediaOperationKind,
): Promise<AnnouncementMediaRebuildResult | null> {
  const plan = planMediaUndo(currentSrc, historyMap, operation);

  if (!plan) {
    return null;
  }

  const rebuiltEntries: AnnouncementMediaHistoryItem[] = [];
  let sourceSrc = plan.baseSrc;
  let sourceOffset: AnnouncementMediaSourceOffset = { x: 0, y: 0 };

  for (const item of plan.remaining) {
    let nextSrc: string;

    if (item.entry.operation === "edit") {
      if (!item.entry.cropArea) {
        return null;
      }

      const localArea = translateAreaToSource(item.entry.cropArea, sourceOffset);
      nextSrc = await getCroppedImg(sourceSrc, localArea);
      sourceOffset = {
        x: item.entry.cropArea.x,
        y: item.entry.cropArea.y,
      };
    } else {
      nextSrc = await applyBlurEntry(sourceSrc, item.entry, sourceOffset);
    }

    rebuiltEntries.push({
      src: nextSrc,
      entry: {
        ...item.entry,
        parent: sourceSrc,
      },
    });

    sourceSrc = nextSrc;
  }

  return {
    src: sourceSrc,
    entries: rebuiltEntries,
  };
}
