import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";

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
}

export function ImageCropperModal({ imageSrc, onCropComplete, onClose }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl h-[60vh] bg-black rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteCallback}
          onZoomChange={setZoom}
        />
      </div>
      <div className="mt-8 flex gap-4 w-full max-w-sm">
        <Button variant="secondary" className="w-full text-white border-white/20 hover:bg-white/10" onClick={onClose}>Cancelar</Button>
        <Button className="w-full bg-wine-700 hover:bg-wine-600 text-white" onClick={handleConfirm} disabled={!croppedAreaPixels}>Confirmar Recorte</Button>
      </div>
    </div>
  );
}
