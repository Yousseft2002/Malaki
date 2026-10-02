/** Gold-shimmer skeletons shaped like the real content (never a bare spinner). */

function Block({ className = "" }: { className?: string }) {
  return <div className={`skeleton shimmer ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Block className="aspect-[4/5] w-full" />
      <Block className="mt-5 h-3 w-24" />
      <Block className="mt-3 h-6 w-40" />
      <Block className="mt-4 h-4 w-16" />
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-14 min-[480px]:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeadingSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Block className="h-3 w-28" />
      <Block className="mt-4 h-10 w-72 max-w-full" />
      <Block className="mt-6 h-px w-48" />
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-x-16">
      <Block className="aspect-square w-full" />
      <div>
        <Block className="h-3 w-24" />
        <Block className="mt-4 h-12 w-3/4" />
        <Block className="mt-8 h-9 w-28" />
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Block className="h-24" />
          <Block className="h-24" />
        </div>
        <Block className="mt-8 h-14 w-full" />
      </div>
    </div>
  );
}
