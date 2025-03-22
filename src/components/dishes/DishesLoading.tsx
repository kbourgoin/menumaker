
import { Skeleton } from "@/components/ui/skeleton";

const DishesLoading = () => {
  return (
    <>
      {Array(8).fill(0).map((_, index) => (
        <div key={`skeleton-${index}`} className="rounded-lg border overflow-hidden">
          <div className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="border-t p-4">
            <div className="flex justify-between">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default DishesLoading;
