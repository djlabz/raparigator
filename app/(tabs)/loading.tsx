import { Skeleton } from "@/components/ui/skeleton";

export default function TabsLoading() {
  return (
    <div className="space-y-4 py-2">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-36 w-full" />
    </div>
  );
}
