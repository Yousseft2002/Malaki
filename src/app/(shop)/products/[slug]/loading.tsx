import { ProductPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="container-page py-8 md:py-14" role="status" aria-label="Loading product">
      <div className="skeleton shimmer h-4 w-48" />
      <ProductPageSkeleton />
    </div>
  );
}
