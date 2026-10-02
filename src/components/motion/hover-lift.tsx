import type { ElementType, ComponentPropsWithoutRef } from "react";

/** Lifts on hover / focus-within and presses down on tap. CSS only. */
export function HoverLift<T extends ElementType = "div">({
  as,
  className = "",
  ...rest
}: { as?: T; className?: string } & Omit<ComponentPropsWithoutRef<T>, "as" | "className">) {
  const Tag = (as ?? "div") as ElementType;
  return <Tag className={`hover-lift ${className}`} {...rest} />;
}
