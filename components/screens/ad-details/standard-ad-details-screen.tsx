"use client";

import { useAdDetails } from "./use-ad-details";
import { StandardProfileHeader } from "./standard-profile-header";
import { PhotoGallerySection } from "./photo-gallery-section";
import { StandardCharacteristics } from "./standard-characteristics";
import { StandardAboutSection } from "./standard-about-section";
import { SpecialtiesSection } from "./specialties-section";
import { StandardReviewsSection } from "./standard-reviews-section";
import { StandardSchedulingSimulator } from "./standard-scheduling-simulator";
import { StandardSidebarCta } from "./standard-sidebar-cta";
import { StandardMobileContactFab } from "./standard-mobile-contact-fab";
import { PhotoLightbox } from "./photo-lightbox";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskWarningModal } from "@/components/ui/risk-warning-modal";

interface StandardAdDetailsScreenProps {
  slug: string;
}

export function StandardAdDetailsScreen({ slug }: StandardAdDetailsScreenProps) {
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
    bentoItems,
    selectedDuration,
    setSelectedDuration,
    selectedExtras,
    toggleExtra,
    basePrice,
    calculatedExtrasCost,
    totalCalculatedValue,
    nextPhoto,
    prevPhoto,
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
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 pb-24 md:pb-12">
        <StandardProfileHeader ad={ad} />
        <PhotoGallerySection
          ad={ad}
          galleryMode={galleryMode}
          setGalleryMode={setGalleryMode}
          bentoItems={bentoItems}
          isPremium={false}
          setSelectedPhotoIndex={setSelectedPhotoIndex}
        />
        <StandardCharacteristics ad={ad} />

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <StandardAboutSection ad={ad} />
            <SpecialtiesSection ad={ad} />
            <StandardSchedulingSimulator
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
            <StandardReviewsSection ad={ad} reviews={adReviews} />
          </div>

          <aside className="hidden lg:block">
            <StandardSidebarCta role={role} setRiskTarget={setRiskTarget} />
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

      <StandardMobileContactFab
        ad={ad}
        setRiskTarget={setRiskTarget}
        role={
          role === "cliente"
            ? "client"
            : role === "profissional"
              ? "professional"
              : role
        }
      />

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
