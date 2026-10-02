import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "gold" | "outline" | "outline-light" | "ghost";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-emerald text-ivory hover:bg-emerald-deep",
  gold: "bg-gold text-emerald-deep hover:bg-[#d6b45f]",
  outline: "border border-emerald text-emerald hover:bg-emerald hover:text-ivory",
  "outline-light": "border border-gold text-ivory hover:bg-gold hover:text-emerald-deep",
  ghost: "text-emerald underline-offset-4 hover:underline",
};

export function buttonClasses(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={buttonClasses(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
