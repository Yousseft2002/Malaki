import { GridSkeleton, HeadingSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="container-page py-16" role="status" aria-label="Loading">
      <HeadingSkeleton />
      <div className="mt-14">
        <GridSkeleton />
      </div>
    </div>
  );
}
