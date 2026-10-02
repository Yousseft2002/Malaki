import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { StarDivider } from "@/components/ui/star";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-emerald py-5 text-center">
        <Link href="/" className="wordmark text-2xl text-gold">
          Malaki
        </Link>
      </header>
      <main id="main" className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <p className="eyebrow text-gold-ink">Error 404</p>
        <h1 className="mt-4 text-4xl text-emerald">This page can&apos;t be found</h1>
        <StarDivider tone="ink" className="my-8" />
        <p className="max-w-md text-muted">It may have moved, or the link may be mistyped.</p>
        <ButtonLink href="/" className="mt-10">
          Back to the shop
        </ButtonLink>
      </main>
    </div>
  );
}
