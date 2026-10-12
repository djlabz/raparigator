import { cn } from "@/lib/utils";

interface OptionGroupProps<T extends string> {
  name: string;
  legend: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
}

export function OptionGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  className,
}: OptionGroupProps<T>) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-zinc-900">{legend}</legend>
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        {options.map((option) => (
          <label
            key={option.id}
            className="relative flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:border-wine-200 has-checked:border-wine-300 has-checked:bg-wine-50 has-checked:text-wine-900 has-focus-visible:ring-2 has-focus-visible:ring-wine-200"
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="absolute inset-0 cursor-pointer appearance-none rounded-xl opacity-0"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
