"use client";

import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

interface AuthHeroMobileProps {
  images: Array<{ src: string; heroPosition: string }>;
  activeIndex?: number;
  eyebrow: string;
  sizes?: string;
  unoptimized?: boolean;
}

export function AuthHeroMobile({
  images,
  activeIndex = 0,
  eyebrow,
  sizes = "50vw",
  unoptimized = false,
}: AuthHeroMobileProps) {
  return (
    <div className="relative -mx-4 h-50 shrink-0 overflow-hidden bg-zinc-950 sm:-mx-6 md:hidden">
      <div className="absolute inset-y-0 right-0 w-1/2 [mask-image:linear-gradient(to_right,transparent_0%,black_26%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_26%)]">
        {images.map((image, index) => {
          const isActive = index === activeIndex % images.length;

          return (
            <Image
              key={image.src}
              src={image.src}
              alt=""
              fill
              priority={index === 0}
              quality={90}
              unoptimized={unoptimized}
              sizes={sizes}
              style={{ objectPosition: image.heroPosition }}
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-zinc-50 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-14 text-white sm:px-6">
        <div className="flex items-center gap-2">
          <BackButton />
          <Link href="/" className="font-display text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
            Sigillus
          </Link>
        </div>
        <div className="max-w-40">
          <div className="h-px w-10 bg-wine-400/70" />
          <p className="mt-2.5 text-[10px] font-black uppercase leading-relaxed tracking-[0.25em] text-white/65">
            {eyebrow}
          </p>
        </div>
      </div>
    </div>
  );
}
