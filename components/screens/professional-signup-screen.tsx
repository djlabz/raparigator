import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ProfessionalSignupScreen() {
  const iconClassName = "h-4 w-4";

  return (
    <div className="min-h-screen bg-zinc-50 md:grid md:grid-cols-2 md:items-start">
      <section className="relative hidden h-screen overflow-hidden bg-black md:sticky md:top-0 md:block">
        <Image
          src="/modelo_criar_conta_profissional.png"
          alt="Modelo para criacao de conta profissional"
          fill
          priority
          className="object-contain object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-linear-to-br from-black/55 via-black/25 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-10 pb-14 text-white lg:px-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Cadastro profissional</p>
          <h2 className="mt-4 max-w-lg font-display text-5xl leading-[0.95] text-white lg:text-6xl">Elegancia refinada no gerenciamento.</h2>
          <div className="mt-7 h-px w-24 bg-white/45" />
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
            Entre para um grupo seleto de profissionais. Nossa plataforma combina discricao, seguranca e controle premium da sua presenca.
          </p>
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
            <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Criar conta profissional</h1>
            <p className="text-sm text-zinc-600">Passo 1 de 3: Informacoes basicas</p>
          </header>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-300/40 md:p-6">
            <form className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Passo 1: Informacoes basicas</p>
                  <p className="text-xs text-zinc-500">Seu perfil inicia com os dados essenciais de validacao civil.</p>
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

              <div className="border-t border-zinc-200 pt-6">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Passo 2: Dados complementares</p>
                  <p className="text-xs text-zinc-500">Complete os detalhes para liberar verificacao de perfil e atendimento.</p>
                </div>

                <div className="mt-3 space-y-3">
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
                </div>
              </div>

              <div className="pt-2">
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
                <div className="mt-2 flex gap-2 pl-11 text-[10px] font-semibold uppercase tracking-[0.12em] text-wine-700">
                  <span className="rounded-full border border-wine-200 bg-wine-50 px-2 py-1">Biometria</span>
                  <span className="rounded-full border border-wine-200 bg-wine-50 px-2 py-1">Documento</span>
                  <span className="rounded-full border border-wine-200 bg-wine-50 px-2 py-1">Blindagem</span>
                </div>
              </div>

              <div className="pt-2">
                <Button fullWidth>Continuar para verificacao</Button>
              </div>
            </form>

            <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.17em] text-zinc-500">
              Seguro. Criptografado. Exclusivo.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
