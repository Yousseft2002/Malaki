"use client";

import { AnimatePresence, motion } from "motion/react";
import { ease, stagger } from "@/components/motion/tokens";
import type { CartItem } from "@/lib/cart/types";

/**
 * Cart items stagger in when the list mounts (e.g. the drawer opens) and
 * animate out when removed; the remaining items glide up into place (FLIP,
 * transform-only via Motion's `layout`).
 */
export function AnimatedCartList({
  items,
  className,
  renderItem,
}: {
  items: CartItem[];
  className?: string;
  renderItem: (item: CartItem, index: number) => React.ReactNode;
}) {
  return (
    <ul className={className}>
      <AnimatePresence initial={true} mode="popLayout">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            layout="position"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: ease.out, delay: 0.12 + i * stagger.tight } }}
            exit={{ opacity: 0, x: 48, transition: { duration: 0.28, ease: ease.out } }}
          >
            {renderItem(item, i)}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
