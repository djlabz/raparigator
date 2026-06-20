"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoLightboxProps {
  images: string[];
  selectedIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function PhotoLightbox({ images, selectedIndex, onClose, onNext, onPrev }: PhotoLightboxProps) {
  if (selectedIndex === null) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-zinc-950/98 p-4 backdrop-blur-md animate-fade-in">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-10000 cursor-pointer rounded-full border border-white/5 bg-black/40 p-2.5 text-white transition-colors hover:bg-black/70 backdrop-blur-xs"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPrev();
        }}
        className="absolute top-1/2 left-3 z-10000 -translate-y-1/2 cursor-pointer rounded-full border border-white/5 bg-black/40 p-3 text-white transition-colors hover:bg-black/70 backdrop-blur-xs"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="relative aspect-3/4 max-h-[82vh] max-w-full select-none animate-scale-up sm:max-w-2xl">
        <Image
          src={images[selectedIndex]}
          alt={`Foto de detalhe ${selectedIndex + 1}`}
          fill
          className="rounded-xl object-contain drop-shadow-[0_8px_30px_rgb(0,0,0,0.8)]"
          sizes="(max-width: 768px) 100vw, 768px"
          referrerPolicy="no-referrer"
        />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNext();
        }}
        className="absolute top-1/2 right-3 z-10000 -translate-y-1/2 cursor-pointer rounded-full border border-white/5 bg-black/40 p-3 text-white transition-colors hover:bg-black/70 backdrop-blur-xs"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/5 bg-black/60 px-3.5 py-1.5 font-mono text-xs font-semibold text-zinc-300 backdrop-blur-xs">
        {selectedIndex + 1} de {images.length}
      </div>
    </div>
  );
}
