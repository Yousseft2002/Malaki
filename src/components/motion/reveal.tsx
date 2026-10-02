"use client";

import { type ElementType, type ComponentPropsWithoutRef, useEffect, useRef } from "react";

type RevealProps<T extends ElementType> = {
  as?: T;
  /** "up" (default) rises in, "fade" only fades, "scale" grows in slightly. */
  variant?: "up" | "fade" | "scale";
  /** Reveal the element's children one after another instead of the element itself. */
  stagger?: boolean;
  /** Extra classes that need [data-inview] (e.g. "star-divider"). */
  className?: string;
  /** How far into the viewport the element must come before revealing. */
  rootMargin?: string;
  /** Only flag [data-inview]; add no reveal styles of its own. */
  plain?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/**
 * Reveals its content when scrolled into view by setting [data-inview] once.
 * Styling lives in globals.css (.reveal / .stagger). Server children pass
 * straight through, so wrapping a section doesn't make it a client component.
 * Content is only hidden when JS is running (html[data-js]).
 */
export function Reveal<T extends ElementType = "div">({
  as,
  variant = "up",
  stagger = false,
  className = "",
  rootMargin = "0px 0px -10% 0px",
  plain = false,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-inview", "");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute("data-inview", "");
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  const base = plain ? "" : stagger ? "stagger" : `reveal${variant === "up" ? "" : ` reveal-${variant}`}`;
  return <Tag ref={ref} className={`${base} ${className}`.trim()} {...rest} />;
}

/** Children enter one after another (cards, lists). */
export function Stagger<T extends ElementType = "div">(props: Omit<RevealProps<T>, "stagger">) {
  return <Reveal {...(props as RevealProps<T>)} stagger />;
}

/** Sets [data-inview] on an element without adding reveal styles (for custom choreography). */
export function InView<T extends ElementType = "div">(props: Omit<RevealProps<T>, "plain">) {
  return <Reveal {...(props as RevealProps<T>)} plain />;
}
