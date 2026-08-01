"use client";

import { useState } from "react";
import { useAdDetails } from "./use-ad-details";
import { PremiumHeroSection } from "./premium-hero-section";
import { PhotoGallerySection } from "./photo-gallery-section";
import { AboutSection } from "./about-section";
import { SchedulingSimulator } from "./scheduling-simulator";
import { SpecialtiesSection } from "./specialties-section";
import { ReviewsSection } from "./reviews-section";
import { SidebarCta } from "./sidebar-cta";
import { PhotoLightbox } from "./photo-lightbox";
import { MobileContactFab } from "./mobile-contact-fab";
import { AppShell } from "@/components/layout/app-shell";
import {
  FEED_CARDS_COLUMN_OFFSET_CLASS,
  FEED_CONTENT_GRID_CLASS,
  FEED_SIDE_COLUMN_CLASS,
} from "@/components/screens/feed-screen/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskWarningModal } from "@/components/ui/risk-warning-modal";
import { cn } from "@/lib/utils";

interface PremiumAdDetailsScreenProps {
  slug: string;
}

export function PremiumAdDetailsScreen({ slug }: PremiumAdDetailsScreenProps) {
  const {
    ad,
    adReviews,
    role,
    riskTarget,
    setRiskTarget,
    selectedPhotoIndex,
    setSelectedPhotoIndex,
    galleryMode,
    setGalleryMode,
    selectedDuration,
    setSelectedDuration,
    selectedExtras,
    toggleExtra,
    bentoItems,
    basePrice,
    calculatedExtrasCost,
    totalCalculatedValue,
    nextPhoto,
    prevPhoto,
  } = useAdDetails(slug);

  const [externalTargetUrl, setExternalTargetUrl] = useState<string | null>(null);

  if (!ad) {
    return (
      <AppShell>
        <EmptyState
          title="Esse encanto não está mais aqui"
          description="O perfil pode ter saído do ar ou mudado de endereço. Volta e escolhe outro que te faça piscadinha."
        />
      </AppShell>
    );
  }

  return (
    <AppShell location={`${ad.city}, ${ad.state}`}>
      <div className={FEED_CONTENT_GRID_CLASS}>
        <div className={cn("hidden lg:block", FEED_SIDE_COLUMN_CLASS)} aria-hidden />
        <div
          data-ad-content-column
          className={cn("min-w-0 space-y-7 pb-24 md:pb-12", FEED_CARDS_COLUMN_OFFSET_CLASS)}
        >
          <PremiumHeroSection 
            ad={ad} 
            onExternalLink={(target, url) => {
              setRiskTarget(target);
              setExternalTargetUrl(url);
            }} 
          />

          <PhotoGallerySection
            ad={ad}
            galleryMode={galleryMode}
            setGalleryMode={setGalleryMode}
            bentoItems={bentoItems}
            isPremium={true}
            setSelectedPhotoIndex={setSelectedPhotoIndex}
          />

          <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <AboutSection ad={ad} />
              <SchedulingSimulator
                ad={ad}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                selectedExtras={selectedExtras}
                toggleExtra={toggleExtra}
                basePrice={basePrice}
                calculatedExtrasCost={calculatedExtrasCost}
                totalCalculatedValue={totalCalculatedValue}
                role={role}
                setRiskTarget={setRiskTarget}
              />
              <SpecialtiesSection ad={ad} />
              <ReviewsSection ad={ad} reviews={adReviews} />
            </div>
            <aside className="flex flex-col gap-4">
              <SidebarCta role={role} setRiskTarget={setRiskTarget} />
            </aside>
          </section>
        </div>
      </div>

      <PhotoLightbox
        images={ad.images}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(null)}
        onNext={nextPhoto}
        onPrev={prevPhoto}
        onSelect={setSelectedPhotoIndex}
      />

      <MobileContactFab ad={ad} setRiskTarget={setRiskTarget} />

      <RiskWarningModal
        open={Boolean(riskTarget)}
        onClose={() => {
          setRiskTarget(null);
          setExternalTargetUrl(null);
        }}
        targetLabel={riskTarget ?? "canal externo"}
        onConfirm={() => {
          setRiskTarget(null);
          if (typeof window !== "undefined" && externalTargetUrl) {
            window.open(externalTargetUrl, "_blank", "noopener,noreferrer");
          } else if (typeof window !== "undefined") {
             // Fallback para clicks do simulador
             window.open(riskTarget === "WhatsApp" ? "https://wa.me/" : "https://t.me/", "_blank", "noopener,noreferrer");
          }
          setExternalTargetUrl(null);
        }}
      />
    </AppShell>
  );
}
