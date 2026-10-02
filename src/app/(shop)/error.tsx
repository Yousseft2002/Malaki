"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { StarDivider } from "@/components/ui/star";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Server errors are already reported by instrumentation.ts; this logs client-side ones.
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-4xl text-emerald">Something went wrong</h1>
      <StarDivider tone="ink" className="my-8" />
      <p className="max-w-md text-muted">Please try again. If the problem continues, contact us and quote reference {error.digest ?? "—"}.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Back to the shop
        </ButtonLink>
      </div>
    </div>
  );
}
