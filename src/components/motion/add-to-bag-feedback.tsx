"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";

export const BAG_ARRIVE_EVENT = "malaki:bag-arrive";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A small gold piece arcs from `from` into the bag icon in the header
 * ([data-bag-target]). Resolves when it lands (immediately under reduced
 * motion or if the bag isn't on screen). Uses the native Web Animations API.
 */
export function flyToBag(from: HTMLElement | null): Promise<void> {
  const target = document.querySelector<HTMLElement>("[data-bag-target]");
  if (!from || !target || prefersReducedMotion()) return Promise.resolve();
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (b.bottom < 0 || b.top > window.innerHeight) return Promise.resolve();

  const size = 16;
  const x0 = a.left + a.width / 2 - size / 2;
  const y0 = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - size / 2 - x0;
  const dy = b.top + b.height / 2 - size / 2 - y0;
  const lift = Math.min(160, Math.max(80, Math.abs(dx) * 0.35));

  const dot = document.createElement("div");
  dot.setAttribute("aria-hidden", "true");
  Object.assign(dot.style, {
    position: "fixed",
    left: `${x0}px`,
    top: `${y0}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "9999px",
    background: "radial-gradient(circle at 35% 35%, var(--color-gold-light), var(--color-gold) 60%, var(--color-gold-ink))",
    boxShadow: "0 4px 12px -2px color-mix(in srgb, var(--color-emerald-deep) 50%, transparent)",
    zIndex: "60",
    pointerEvents: "none",
  });
  document.body.appendChild(dot);

  const animation = dot.animate(
    [
      { transform: "translate(0, 0) scale(0.6)", opacity: 0 },
      { transform: `translate(${dx * 0.15}px, ${-lift * 0.6}px) scale(1.15)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${dx * 0.55}px, ${dy - lift}px) scale(1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.4 },
    ],
    { duration: 640, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
  );
  return animation.finished
    .catch(() => undefined)
    .then(() => {
      dot.remove();
      window.dispatchEvent(new Event(BAG_ARRIVE_EVENT));
    });
}

/**
 * The add-to-bag choreography: press → gold piece arcs to the bag → item is
 * added (count bumps, drawer opens via `onAdd`) → button shows a check.
 * The caller keeps its own role="status" announcement; this is visual only.
 */
export function AddToBagButton({
  onAdd,
  validate,
  disabled,
  children,
  addedLabel = "Added",
  className = "",
  pulse = false,
}: {
  onAdd: () => void;
  /** Return false to skip the animation (e.g. show validation errors instead). */
  validate?: () => boolean;
  disabled?: boolean;
  children: ReactNode;
  addedLabel?: string;
  className?: string;
  /** Gently pulse (three times) to invite the click, e.g. a completed box. */
  pulse?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  useEffect(() => {
    if (state !== "added") return;
    const t = window.setTimeout(() => setState("idle"), 1800);
    return () => window.clearTimeout(t);
  }, [state]);

  async function handleClick() {
    if (state === "adding") return;
    if (validate && !validate()) return;
    setState("adding");
    await flyToBag(ref.current);
    onAdd();
    setState("added");
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-busy={state === "adding" || undefined}
      className={buttonClasses("primary", `min-h-14 text-sm ${pulse && state === "idle" ? "animate-[gentle-pulse_1.6s_var(--ease-in-out)_3]" : ""} ${className}`)}
    >
      {state === "added" ? (
        <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-5 w-5 animate-[intro-settle_var(--dur-base)_var(--ease-bounce)_both] text-gold" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {addedLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
