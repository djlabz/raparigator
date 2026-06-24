"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoLightboxProps {
  images: string[];
  selectedIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (index: number) => void;
}

export function PhotoLightbox({ images, selectedIndex, onClose, onNext, onPrev, onSelect }: PhotoLightboxProps) {
  if (selectedIndex === null) return null;

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-zinc-950/98 p-4 backdrop-blur-md animate-fade-in">
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

      <div className="relative w-full h-[65vh] max-w-4xl select-none animate-scale-up mb-12 mt-[-40px]">
        <Image
          src={images[selectedIndex]}
          alt={`Foto de detalhe ${selectedIndex + 1}`}
          fill
          className="rounded-xl object-contain drop-shadow-[0_8px_30px_rgb(0,0,0,0.8)]"
          sizes="(max-width: 768px) 100vw, 1024px"
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

      {/* Counter indicator placed above thumbnails */}
      <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 rounded-full border border-white/5 bg-black/60 px-3.5 py-1.5 font-mono text-xs font-semibold text-zinc-300 backdrop-blur-xs">
        {selectedIndex + 1} de {images.length}
      </div>

      {/* Thumbnails strip at the bottom */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center w-full px-4">
        <div className="flex gap-3 overflow-x-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-full items-center justify-start sm:justify-center">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(idx);
              }}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl transition-all duration-300",
                selectedIndex === idx 
                  ? "ring-2 ring-wine-500 scale-105 opacity-100 shadow-[0_0_15px_rgba(150,0,30,0.5)]" 
                  : "opacity-40 hover:opacity-100 ring-1 ring-white/20"
              )}
            >
              <Image 
                src={img} 
                alt={`Miniatura ${idx + 1}`} 
                fill 
                className="object-cover" 
                sizes="64px" 
                referrerPolicy="no-referrer" 
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
