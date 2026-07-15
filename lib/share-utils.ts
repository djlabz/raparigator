export function getShareProfileUrl(slug: string): string {
  return `https://sigillus.app/p/${slug}`;
}

export function getShareCopyText(name: string, slug: string): string {
  const url = getShareProfileUrl(slug);
  return `Confira o perfil de ${name} na Sigillus. Acesse o link abaixo para ver o portfólio completo, fotos exclusivas e mais detalhes sobre o atendimento:\n${url}`;
}

function getChatText(name: string, slug: string): string {
  const url = getShareProfileUrl(slug);
  return `Olá, ${name}.

Encontrei seu perfil na Sigillus e fiquei admirado com a sua apresentação. 
${url}

Gostaria de verificar a sua disponibilidade e conhecer mais detalhes sobre o seu atendimento.

✨ *Padrão de Excelência Sigillus:*
🛡️ *Cavalheirismo:* O respeito e a cordialidade são inegociáveis durante todo o contato.
💎 *Valorização:* Nossas profissionais operam com tarifas fixas. Agradecemos por não insistir em negociações ou descontos.
📸 *Privacidade:* Todo o portfólio visual já se encontra disponível no perfil.

Aguardo o seu retorno!`;
}

export function getWhatsAppChatUrl(name: string, slug: string, phone: string): string {
  const text = getChatText(name, slug);
  const encodedText = encodeURIComponent(text);
  // Garante que o número está limpo de caracteres especiais
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function getTelegramChatUrl(name: string, slug: string, username: string): string {
  const text = getChatText(name, slug);
  const encodedText = encodeURIComponent(text);
  // Remove '@' se o username vier com ele
  const cleanUsername = username.replace(/^@/, "");
  return `https://t.me/${cleanUsername}?text=${encodedText}`;
}

export function vibrate(ms: number = 50): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      // Ignore
    }
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error("Failed to copy text: ", e);
      return false;
    }
  }
  return false;
}
