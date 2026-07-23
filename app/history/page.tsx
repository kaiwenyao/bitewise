"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { PlateIcon } from "@/components/icons";
import { fetchHistory } from "@/lib/api";
import type { HistoryDay } from "@/lib/types";

type Status = "loading" | "ready" | "error";

/** 历史页:按天分组的真实记录,底部加载更多 */
export default function HistoryPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  /** 已拉取的餐数,作为下一页的 offset */
  const [loaded, setLoaded] = useState(0);

  const merge = (prev: HistoryDay[], next: HistoryDay[]): HistoryDay[] => {
    // 跨页边界同一天可能拆开,合并到已有分组
    const map = new Map(prev.map((d) => [d.label, [...d.entries]]));
    for (const day of next) {
      map.set(day.label, [...(map.get(day.label) ?? []), ...day.entries]);
    }
    return [...map.entries()].map(([label, entries]) => ({ label, entries }));
  };

  const countEntries = (list: HistoryDay[]) =>
    list.reduce((sum, d) => sum + d.entries.length, 0);

  const load = useCallback(async (offset: number, append: boolean) => {
    const data = await fetchHistory(offset);
    setDays((prev) => (append ? merge(prev, data.days) : data.days));
    setLoaded((prev) => (append ? prev : 0) + countEntries(data.days));
    setHasMore(data.hasMore);
  }, []);

  useEffect(() => {
    load(0, false)
      .then(() => setStatus("ready"))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "读取失败");
        setStatus("error");
      });
  }, [load]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await load(loaded, true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />

      <main className="flex-1 px-4 py-6">
        {/* 页头 */}
        <div className="mb-6 border-b-[3px] border-black pb-6">
          <h1 className="font-display text-display-mobile uppercase leading-none">
            HISTORY
          </h1>
          <p className="mt-2 font-mono text-data uppercase text-ink-muted">
            已消费条目与营养估算日志
          </p>
        </div>

        {status === "loading" && (
          <div aria-busy="true" className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-[pulse-soft_1.8s_ease-in-out_infinite] border-[3px] border-black bg-black"
              />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="border-[3px] border-black p-6 text-center">
            <p className="font-display text-headline-md uppercase">{error}</p>
            <p className="mt-2 font-mono text-data uppercase text-ink-muted">
              检查网络后刷新重试
            </p>
          </div>
        )}

        {status === "ready" && days.length === 0 && (
          <div className="border-[3px] border-black p-6 text-center">
            <p className="font-display text-headline-md uppercase">暂无记录</p>
            <p className="mt-2 font-mono text-data uppercase text-ink-muted">
              拍一张照片,记下第一餐
            </p>
          </div>
        )}

        {status === "ready" && days.length > 0 && (
          <>
            <div className="border-[3px] border-black">
              {days.map((day, dayIndex) => (
                <section
                  key={day.label}
                  className={dayIndex > 0 ? "border-t-[3px] border-black" : ""}
                >
                  <div className="border-b-[3px] border-black bg-black p-4 text-paper">
                    <h2 className="font-display text-headline-md uppercase">
                      {day.label}
                    </h2>
                  </div>
                  {day.entries.map((entry, entryIndex) => (
                    <Link
                      key={entry.id}
                      href={`/history/${entry.id}`}
                      className={`group flex cursor-pointer flex-col transition-colors duration-fast hover:bg-black hover:text-paper sm:flex-row ${
                        entryIndex < day.entries.length - 1
                          ? "border-b-[3px] border-black"
                          : ""
                      }`}
                    >
                      <div className="flex h-[120px] w-full shrink-0 items-center justify-center overflow-hidden border-b-[3px] border-black bg-black text-paper/40 sm:w-[120px] sm:border-b-0 sm:border-r-[3px]">
                        {entry.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.photoUrl}
                            alt={entry.name}
                            className="h-full w-full object-cover grayscale contrast-125"
                          />
                        ) : (
                          <PlateIcon width={40} height={40} strokeWidth={1.2} />
                        )}
                      </div>
                      <div className="flex flex-grow flex-col justify-between p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="font-display text-headline-md uppercase leading-tight">
                            {entry.name}
                          </h3>
                          <span className="shrink-0 border border-black bg-paper px-2 py-1 font-mono text-data group-hover:border-paper group-hover:text-black">
                            {entry.time}
                          </span>
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                          <span className="font-mono text-data uppercase text-ink-muted group-hover:text-paper/70">
                            EST. CAL
                          </span>
                          <span className="font-display text-headline-md leading-none">
                            {entry.kcal.low} – {entry.kcal.high}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </section>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-8 w-full border-[3px] border-black bg-paper py-6 font-display text-headline-md uppercase transition-colors duration-fast hover:bg-black hover:text-paper active:translate-y-1 disabled:opacity-40"
              >
                {loadingMore ? "加载中…" : "加载更多"}
              </button>
            )}
          </>
        )}
      </main>

      <TabBar />
    </div>
  );
}
