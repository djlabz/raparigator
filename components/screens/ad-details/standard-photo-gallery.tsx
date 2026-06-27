"use client";

import Image from "next/image";
import type { ProfessionalAd } from "@/lib/types";

interface StandardPhotoGalleryProps {
  ad: ProfessionalAd;
  setSelectedPhotoIndex: (index: number) => void;
}

export function StandardPhotoGallery({ ad, setSelectedPhotoIndex }: StandardPhotoGalleryProps) {
  const images = ad.images;
  if (!images || images.length === 0) return null;

  return (
    <section className="w-full">
      <div className="grid h-[300px] grid-cols-1 gap-4 sm:h-[400px] md:h-[450px] md:grid-cols-3">
        {/* Foto principal - Ocupa 2 colunas no desktop */}
        <div
          className="group relative col-span-1 h-full w-full cursor-pointer overflow-hidden rounded-2xl bg-zinc-100 shadow-sm transition-shadow hover:shadow-md md:col-span-2"
          onClick={() => setSelectedPhotoIndex(0)}
        >
          <Image
            src={images[0]}
            alt={`${ad.artisticName} ensaio 1`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 66vw"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Fotos menores na lateral direita - Escondidas no mobile, mostradas no desktop */}
        <div className="hidden h-full flex-col gap-4 md:flex">
          {images[1] && (
            <div
              className="group relative h-1/2 w-full cursor-pointer overflow-hidden rounded-2xl bg-zinc-100 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => setSelectedPhotoIndex(1)}
            >
              <Image
                src={images[1]}
                alt={`${ad.artisticName} ensaio 2`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="33vw"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          )}

          {images[2] && (
            <div
              className="group relative h-1/2 w-full cursor-pointer overflow-hidden rounded-2xl bg-zinc-100 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => setSelectedPhotoIndex(2)}
            >
              <Image
                src={images[2]}
                alt={`${ad.artisticName} ensaio 3`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="33vw"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
              
              {/* Overlay para mais fotos */}
              {images.length > 3 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-colors duration-300 group-hover:bg-black/50">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-sm backdrop-blur-md">
                    <span className="mb-0.5 text-2xl font-light leading-none text-white">+</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/90 drop-shadow-sm">Ver todas {images.length} fotos</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
