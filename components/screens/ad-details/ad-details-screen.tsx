"use client";

import { useAdDetails } from "./use-ad-details";
import { PremiumHeroSection } from "./premium-hero-section";
import { StandardHeroSection } from "./standard-hero-section";
import { PhotoGallerySection } from "./photo-gallery-section";
import { AboutSection } from "./about-section";
import { SchedulingSimulator } from "./scheduling-simulator";
import { SpecialtiesSection } from "./specialties-section";
import { ReviewsSection } from "./reviews-section";
import { SidebarCta } from "./sidebar-cta";
import { PhotoLightbox } from "./photo-lightbox";
import { MobileContactFab } from "./mobile-contact-fab";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskWarningModal } from "@/components/ui/risk-warning-modal";

interface AdDetailsScreenProps {
  slug: string;
}

export function AdDetailsScreen({ slug }: AdDetailsScreenProps) {
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
    isPremium,
  } = useAdDetails(slug);

  if (!ad) {
    return (
      <AppShell>
        <EmptyState title="Perfil nao encontrado" description="Esse anuncio pode ter sido removido ou alterado." />
      </AppShell>
    );
  }

  return (
    <AppShell location={`${ad.city}, ${ad.state}`}>
      <div className="mx-auto max-w-6xl space-y-7 pb-24 md:pb-12 xl:max-w-7xl">
        {isPremium ? <PremiumHeroSection ad={ad} /> : <StandardHeroSection ad={ad} />}

        <PhotoGallerySection
          ad={ad}
          galleryMode={galleryMode}
          setGalleryMode={setGalleryMode}
          bentoItems={bentoItems}
          isPremium={isPremium}
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
        onClose={() => setRiskTarget(null)}
        targetLabel={riskTarget ?? "canal externo"}
        onConfirm={() => {
          setRiskTarget(null);
          if (typeof window !== "undefined") {
            window.open(riskTarget === "WhatsApp" ? "https://web.whatsapp.com" : "https://telegram.org", "_blank", "noopener,noreferrer");
          }
        }}
      />
    </AppShell>
  );
}
