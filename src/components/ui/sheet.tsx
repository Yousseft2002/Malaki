"use client";

import { useEffect, useRef } from "react";

/**
 * Slide-in panel built on the native <dialog> element, which provides focus
 * trapping, Escape-to-close and an inert background for free.
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
  side: "left" | "right";
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
      className={`fixed inset-y-0 m-0 h-dvh max-h-dvh w-[min(26rem,100vw)] max-w-full bg-ivory p-0 text-ink backdrop:bg-emerald-deep/60 ${
        side === "left" ? "left-0 mr-auto" : "right-0 left-auto ml-auto"
      }`}
    >
      <div className="flex h-full flex-col">{open && children}</div>
    </dialog>
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center text-emerald hover:text-gold-ink"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </button>
  );
}
