import type { Metadata } from "next";
import Link from "next/link";
import { REPORT_RESPONSE_SLA_HOURS } from "@sigillus/contracts";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { Card } from "@/components/ui/card";
import { ReportForm } from "./report-form";

export const metadata: Metadata = {
  title: "Denunciar anúncio | Sigillus",
  description: "Canal público para pedir a retirada de anúncio ou foto publicada na Sigillus.",
};

export default function DenunciaPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandWordmark tone="wine" />
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:py-12">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-900">
            Denunciar anúncio
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            Use este canal para pedir a retirada de um anúncio ou de uma foto publicada sem
            consentimento, com pessoa menor de idade, sob coação ou com conteúdo ilegal. Não é
            preciso ter conta.
          </p>
        </div>

        <Card className="space-y-2 border-wine-200 bg-wine-50/50 p-5">
          <p className="font-semibold text-wine-900">O que acontece com o pedido</p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-zinc-700">
            <li>
              A equipe de moderação analisa cada denúncia em até {REPORT_RESPONSE_SLA_HOURS} horas.
            </li>
            <li>
              Se o anúncio ou a foto violar as regras da plataforma, o conteúdo é retirado do ar e a
              foto não pode ser publicada de novo.
            </li>
            <li>
              As provas enviadas ficam guardadas de forma privada e só a moderação tem acesso.
            </li>
            <li>
              O e-mail de contato é opcional e só é usado se a equipe precisar falar com você sobre
              este pedido.
            </li>
          </ul>
        </Card>

        <ReportForm />
      </main>
    </div>
  );
}
