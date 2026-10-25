import type { HTMLAttributes } from "react";

export function WhatsAppIcon({ className = "", style, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: "1em",
        height: "1em",
        backgroundColor: "currentColor",
        maskImage: "url(/icons/contact/whatsapp.svg)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: "url(/icons/contact/whatsapp.svg)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        ...style,
      }}
      {...props}
    />
  );
}

export function TelegramIcon({ className = "", style, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: "1em",
        height: "1em",
        backgroundColor: "currentColor",
        maskImage: "url(/icons/contact/telegram.svg)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: "url(/icons/contact/telegram.svg)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        ...style,
      }}
      {...props}
    />
  );
}
