type RouteLoadingSkeletonProps = {
  variant: "vocabulary" | "dictionary";
};

const statCards =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

export function RouteLoadingSkeleton({ variant }: RouteLoadingSkeletonProps) {
  const isDictionary = variant === "dictionary";

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
      <div className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-8 w-56" />
            </div>
            {isDictionary ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-1/2">
                {["lessons", "words", "checked", "correct"].map((item) => (
                  <div key={item} className="space-y-2">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-7 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <SkeletonBlock className="h-9 w-24" />
                <SkeletonBlock className="h-9 w-24" />
              </div>
            )}
          </div>
        </section>

        {!isDictionary ? (
          <section className={statCards}>
            {["total", "done", "correct", "wrong"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <SkeletonBlock className="h-10 w-10" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-7 w-12" />
                    <SkeletonBlock className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SkeletonBlock className="h-10 w-full" />
          </section>
        )}

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <SkeletonBlock className="h-8 w-full max-w-md" />
          </div>
          <div className="min-w-[760px]">
            <div className="grid grid-cols-6 gap-px bg-slate-100">
              {["stt", "lesson", "hanzi", "pinyin", "meaning", "practice"].map(
                (item) => (
                  <div key={item} className="bg-slate-50 p-3">
                    <SkeletonBlock className="h-4 w-20" />
                  </div>
                ),
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: isDictionary ? 8 : 7 }, (_, index) => (
                <div key={index} className="grid grid-cols-6 gap-px">
                  {Array.from({ length: 6 }, (_cell, cellIndex) => (
                    <div key={cellIndex} className="p-3">
                      <SkeletonBlock
                        className={
                          cellIndex === 4
                            ? "h-5 w-full"
                            : cellIndex === 0
                              ? "h-5 w-8"
                              : "h-5 w-24"
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {!isDictionary ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-4">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full lg:col-span-2" />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
