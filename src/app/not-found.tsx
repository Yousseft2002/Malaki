import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { GiftBoxScene } from "@/components/ui/gift-box-scene";
import { StarDivider } from "@/components/ui/star";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-emerald py-5 text-center">
        <Link href="/" className="wordmark inline-flex min-h-11 items-center text-2xl text-gold">
          Malaki
        </Link>
      </header>
      <main id="main" className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <GiftBoxScene variant="empty" className="mb-14" />
        <p className="eyebrow text-gold-ink">Error 404</p>
        <h1 className="mt-4 text-4xl text-emerald sm:text-5xl">This box is empty</h1>
        <StarDivider tone="ink" className="my-8" />
        <p className="max-w-md text-muted">The page you were looking for isn&apos;t here — it may have moved, or the link may be mistyped.</p>
        <ButtonLink href="/collections/gift-boxes" variant="gold" className="mt-10" arrow>
          Let&apos;s find you something sweet
        </ButtonLink>
        <Link href="/" className="link-gold mt-4 inline-flex min-h-11 items-center text-sm text-muted [--underline-offset:12px]">
          Back to the homepage
        </Link>
      </main>
    </div>
  );
}
