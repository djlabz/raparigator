import type { HTMLAttributes } from "react";

const CASH_ICON_VISUAL_SCALE = 1.8;

export function CashIcon({ className = "", style, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: "1em",
        height: "1em",
        backgroundColor: "currentColor",
        maskImage: "url(/icons/brand/cash.svg)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: "url(/icons/brand/cash.svg)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        transform: `scale(${CASH_ICON_VISUAL_SCALE})`,
        ...style,
      }}
      {...props}
    />
  );
}
