import { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  leadingIcon?: ReactNode;
  premium?: boolean;
}

export function Select({ id, label, options, className, leadingIcon, premium = false, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{leadingIcon}</span>
        ) : null}
        <select
          id={id}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-200",
            Boolean(leadingIcon) && "pl-10",
            premium && "border-zinc-300 bg-zinc-50/70",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Ícone SVG inline para não depender de bibliotecas externas */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
