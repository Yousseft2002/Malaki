"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";

type GalleryImage = { id: string; url: string | null; alt: string };

/**
 * Mobile: a swipeable strip (CSS scroll-snap) with tappable position dots.
 * Desktop: a large stage that cross-fades between images, thumbnails beside it,
 * and a controlled zoom that follows the pointer (real photos only).
 */
export function Gallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const list = images.length ? images : [{ id: "placeholder", url: null, alt: `[PHOTO: ${productName}]` }];
  const [active, setActive] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  // Keep the mobile dots in sync with swiping.
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(i: number) {
    setActive(i);
    strip.current?.scrollTo({ left: i * strip.current.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      {/* Mobile: swipeable strip */}
      <div className="md:hidden">
        <div
          ref={strip}
          className="-mx-5 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${productName} photos`}
          role="region"
          tabIndex={0}
        >
          {list.map((img, i) => (
            <div key={img.id} className="w-full shrink-0 snap-center px-5">
              <ProductImage url={img.url} alt={img.alt} sizes="100vw" className="aspect-square w-full" priority={i === 0} />
            </div>
          ))}
        </div>
        {list.length > 1 && (
          <div className="mt-2 flex justify-center gap-1" role="group" aria-label="Choose photo">
            {list.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1} of ${list.length}`}
                aria-current={i === active ? "true" : undefined}
                className="flex h-11 w-11 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ${i === active ? "w-6 bg-gold-ink" : "w-1.5 bg-muted/50"}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: stage + thumbnails */}
      <div className="hidden gap-4 md:grid md:grid-cols-[5rem_1fr]">
        {list.length > 1 ? (
          <ul className="flex flex-col gap-3" aria-label="Product images">
            {list.map((img, i) => (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1} of ${list.length}`}
                  aria-current={i === active ? "true" : undefined}
                  className={`block w-full border transition-[border-color,transform,opacity] duration-300 ${
                    i === active ? "scale-100 border-gold-ink opacity-100" : "scale-95 border-transparent opacity-70 hover:scale-100 hover:opacity-100"
                  }`}
                >
                  <ProductImage url={img.url} alt="" sizes="80px" className="pointer-events-none aspect-square w-full" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div />
        )}
        <Stage images={list} active={active} />
      </div>
    </div>
  );
}

function Stage({ images, active }: { images: GalleryImage[]; active: number }) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const canZoom = !!images[active]?.url;

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-sand shadow-[0_30px_60px_-44px_color-mix(in_srgb,var(--color-emerald-deep)_60%,transparent)] ${canZoom ? "cursor-zoom-in" : ""}`}
      onPointerMove={(e) => {
        if (!canZoom || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onPointerLeave={() => setZoom(null)}
    >
      {images.map((img, i) => (
        <div
          key={img.id}
          aria-hidden={i !== active}
          className={`absolute inset-0 transition-[opacity,transform] duration-[600ms] ease-[var(--ease-out)] ${i === active ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"}`}
        >
          <div
            className="h-full w-full transition-transform duration-300 ease-[var(--ease-out)]"
            style={i === active && zoom ? { transform: "scale(1.6)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          >
            <ProductImage url={img.url} alt={img.alt} sizes="(min-width: 1024px) 50vw, 60vw" className="h-full w-full" priority={i === 0} />
          </div>
        </div>
      ))}
      <div aria-hidden="true" className="pointer-events-none absolute inset-4 border border-gold/40" />
    </div>
  );
}
