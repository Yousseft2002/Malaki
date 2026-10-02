import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "gold" | "outline" | "outline-light" | "ghost";

const base =
  "btn-tactile inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-emerald text-ivory hover:bg-emerald-deep",
  gold: "btn-gold-surface bg-gold text-emerald-deep",
  outline: "border border-emerald text-emerald hover:bg-emerald hover:text-ivory",
  "outline-light": "border border-gold text-ivory hover:bg-gold hover:text-emerald-deep",
  ghost: "text-emerald underline-offset-4 hover:underline",
};

export function buttonClasses(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

/** A small arrow that slides a few pixels on hover / focus. */
export function ButtonArrow() {
  return (
    <span className="btn-arrow" aria-hidden="true">
      →
    </span>
  );
}

function withArrow(children: ReactNode, arrow?: boolean) {
  return arrow ? (
    <>
      <span>{children}</span>
      <ButtonArrow />
    </>
  ) : (
    children
  );
}

/** Tactile button: lifts on hover, compresses on press (see .btn-tactile). */
export function Button({
  variant = "primary",
  className = "",
  arrow,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; arrow?: boolean }) {
  return (
    <button type="button" className={buttonClasses(variant, className)} {...props}>
      {withArrow(children, arrow)}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  arrow,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; arrow?: boolean }) {
  return (
    <Link className={buttonClasses(variant, className)} {...props}>
      {withArrow(children, arrow)}
    </Link>
  );
}
