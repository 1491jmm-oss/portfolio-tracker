import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-5 h-8 w-40" />
            <Skeleton className="mt-3 h-4 w-24" />
          </Card>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <Card className="p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-6 h-[260px] w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-[260px] w-full" />
        </Card>
      </section>
      <Card className="p-5">
        <Skeleton className="h-72 w-full" />
      </Card>
    </div>
  );
}
