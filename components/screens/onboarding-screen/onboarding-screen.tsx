"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
// Importamos o novo locationsData em vez de cities e states separados
import { categories, locationsData } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { PopularLinksSection } from "../popular-links-section";
import styles from "./onboarding-screen.module.css";

export function OnboardingScreen() {
  const [showLocationToast, setShowLocationToast] = useState(false);

  // Estados para controlar o novo campo de busca de localização
  const [locationQuery, setLocationQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fecha o menu de sugestões ao clicar fora do componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Função auxiliar para remover acentos
  const removeAccents = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Filtra as localidades ignorando maiúsculas/minúsculas e acentos
  const filteredLocations = locationsData.filter((loc) => {
    const searchStr = removeAccents(`${loc.city}, ${loc.state}`.toLowerCase());
    const queryStr = removeAccents(locationQuery.toLowerCase());
    return searchStr.includes(queryStr);
  });

  return (
    <div className="relative w-full overflow-x-hidden bg-white">
      {/* Hero Section */}
      <section className={`relative w-full flex flex-col ${styles.hero}`}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/mulher_1_1.png"
            alt="Sigillus Premium Background"
            fill
            className={`object-cover ${styles.heroImage}`}
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-black/60"></div>
        </div>

        {/* TopNavBar */}
        <header className="relative z-20 w-full max-w-384 mx-auto flex justify-between items-center px-6 md:px-12 py-6">
          <div className="text-2xl font-black tracking-tighter text-white">Sigillus</div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-bold text-white hover:opacity-80 transition-opacity">Entrar</button>
            <button className="bg-white text-[#800020] px-8 py-2.5 rounded-full text-sm font-extrabold tracking-tight hover:bg-gray-100 active:scale-95 transition-all">
              Cadastrar
            </button>
          </div>
        </header>

        {/* Conteúdo Principal do Hero */}
        <div className={`relative z-10 max-w-384 mx-auto px-6 md:px-12 w-full flex-1 flex flex-col lg:flex-row lg:items-end lg:justify-between ${styles.heroContent}`}>
          {/* Texto (Esquerda) */}
          <div className="w-full lg:flex-1 text-white max-w-xl xl:max-w-2xl">
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight mb-6 drop-shadow-md">
              Sigillus: conexões com discrição, segurança e experiência premium.
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium leading-relaxed max-w-lg xl:max-w-xl">
              Escolha sua região e a categoria para acessar anúncios de acompanhantes verificados com suporte da plataforma.
            </p>
          </div>

          {/* Card de Formulário (Direita) */}
          <div className={`w-full lg:ml-auto lg:shrink-0 ${styles.cardWrapper}`}>
            <Card className="p-8 md:p-10 shadow-2xl rounded-2xl bg-white space-y-6">
              <h2 className="text-2xl font-extrabold text-zinc-900 mb-2 tracking-tight">Comece sua experiência:</h2>

              <div className="space-y-4">
                {/* Novo Campo de Localização Unificado */}
                <div className="relative space-y-1.5" ref={wrapperRef}>
                  <label htmlFor="location" className="text-sm font-semibold text-zinc-900">
                    Localização
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 pointer-events-none">
                      📍
                    </span>
                    <input
                      id="location"
                      type="text"
                      placeholder="Digite sua cidade..."
                      value={locationQuery}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 pl-9 py-2 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                      autoComplete="off"
                    />
                  </div>

                  {/* Dropdown de Sugestões */}
                  {showSuggestions && locationQuery.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-auto py-1 text-sm">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((loc, idx) => (
                          <li
                            key={idx}
                            className="px-3 py-2 hover:bg-zinc-100 cursor-pointer text-zinc-700 flex items-center gap-2"
                            onClick={() => {
                              setLocationQuery(`${loc.city}, ${loc.state}`);
                              setShowSuggestions(false);
                            }}
                          >
                            <span>📍</span> {loc.city}, {loc.state}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-zinc-500">Nenhuma cidade encontrada</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Categoria com defaultValue corrigido para "Feminina" */}
                <Select
                  id="category"
                  label="Categoria"
                  options={categories.map((value) => ({ value, label: value }))}
                  defaultValue="Feminina"
                />
              </div>

              <div className="pt-2">
                <button
                  className="flex items-center gap-2 text-[#800020] font-bold text-sm hover:underline group"
                  onClick={() => {
                    setShowLocationToast(true);
                    // Atualiza o input visualmente caso use a localização atual
                    setLocationQuery("São Paulo, SP");
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
        <div className="max-w-384 mx-auto px-6 md:px-12 py-16">
          <PopularLinksSection />
        </div>
      </div>
    </div>
  );
}
