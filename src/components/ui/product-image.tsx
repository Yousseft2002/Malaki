import Image from "next/image";
import { ImagePlaceholder } from "./image-placeholder";

/** Real photo via next/image when a URL is set, otherwise a labelled placeholder. */
export function ProductImage({
  url,
  alt,
  sizes,
  className = "",
  priority = false,
}: {
  url: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!url) return <ImagePlaceholder label={alt} className={className} />;
  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      <Image src={url} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
