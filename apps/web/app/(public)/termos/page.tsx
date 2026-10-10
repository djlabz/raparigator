import type { Metadata } from "next";
import Link from "next/link";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "Termos de Uso | Sigillus",
  description:
    "Termos e condições gerais de uso da plataforma Sigillus. Acesso restrito a maiores de 18 anos.",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandWordmark tone="wine" />
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            >
              Voltar ao Início
            </Link>
            <Link
              href="/auth/cadastro"
              className="rounded-lg bg-wine-700 px-3.5 py-1.5 font-medium text-white shadow-xs hover:bg-wine-800"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-8 space-y-3">
          <span className="inline-flex rounded-full border border-wine-200 bg-wine-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-wine-800">
            Documento Jurídico
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Termos de Uso
          </h1>
          <p className="text-sm text-zinc-500">
            Última atualização: 10 de outubro de 2026 • Versão 1.0 (Rascunho oficial)
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <Card className="border-wine-200 bg-wine-50/50 p-5">
            <p className="font-semibold text-wine-900">Restrição Absoluta (+18)</p>
            <p className="mt-1.5 text-sm text-zinc-700 leading-relaxed">
              O acesso, cadastro e permanência no Sigillus são permitidos exclusivamente a pessoas
              físicas com idade igual ou superior a 18 anos completos e plenamente capazes segundo a
              legislação brasileira.
            </p>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 p-5">
            <p className="font-semibold text-amber-900">Vitrine Publicitária Digital</p>
            <p className="mt-1.5 text-sm text-zinc-700 leading-relaxed">
              A plataforma atua exclusivamente como veículo publicitário de classificados. Não
              intermediamos valores, não cobramos taxa sobre serviços prestados, não realizamos
              agenciamento nem organizamos encontros.
            </p>
          </Card>
        </div>

        <article className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-xs sm:p-10 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">1. Apresentação e Aceitação</h2>
            <p>
              Estes Termos de Uso regem o acesso e a utilização dos serviços disponibilizados pela
              plataforma Sigillus. Ao acessar o site, registrar uma conta ou veicular anúncios, você
              declara que leu, compreendeu e concorda integralmente com as condições estipuladas
              neste instrumento e na nossa Política de Privacidade.
            </p>
            <p>
              Caso você não concorde com qualquer disposição aqui estabelecida, você deve abster-se
              imediatamente de utilizar a plataforma.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              2. Requisito de Maioridade e Capacidade Civil
            </h2>
            <p>
              O conteúdo veiculado na plataforma pode conter material voltado estritamente ao
              público adulto. Por essa razão, é terminantemente proibido o acesso, cadastro ou
              interação de crianças e adolescentes (menores de 18 anos).
            </p>
            <p>
              Ao utilizar a plataforma, o usuário declara, sob as penas da lei civil e penal, que é
              maior de 18 anos e possui plena capacidade civil para a prática de todos os atos da
              vida civil.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              3. Natureza do Serviço: Vitrine Publicitária
            </h2>
            <p>
              O Sigillus constitui um diretório e vitrine eletrônica de divulgação publicitária onde
              profissionais autônomas(os) anunciam seus serviços e contatos.
            </p>
            <p>
              <strong>Ausência de intermediação:</strong> A plataforma não organiza, não promove,
              não agenda, não gerencia e não acompanha encontros entre usuários e anunciantes.
              Qualquer contato, conversa ou eventual ajuste entre as partes ocorre por deliberação
              própria e exclusiva responsabilidade dos envolvidos.
            </p>
            <p>
              <strong>Ausência de custódia financeira:</strong> Nenhum pagamento relativo a serviços
              acordados entre clientes e anunciantes transita pela plataforma. O Sigillus não cobra
              porcentagens, splits, taxas de intermediação ou garantias de caução sobre
              atendimentos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              4. Cadastro, Segurança e Veracidade das Informações
            </h2>
            <p>
              Para criar uma conta, o usuário deve fornecer informações verdadeiras, completas e
              atualizadas. É proibido utilizar dados de terceiros, identidade falsa ou documentos
              adulterados.
            </p>
            <p>
              O usuário é o único responsável pela guarda e sigilo de suas credenciais de acesso
              (e-mail e senha). Qualquer atividade realizada a partir de sua conta será de sua
              inteira responsabilidade.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              5. Regras de Conduta e Conteúdos Vedados
            </h2>
            <p>É estritamente vedado a qualquer usuário ou anunciante:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Divulgar, incentivar ou sugerir qualquer material envolvendo menores de idade,
                exploração sexual infantil ou pornografia infantojuvenil (tolerância zero, com
                comunicação imediata às autoridades competentes);
              </li>
              <li>Praticar assédio, ameaça, discriminação, coerção ou condutas fraudulentas;</li>
              <li>
                Publicar imagens ou dados de terceiros sem a respectiva autorização expressa por
                escrito;
              </li>
              <li>
                Utilizar ferramentas automatizadas (bots, scrapers) para extrair dados sem
                permissão.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              6. Planos de Destaque e Assinatura Publicitária
            </h2>
            <p>
              A veiculação de anúncios pode dispor de recursos gratuitos ou modalidades opcionais de
              destaque (Planos Premium de Anúncio). A contratação de planos de destaque refere-se
              exclusivamente à visibilidade do anúncio no feed e recursos estéticos da vitrine, não
              configurando promessa de resultado financeiro ou agenciamento de clientes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              7. Encerramento de Conta e Exclusão de Dados
            </h2>
            <p>
              O usuário tem o direito de encerrar sua conta a qualquer momento diretamente pelo
              painel de configurações da conta. O encerramento da conta ensejará o descarte das
              mídias armazenadas e a anonimização de suas mensagens de chat, respeitando os
              preceitos da Lei Geral de Proteção de Dados (LGPD).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">8. Disposições Finais e Foro</h2>
            <p>
              Estes termos poderão ser alterados periodicamente pela plataforma para refletir
              melhorias técnicas ou adequações legislativas. A data de última revisão constará no
              topo desta página.
            </p>
            <p>
              Aplica-se a estes Termos a legislação vigente na República Federativa do Brasil,
              elegendo-se o foro do domicílio do anunciante/usuário para dirimir eventuais
              controvérsias judiciais.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
