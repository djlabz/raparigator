import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, selected, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("flex p-1 space-x-1 bg-zinc-100/80 rounded-xl", className)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={(e) => {
            e.preventDefault();
            onChange(option);
          }}
          className={cn(
            "relative w-full py-2 text-sm font-medium rounded-lg focus:outline-none transition-colors",
            selected === option ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          {selected === option && (
            <motion.div
              layoutId="segmented-control-active"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">{option}</span>
        </button>
      ))}
    </div>
  );
}
