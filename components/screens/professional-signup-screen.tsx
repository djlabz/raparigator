"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import styles from "./professional-signup-screen/professional-signup-screen.module.css";

const stackedCards = [
  {
    src: "/stacked_cards_1.png",
    alt: "Modelo em destaque com fundo escuro e luz suave",
  },
  {
    src: "/stacked_cards_2.png",
    alt: "Modelo em destaque com composição premium e contraste dramático",
  },
  {
    src: "/stacked_cards_3.png",
    alt: "Modelo em destaque com pose elegante e acabamento refinado",
  },
];

const cardPlacements = [
  { x: 0, y: 0, scale: 1, rotate: -1.5, zIndex: 3 },
  { x: 72, y: 28, scale: 0.93, rotate: 8, zIndex: 2 },
  { x: -64, y: 46, scale: 0.86, rotate: -11, zIndex: 1 },
];

export function ProfessionalSignupScreen() {
  // Controle de estado para os passos do formulário
  const [step, setStep] = useState(1);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const iconClassName = "h-4 w-4";

  // Funções de navegação
  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveCardIndex((currentIndex) => (currentIndex + 1) % stackedCards.length);
    }, 4200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-zinc-50 md:grid md:grid-cols-2 md:items-start">
      <section className={`relative hidden h-screen overflow-hidden md:sticky md:top-0 md:block ${styles.heroPane}`}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGrid}>
          <div className={styles.heroStack} aria-label="Mosaico de fotos das modelos">
            <div className={styles.stageFrame}>
              {stackedCards.map((card, index) => {
                const slotIndex = (index - activeCardIndex + stackedCards.length) % stackedCards.length;
                const placement = cardPlacements[slotIndex];

                return (
                  <div
                    key={card.src}
                    className={styles.stackCard}
                    data-layer={slotIndex === 0 ? "front" : slotIndex === 1 ? "middle" : "back"}
                    style={{
                      transform: `translate3d(${placement.x}px, ${placement.y}px, 0) scale(${placement.scale}) rotate(${placement.rotate}deg)`,
                      zIndex: placement.zIndex,
                    }}
                  >
                    <Image
                      src={card.src}
                      alt={card.alt}
                      fill
                      priority={slotIndex === 0}
                      quality={100}
                      className={styles.stackImage}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className={styles.stackOverlay} />
                  </div>
                );
              })}

              <div className={styles.heroCopy}>
                <p className={styles.heroEyebrow}>Executive profile</p>
                <h2 className={styles.heroTitle}>Curadoria de Elite</h2>
                <p className={styles.heroDescription}>
                  Um mosaico de presença premium que destaca cada modelo com profundidade, contraste e troca automática de cartas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 md:flex md:min-h-screen md:items-center md:justify-center md:px-10">
        <div className="mx-auto w-full max-w-md space-y-6">
          <header>
            <div className="flex items-center gap-2">
              <BackButton />
              <Link href="/" className="font-display text-2xl text-wine-800">
                Sigillus
              </Link>
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-zinc-900">Criar conta profissional</h1>
            {/* AUMENTO DA FONTE E ESCURECIMENTO: de text-sm text-zinc-600 para text-base text-zinc-700 */}
            <p className="mt-1 text-base text-zinc-700">
              Passo {step} de 3: {step === 1 ? "Informacoes basicas" : "Dados complementares"}
            </p>

            {/* Barra de Progresso */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                className={`h-full bg-wine-800 transition-all duration-300 ease-in-out ${step === 1 ? 'w-1/3' : 'w-2/3'}`}
              />
            </div>
          </header>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-300/40 md:p-6">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

              {/* PASSO 1 */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1 mb-4">
                    {/* AUMENTO DA FONTE E ESCURECIMENTO: text-[11px] para text-xs, text-zinc-500 para text-zinc-600 */}
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Passo 1: Informacoes basicas</p>
                    {/* AUMENTO DA FONTE E ESCURECIMENTO: text-xs para text-sm, text-zinc-500 para text-zinc-700 */}
                    <p className="text-sm text-zinc-700">Seu perfil inicia com os dados essenciais de validacao civil.</p>
                  </div>

                  <Input
                    id="cpf"
                    label="CPF"
                    placeholder="000.000.000-00"
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M8 8h8" />
                        <path d="M8 12h5" />
                      </svg>
                    }
                  />
                  <Input
                    id="civil-name"
                    label="Nome civil"
                    placeholder="Nome completo conforme documento"
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M5 20a7 7 0 0 1 14 0" />
                      </svg>
                    }
                  />
                  <Input
                    id="artistic-name"
                    label="Nome artistico"
                    placeholder="Como deseja ser vista(o)"
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <path d="m12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5Z" />
                      </svg>
                    }
                  />
                  <Input
                    id="phone"
                    label="Telefone"
                    placeholder="+55 (00) 00000-0000"
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.7 19.7 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.8 2.6a2 2 0 0 1-.4 2.1L8.2 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.8.4 1.7.7 2.6.8A2 2 0 0 1 22 16.9Z" />
                      </svg>
                    }
                  />
                </div>
              )}

              {/* PASSO 2 */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1 mb-4">
                    {/* AUMENTO DA FONTE E ESCURECIMENTO */}
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Passo 2: Dados complementares</p>
                    <p className="text-sm text-zinc-700">Complete os detalhes para liberar verificacao de perfil e atendimento.</p>
                  </div>

                  <Input
                    id="bank"
                    label="Dados bancarios"
                    placeholder="Banco, agencia e conta"
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <path d="M3 10h18" />
                        <path d="M4 6h16v12H4z" />
                        <path d="M7 15h4" />
                      </svg>
                    }
                  />
                  <Select
                    id="identity"
                    label="Reconhecimento facial / identidade"
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <path d="M9 9h.01" />
                        <path d="M15 9h.01" />
                        <path d="M8 15a6 6 0 0 0 8 0" />
                      </svg>
                    }
                    options={[
                      { value: "pending", label: "Enviar selfie + documento" },
                      { value: "started", label: "Verificacao iniciada" },
                    ]}
                  />
                  <Input
                    id="features"
                    label="Caracteristicas do perfil"
                    placeholder="Altura, etnia, cor de cabelo, categoria"
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <path d="M4 20V4" />
                        <path d="M20 20V8" />
                        <path d="M8 20v-8" />
                        <path d="M12 20v-4" />
                        <path d="M16 20v-6" />
                      </svg>
                    }
                  />
                  <Input
                    id="photos"
                    label="Upload de fotos"
                    type="file"
                    multiple
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <circle cx="9" cy="10" r="1" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    }
                  />
                  <Input
                    id="location"
                    label="Localizacao de atendimento"
                    placeholder="Cidade e bairro"
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <path d="M12 22s7-5.7 7-12a7 7 0 1 0-14 0c0 6.3 7 12 7 12Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    }
                  />

                  <div className="pt-4 pb-2">
                    <InfoBanner
                      title="Verificacao de identidade"
                      description="Para manter o padrao de seguranca da plataforma, seu perfil passa por confirmacao multipla de identidade."
                      tone="secure"
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                          <path d="M12 2a10 10 0 0 0-7 3v6c0 6 7 11 7 11s7-5 7-11V5a10 10 0 0 0-7-3Z" />
                          <path d="M8.5 11a3.5 3.5 0 0 1 7 0" />
                          <path d="M9 14h6" />
                        </svg>
                      }
                    />
                    <div className="mt-2 flex gap-2 pl-11 text-[11px] font-semibold uppercase tracking-[0.12em] text-wine-800">
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">Biometria</span>
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">Documento</span>
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">Blindagem</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTROLES DE NAVEGAÇÃO */}
              <div className="pt-2 flex gap-3">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={prevStep}
                    className="flex items-center justify-center w-1/3 border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 h-4 w-4">
                      <path d="m12 19-7-7 7-7" />
                      <path d="M19 12H5" />
                    </svg>
                    Voltar
                  </Button>
                )}

                {step === 1 ? (
                  <Button type="button" fullWidth onClick={nextStep} className="flex items-center justify-center font-medium">
                    Continuar
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 h-4 w-4">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Button>
                ) : (
                  <Button type="button" className="flex items-center justify-center w-2/3 font-medium">
                    Continuar para verificacao
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 h-4 w-4">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Button>
                )}
              </div>
            </form>

            {/* AUMENTO DA FONTE E ESCURECIMENTO */}
            <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.17em] text-zinc-600">
              Seguro. Criptografado. Exclusivo.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
