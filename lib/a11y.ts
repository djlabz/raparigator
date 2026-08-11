import type { KeyboardEvent } from "react";

export function activateOnKey<T extends HTMLElement>(action: () => void) {
  return (event: KeyboardEvent<T>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    action();
  };
}
