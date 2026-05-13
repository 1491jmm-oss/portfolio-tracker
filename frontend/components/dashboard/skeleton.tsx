import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-5 h-8 w-40" />
            <Skeleton className="mt-3 h-4 w-24" />
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.85fr)]">
          <Card className="p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-6 h-[420px] w-full" />
          </Card>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
            <Card className="p-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-6 h-[260px] w-full" />
            </Card>
            <Card className="p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-6 h-[260px] w-full" />
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Card className="p-5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-6 h-[420px] w-full" />
        </Card>
      </section>
    </div>
  );
}
