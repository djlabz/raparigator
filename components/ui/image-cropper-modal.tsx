import React, { useState, useCallback, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { resolveMinSelectionSize } from "@/components/ui/image-selection-utils";

export interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: Area) => void;
  onClose: () => void;
  aspect?: number;
  canRevert?: boolean;
  onRevert?: () => void;
}

const MIN_SELECTION_PX = 120;

function buildCenteredSelection(mediaWidth: number, mediaHeight: number, aspect?: number): Crop {
  if (aspect) {
    const preferredWidth = mediaWidth >= mediaHeight ? 78 : 88;
    const aspectCrop = makeAspectCrop(
      {
        unit: "%",
        width: preferredWidth,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    );

    return centerCrop(aspectCrop, mediaWidth, mediaHeight);
  }

  // In free edit mode, start with the whole image selected (gallery-like behavior).
  return {
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  };
}

export function ImageCropperModal({ imageSrc, onCropComplete, onClose, aspect, canRevert = false, onRevert }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [initialCrop, setInitialCrop] = useState<Crop>();
  const [minSelection, setMinSelection] = useState({ width: MIN_SELECTION_PX, height: MIN_SELECTION_PX });
  const imageRef = useRef<HTMLImageElement | null>(null);

  const onCropCompleteCallback = useCallback((pixelCrop: PixelCrop) => {
    if (!imageRef.current) {
      setCroppedAreaPixels(pixelCrop);
      return;
    }

    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    setCroppedAreaPixels({
      x: Math.round(pixelCrop.x * scaleX),
      y: Math.round(pixelCrop.y * scaleY),
      width: Math.round(pixelCrop.width * scaleX),
      height: Math.round(pixelCrop.height * scaleY),
      unit: "px",
    });
  }, []);

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const mediaWidth = event.currentTarget.width;
    const mediaHeight = event.currentTarget.height;

    if (!mediaWidth || !mediaHeight) {
      return;
    }

    imageRef.current = event.currentTarget;
    setMinSelection(resolveMinSelectionSize({ width: mediaWidth, height: mediaHeight }));
    const nextCrop = buildCenteredSelection(mediaWidth, mediaHeight, aspect);
    setCrop(nextCrop);
    setInitialCrop(nextCrop);
  }, [aspect]);

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels);
    }
  };

  const handleRevert = () => {
    if (canRevert && onRevert) {
      onRevert();
      return;
    }

    if (initialCrop) {
      setCrop(initialCrop);
    }
  };

  return (
    <div className="fixed inset-0 z-200 bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl flex items-center justify-between px-2 sm:px-4 mb-5 relative z-10">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold tracking-wide transition-colors border border-white/20"
        >
          Cancelar
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRevert}
            className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold tracking-wide transition-colors border border-white/20"
            title={canRevert ? "Reverter recorte/enquadramento aplicado" : "Restaurar seleção inicial do recorte"}
          >
            {canRevert ? "Reverter Enquadramento" : "Reverter Seleção"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels}
            className="h-10 px-5 rounded-full bg-wine-700 hover:bg-wine-600 disabled:opacity-50 text-white text-sm font-black tracking-wide transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-5xl flex-1 bg-black/50 rounded-lg overflow-hidden border border-white/10 min-h-0 select-none flex items-center justify-center p-4">
        <ReactCrop
          crop={crop}
          onChange={(nextCrop) => setCrop(nextCrop)}
          onComplete={onCropCompleteCallback}
          aspect={aspect}
          minWidth={Math.max(MIN_SELECTION_PX, minSelection.width)}
          minHeight={Math.max(80, Math.floor((aspect ? MIN_SELECTION_PX / aspect : minSelection.height)))}
          className="max-w-full max-h-full inline-block"
          keepSelection
          ruleOfThirds
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Editar enquadramento"
            className="block pointer-events-none select-none"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            style={{ maxWidth: "100%", maxHeight: "calc(100dvh - 220px)", width: "auto", height: "auto" }}
          />
        </ReactCrop>
      </div>

      <div className="mt-4 text-center text-xs text-zinc-400">
        Arraste e redimensione a caixa para definir o novo enquadramento.
      </div>
    </div>
  );
}
