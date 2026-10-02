"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ui/product-image";

type GalleryImage = { id: string; url: string | null; alt: string };

export function Gallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [{ id: "placeholder", url: null, alt: `[PHOTO: ${productName}]` }];
  const current = list[Math.min(active, list.length - 1)]!;

  return (
    <div className="flex flex-col gap-3">
      <ProductImage
        url={current.url}
        alt={current.alt}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="aspect-square w-full"
        priority
      />
      {list.length > 1 && (
        <ul className="grid grid-cols-4 gap-3" aria-label="Product images">
          {list.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${list.length}`}
                aria-current={i === active ? "true" : undefined}
                className={`block w-full border-2 ${i === active ? "border-gold-ink" : "border-transparent"}`}
              >
                <ProductImage url={img.url} alt="" sizes="120px" className="pointer-events-none aspect-square w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
