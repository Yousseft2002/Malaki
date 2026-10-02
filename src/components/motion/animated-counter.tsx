"use client";

import { useState } from "react";

/**
 * A number that rolls up/down when it changes. The value is keyed so the CSS
 * animation replays on every change; nothing animates on first render.
 * Screen readers just get the number.
 */
export function AnimatedCounter({ value, className = "" }: { value: number; className?: string }) {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  if (value !== previous) {
    // Adjusting state during render is React's recommended way to react to a prop change.
    setDirection(value > previous ? "up" : "down");
    setPrevious(value);
  }
  return (
    <span className={`relative inline-flex overflow-hidden ${className}`}>
      <span key={value} className={`inline-block ${direction ? `num-roll-${direction}` : ""}`}>
        {value}
      </span>
    </span>
  );
}
