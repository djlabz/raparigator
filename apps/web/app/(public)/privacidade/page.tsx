import type { Metadata } from "next";
import Link from "next/link";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "Política de Privacidade | Sigillus",
  description:
    "Diretrizes de proteção de dados e privacidade da plataforma Sigillus em conformidade com a LGPD.",
};

export default function PrivacidadePage() {
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
            Conformidade LGPD
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Política de Privacidade
          </h1>
          <p className="text-sm text-zinc-500">
            Última atualização: 10 de outubro de 2026 • Versão 1.0 (Rascunho oficial)
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <Card className="border-emerald-200 bg-emerald-50/50 p-5">
            <p className="font-semibold text-emerald-950">Privacidade por Padrão</p>
            <p className="mt-1.5 text-sm text-zinc-700 leading-relaxed">
              Tratamos a privacidade e a discrição como pilares inegociáveis. Seus dados cadastrais
              e conversas são mantidos com proteções rígidas e nunca comercializados com terceiros.
            </p>
          </Card>

          <Card className="border-wine-200 bg-wine-50/50 p-5">
            <p className="font-semibold text-wine-900">Direito à Exclusão (LGPD)</p>
            <p className="mt-1.5 text-sm text-zinc-700 leading-relaxed">
              Você possui total controle sobre seus dados. A qualquer momento, é possível solicitar
              a exclusão completa da sua conta diretamente no painel de configurações.
            </p>
          </Card>
        </div>

        <article className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-xs sm:p-10 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              1. Nosso Compromisso com a sua Privacidade
            </h2>
            <p>
              A plataforma Sigillus valoriza a privacidade, a discrição e a segurança das
              informações de seus usuários e anunciantes. Esta Política de Privacidade descreve como
              coletamos, usamos, armazenamos, protegemos e descartamos seus dados pessoais, em
              estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº
              13.709/2018).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">2. Dados Pessoais que Coletamos</h2>
            <p>Podemos coletar as seguintes categorias de dados pessoais:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Dados cadastrais:</strong> Nome completo ou civil, nome social ou artístico
                (quando aplicável), e-mail, telefone, CPF (para identificação unívoca e prevenção de
                fraudes) e senha criptografada;
              </li>
              <li>
                <strong>Dados de navegação e conexão:</strong> Endereço IP, data e hora dos acessos,
                características do dispositivo e navegador utilizado (necessários para cumprimento
                de obrigações legais do Marco Civil da Internet — Lei nº 12.965/2014);
              </li>
              <li>
                <strong>Conteúdo do perfil e anúncios:</strong> Textos descritivos, fotos e vídeos
                enviados pela profissional anunciante para divulgação em sua vitrine pública;
              </li>
              <li>
                <strong>Comunicações no chat interno:</strong> Histórico de mensagens trocadas entre
                usuários para viabilizar o contato direto na plataforma.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              3. Finalidades e Bases Legais do Tratamento
            </h2>
            <p>O tratamento de seus dados pessoais ocorre estritamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Execução de contrato (Art. 7º, V da LGPD):</strong> Viabilizar a criação e
                gestão de sua conta, veiculação de anúncios e funcionamento do sistema de mensagens;
              </li>
              <li>
                <strong>Cumprimento de obrigação legal (Art. 7º, II da LGPD):</strong> Guarda de
                registros de acesso em conformidade com o Marco Civil da Internet;
              </li>
              <li>
                <strong>Legítimo interesse e prevenção a fraudes (Art. 7º, IX da LGPD):</strong>{" "}
                Monitoramento contra abusos, fraudes, violações de termos e preservação da segurança
                dos usuários.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              4. Armazenamento e Medidas de Segurança
            </h2>
            <p>
              Adotamos práticas técnicas e organizacionais rígidas para resguardar a integridade e
              confidencialidade dos dados pessoais, incluindo:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Criptografia de senhas utilizando algoritmos modernos de hashing unidirecional;
              </li>
              <li>Comunicação segura via protocolo HTTPS/TLS em toda a aplicação;</li>
              <li>Armazenamento de mídias em infraestrutura com controles rígidos de acesso;</li>
              <li>
                Controle e segregação de privilégios de acesso restrito aos administradores da
                plataforma.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              5. Não Compartilhamento para Fins Comerciais
            </h2>
            <p>
              O Sigillus <strong>não vende, não aluga e não compartilha</strong> dados pessoais de
              seus usuários com terceiros para fins de marketing, publicidade comportamental ou
              bancos de dados comerciais.
            </p>
            <p>
              O compartilhamento poderá ocorrer exclusivamente para: (a) provedores essenciais de
              infraestrutura tecnológica (hospedagem de banco de dados, envio de e-mails
              transacionais e armazenamento de arquivos); ou (b) atendimento a ordens judiciais ou
              requisições de autoridades policiais competentes nos termos da legislação brasileira.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              6. Seus Direitos como Titular (LGPD)
            </h2>
            <p>Nos termos do artigo 18 da LGPD, você tem direito a solicitar a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmação da existência de tratamento e acesso aos dados pessoais;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>
                Exclusão definitiva de sua conta e dos respectivos dados pessoais armazenados.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              7. Procedimento de Exclusão de Conta
            </h2>
            <p>
              Você pode exercer seu direito à exclusão definitiva a qualquer momento acessando a
              seção &quot;Privacidade e Exclusão de Conta&quot; nas configurações do seu perfil.
            </p>
            <p>Ao confirmar a exclusão da conta:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Sua conta de usuário e todas as sessões ativas são permanentemente revogadas e
                excluídas;
              </li>
              <li>
                Todos os arquivos de fotos, vídeos e mídias de perfil ou anúncios são
                permanentemente apagados do nosso armazenamento;
              </li>
              <li>
                Seus anúncios veiculados na plataforma são imediatamente retirados do ar e
                excluídos;
              </li>
              <li>
                Suas mensagens de chat enviadas são integralmente anonimizadas, com o texto sendo
                substituído para preservar o sigilo das informações e desvincular seu conteúdo da
                sua identidade.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">8. Cookies e Tecnologias Locais</h2>
            <p>
              Utilizamos cookies exclusivamente necessários para autenticação de sessão,
              preferências de navegação e segurança. Não utilizamos cookies invasivos de
              rastreamento entre sites para perfilamento publicitário.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">9. Contato do Encarregado de Dados</h2>
            <p>
              Para esclarecer dúvidas sobre esta Política de Privacidade ou solicitar o exercício de
              seus direitos como titular de dados, entre em contato através dos canais de suporte da
              plataforma ou pelo e-mail institucional indicado na plataforma.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
