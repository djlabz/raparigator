"use client"; // Importante para gerenciar estado no cliente

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Função auxiliar para aplicar a máscara de CPF (Formata: 000.000.000-00)
// E remove qualquer caractere que não seja número (Previne: letras, símbolos)
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não for número (Fulfillment Requirement)
    .replace(/(\d{3})(\d)/, "$1.$2") // Coloca o primeiro ponto
    .replace(/(\d{3})(\d)/, "$1.$2") // Coloca o segundo ponto
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2") // Coloca o hífen
    .replace(/(-\d{2})\d+?$/, "$1"); // Impede mais de 11 dígitos total (14 com a máscara)
};

export function ClientSignupScreen() {
  const [cpfValue, setCpfValue] = useState("");

  const handleCpfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const masked = maskCPF(rawValue);

    // Só atualiza o estado se a máscara não estourar o limite de 14 caracteres (000.000.000-00)
    // Isso previne que o usuário cole um CPF com caracteres extras.
    if (masked.length <= 14) {
      setCpfValue(masked);
    }
  };

  return (
    <AuthShell
      title="Crie sua conta Sigillus"
      description="Contrate serviços com total rastreabilidade e suporte da nossa plataforma."
    >
      <form className="space-y-4 mt-6">
        <Input
          id="cpf"
          label="Seu CPF"
          placeholder="000.000.000-00"
          value={cpfValue} // Vincula o valor ao estado gerenciado
          onChange={handleCpfChange} // Aplica a lógica de máscara no change
          className="bg-zinc-50 focus:bg-white transition-colors"
          maxLength={14} // Segurança extra no HTML
        />

        <Input
          id="full-name"
          label="Nome completo civil"
          placeholder="Como consta no seu documento"
          className="bg-zinc-50 focus:bg-white transition-colors"
        />

        <Input
          id="email"
          label="E-mail principal"
          type="email"
          placeholder="voce@email.com"
          className="bg-zinc-50 focus:bg-white transition-colors"
        />

        <Input
          id="password"
          label="Crie sua senha"
          type="password"
          placeholder="Mínimo 8 caracteres"
          className="bg-zinc-50 focus:bg-white transition-colors"
        />

        <Button fullWidth className="mt-4 bg-wine-700 hover:bg-wine-800 text-white shadow-md shadow-wine-700/20 py-6 text-base">
          Validar e Criar Conta
        </Button>
      </form>

      {/* Rodapé redesenhado para modernidade e UX */}
      <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col gap-3 text-center text-sm text-zinc-600">
        <p>
          Já possui cadastro?{' '}
          <Link href="/auth/login" className="font-bold text-wine-700 hover:underline">
            Acesse sua conta
          </Link>
        </p>
        <p className="text-xs text-zinc-500 pt-2 border-t border-dashed border-zinc-200">
          Você é profissional e quer se cadastrar?{' '}
          <Link href="/auth/cadastro/profissional" className="font-semibold text-zinc-900 hover:underline">
            Anuncie seu perfil aqui
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
