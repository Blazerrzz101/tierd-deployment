import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden py-24">
        <div className="container flex flex-col items-center text-center">
          <Skeleton className="h-16 w-[600px]" />
          <Skeleton className="mt-6 h-12 w-[500px]" />
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </section>

      <section className="container py-24">
        <Skeleton className="mx-auto mb-12 h-8 w-48" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <Skeleton className="mb-4 h-14 w-14 rounded-full" />
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="h-16 w-48" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/50 py-16">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="mx-auto h-8 w-24" />
                <Skeleton className="mx-auto mt-2 h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}