"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { categories, cities, states } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { PopularLinksSection } from "./popular-links-section";

export function OnboardingScreen() {
  const [showLocationToast, setShowLocationToast] = useState(false);

  return (
    <div className="relative w-full overflow-x-hidden bg-white">

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[600px] w-full flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/mulher_1.png"
            alt="Sigillus Premium Background"
            fill
            className="object-cover object-[center_top_-150px]"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/60"></div>
        </div>

        {/* TopNavBar */}
        <header className="relative z-20 w-full max-w-[1536px] mx-auto flex justify-between items-center px-6 md:px-12 py-6">
          <div className="text-2xl font-black tracking-tighter text-white">Sigillus</div>
          {/* Menu de navegação removido */}
          <div className="flex items-center gap-6">
            {/* Botões traduzidos */}
            <button className="text-sm font-bold text-white hover:opacity-80 transition-opacity">Entrar</button>
            <button className="bg-white text-[#800020] px-8 py-2.5 rounded-full text-sm font-extrabold tracking-tight hover:bg-gray-100 active:scale-95 transition-all">
              Cadastrar
            </button>
          </div>
        </header>

        {/* Conteúdo Principal do Hero */}
        <div className="relative z-10 max-w-[1536px] mx-auto px-6 md:px-12 w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 py-6">

          {/* Texto (Esquerda) */}
          <div className="flex-1 text-white max-w-xl xl:max-w-2xl">
            {/* Tag de "Plataforma Verificada" removida */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight mb-6 drop-shadow-md">
              Sigillus: conexões com discrição, segurança e experiência premium.
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium leading-relaxed max-w-lg xl:max-w-xl">
              Escolha sua região e categoria para acessar anúncios verificados com navegação simples e suporte da plataforma.
            </p>
          </div>

          {/* Card de Formulário (Direita) */}
          <div className="w-full max-w-[440px] lg:ml-auto">
            <Card className="p-8 md:p-10 shadow-2xl rounded-2xl bg-white space-y-6">
              <h2 className="text-2xl font-extrabold text-zinc-900 mb-2 tracking-tight">Comece sua experiência</h2>

              <div className="space-y-4">
                <Select id="state" label="Estado" options={states.map((value) => ({ value, label: value }))} defaultValue="SP" />
                <Select id="city" label="Cidade" options={cities.map((value) => ({ value, label: value }))} defaultValue="São Paulo" />
                <Select id="category" label="Categoria" options={categories.map((value) => ({ value, label: value }))} defaultValue="Feminino" />
              </div>

              <div className="pt-2">
                <button
                  className="flex items-center gap-2 text-[#800020] font-bold text-sm hover:underline group"
                  onClick={() => {
                    setShowLocationToast(true);
                    setTimeout(() => setShowLocationToast(false), 3000);
                  }}
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Usar minha localização atual
                </button>
              </div>

              <Link href="/feed" className="block pt-2">
                <Button fullWidth size="lg" className="bg-[#800020] hover:bg-[#600018] text-white py-6 text-base rounded-lg shadow-lg">
                  Entrar no feed
                </Button>
              </Link>

              {showLocationToast && <Toast title="Localização atual aplicada" message="São Paulo, SP foi definida automaticamente." type="success" />}
            </Card>
          </div>
        </div>
      </section>

      {/* Seção Inferior */}
      <div className="bg-white relative z-20">
        <div className="max-w-[1536px] mx-auto px-6 md:px-12 py-16">
          <PopularLinksSection />
        </div>
      </div>

    </div>
  );
}
