import Link from "next/link";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { cn } from "@/lib/utils";

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      data-testid="site-footer"
      className={cn(
        "mt-12 border-t border-zinc-200 bg-white py-10 text-zinc-600 transition-colors",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <BrandWordmark tone="wine" />
            <p className="max-w-md text-sm text-zinc-600 leading-relaxed">
              Vitrine de anúncios publicitários com segurança e discrição. Conectando anunciantes
              independentes e clientes com transparência e respeito à privacidade.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold uppercase tracking-wider text-wine-800">
              <span className="rounded-full border border-wine-200 bg-wine-50/80 px-2.5 py-0.5">
                +18 Anos
              </span>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-zinc-700">
                Vitrine Publicitária
              </span>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-zinc-700">
                LGPD
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">Navegação</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-wine-800 hover:underline">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-wine-800 hover:underline">
                  Feed de Anúncios
                </Link>
              </li>
              <li>
                <Link href="/auth/cadastro" className="hover:text-wine-800 hover:underline">
                  Cadastro de Cliente
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/cadastro/profissional"
                  className="hover:text-wine-800 hover:underline"
                >
                  Anunciar Perfil
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-wine-800 hover:underline">
                  Acessar Conta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Institucional & Legal
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/termos"
                  className="font-medium text-zinc-700 hover:text-wine-800 hover:underline"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="font-medium text-zinc-700 hover:text-wine-800 hover:underline"
                >
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-100 pt-6">
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 text-xs text-zinc-600 leading-relaxed">
            <p className="font-semibold text-zinc-900">Aviso Legal e Diretrizes de Operação</p>
            <p className="mt-1">
              O Sigillus atua estritamente como espaço de divulgação e veiculação de anúncios
              publicitários digitais. A plataforma não intermedeia pagamentos entre clientes e
              anunciantes, não cobra comissões sobre serviços prestados, não agenda, não organiza e
              não participa de encontros. O uso da plataforma é exclusivo para pessoas com idade
              igual ou superior a 18 anos civis. O tratamento de dados respeita as diretrizes da Lei
              Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-zinc-500 sm:flex-row">
            <p>© {currentYear} Sigillus. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link href="/termos" className="hover:text-zinc-800 hover:underline">
                Termos
              </Link>
              <Link href="/privacidade" className="hover:text-zinc-800 hover:underline">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
