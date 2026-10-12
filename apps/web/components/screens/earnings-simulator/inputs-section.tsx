import { Minus, Plus } from "lucide-react";
import {
  EARNINGS_CONTACTS_MAX,
  EARNINGS_CONTACTS_MIN,
  EARNINGS_DAYS_MIN,
  EARNINGS_HOURLY_MAX,
  EARNINGS_HOURLY_MIN,
  EARNINGS_HOURLY_STEP,
  EARNINGS_MAX_DAYS_PER_WEEK,
} from "@sigillus/domain";
import { Card } from "@/components/ui/card";
import type { EarningsSimulatorState } from "./use-earnings-simulator";

interface StepperProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  min: number;
  max: number;
  prefix?: string;
}

function Stepper({ id, label, value, onChange, step, min, max, prefix }: StepperProps) {
  const adjust = (delta: number) => {
    const current = Number(value) || min;
    onChange(String(Math.max(min, Math.min(max, current + delta))));
  };
  const lowerLabel = label.charAt(0).toLowerCase() + label.slice(1);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-700 sm:text-sm">
        {label}
      </label>
      <div className="flex h-10 items-center justify-between rounded-xl border border-zinc-200 bg-white px-1.5">
        <button
          type="button"
          onClick={() => adjust(-step)}
          aria-label={`Diminuir ${lowerLabel}`}
          className="flex size-8 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <div className="flex items-center text-sm font-semibold text-zinc-900">
          {prefix ? <span className="mr-1 text-xs text-zinc-500">{prefix}</span> : null}
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
            className="w-14 border-none bg-transparent text-center text-sm font-semibold text-zinc-900 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => adjust(step)}
          aria-label={`Aumentar ${lowerLabel}`}
          className="flex size-8 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function InputsSection({ state }: { state: EarningsSimulatorState }) {
  return (
    <Card className="grid gap-3 p-4 sm:grid-cols-3 md:p-5">
      <Stepper
        id="earnings-hourly"
        label="Valor por hora"
        value={state.hourly}
        onChange={state.setHourly}
        step={EARNINGS_HOURLY_STEP}
        min={EARNINGS_HOURLY_MIN}
        max={EARNINGS_HOURLY_MAX}
        prefix="R$"
      />
      <Stepper
        id="earnings-contacts"
        label="Contatos por dia"
        value={state.contacts}
        onChange={state.setContacts}
        step={1}
        min={EARNINGS_CONTACTS_MIN}
        max={EARNINGS_CONTACTS_MAX}
      />
      <Stepper
        id="earnings-days"
        label="Dias por semana"
        value={state.days}
        onChange={state.setDays}
        step={1}
        min={EARNINGS_DAYS_MIN}
        max={EARNINGS_MAX_DAYS_PER_WEEK}
      />
    </Card>
  );
}
