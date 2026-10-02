"use client";

import { MotionConfig } from "motion/react";

/** Motion-for-React animations follow the visitor's reduced-motion preference. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
