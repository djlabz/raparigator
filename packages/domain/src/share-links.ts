export const SHARE_PROFILE_BASE_URL = "https://sigillus.app/p/";

export function shareProfileUrl(slug: string): string {
  return `${SHARE_PROFILE_BASE_URL}${slug}`;
}

export function shareCopyText(name: string, slug: string): string {
  return `Confira o perfil de ${name} na Sigillus. Acesse o link abaixo para ver o portfólio completo e as fotos exclusivas:\n${shareProfileUrl(slug)}`;
}

export function contactGreetingText(name: string, slug: string): string {
  return `Olá, ${name}.

Encontrei seu perfil na Sigillus e fiquei admirado com a sua apresentação. 
${shareProfileUrl(slug)}

Gostaria de conversar e conhecer mais sobre você.

✨ *Padrão de Excelência Sigillus:*
🛡️ *Cavalheirismo:* O respeito e a cordialidade são inegociáveis durante todo o contato.
📸 *Privacidade:* Todo o portfólio visual já se encontra disponível no perfil.

Aguardo o seu retorno!`;
}

export function whatsAppShareUrl(name: string, slug: string): string {
  return `https://wa.me/?text=${encodeURIComponent(shareCopyText(name, slug))}`;
}

export function telegramShareUrl(name: string, slug: string): string {
  const text = `Confira o perfil de ${name} na Sigillus.`;
  return `https://t.me/share/url?url=${encodeURIComponent(shareProfileUrl(slug))}&text=${encodeURIComponent(text)}`;
}

export function whatsAppChatUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function telegramChatUrl(username: string, text: string): string {
  return `https://t.me/${username.replace(/^@/, "")}?text=${encodeURIComponent(text)}`;
}
