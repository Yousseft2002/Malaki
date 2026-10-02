"use client";

import { type CSSProperties, useEffect, useRef } from "react";

const FROM: Record<"left" | "right" | "bottom", string> = {
  left: "translateX(-100%)",
  right: "translateX(100%)",
  bottom: "translateY(100%)",
};

// Each side extends 24px past the screen edge (with matching padding) so the
// spring's small overshoot never reveals a gap.
const PLACEMENT: Record<"left" | "right" | "bottom", string> = {
  left: "inset-y-0 left-0 mr-auto -ml-6 pl-6 h-dvh max-h-dvh w-[calc(min(26rem,100vw)+1.5rem)]",
  right: "inset-y-0 right-0 left-auto ml-auto -mr-6 pr-6 h-dvh max-h-dvh w-[calc(min(26rem,100vw)+1.5rem)]",
  bottom: "inset-x-0 bottom-0 top-auto mt-auto -mb-6 pb-6 w-full max-w-none max-h-[calc(88dvh+1.5rem)]",
};

/**
 * Slide-in panel built on the native <dialog> element, which provides focus
 * trapping, Escape-to-close and an inert background for free. It springs in
 * from its side (CSS @starting-style; instant where unsupported or with
 * reduced motion).
 */
export function Sheet({
  open,
  onClose,
  side,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: "left" | "right" | "bottom";
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes.
        if (e.target === ref.current) onClose();
      }}
      style={{ "--sheet-from": FROM[side] } as CSSProperties}
      className={`sheet fixed m-0 bg-ivory p-0 text-ink shadow-[0_0_60px_-20px_var(--color-emerald-deep)] backdrop:bg-emerald-deep/60 ${PLACEMENT[side]}`}
    >
      <div className={`flex flex-col ${side === "bottom" ? "max-h-[88dvh]" : "h-full"}`}>{open && children}</div>
    </dialog>
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group inline-flex h-11 w-11 items-center justify-center text-emerald transition-transform hover:text-gold-ink active:scale-90"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true">
        <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </button>
  );
}
