import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { PlateIcon } from "@/components/icons";
import { mockHistory } from "@/lib/mock";

/** 历史页:按天分组的历史记录列表 */
export default function HistoryPage() {
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

        {/* 记录列表 */}
        <div className="border-[3px] border-black">
          {mockHistory.map((day, dayIndex) => (
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
                <article
                  key={entry.id}
                  className={`group flex cursor-pointer flex-col transition-colors duration-fast hover:bg-black hover:text-paper sm:flex-row ${
                    entryIndex < day.entries.length - 1
                      ? "border-b-[3px] border-black"
                      : ""
                  }`}
                >
                  {/* 缩略图:接入 Supabase Storage 后换成 <Image src={entry.photoUrl} /> */}
                  <div className="flex h-[120px] w-full shrink-0 items-center justify-center border-b-[3px] border-black bg-black text-paper/40 sm:w-[120px] sm:border-b-0 sm:border-r-[3px]">
                    <PlateIcon width={40} height={40} strokeWidth={1.2} />
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
                </article>
              ))}
            </section>
          ))}
        </div>

        {/* 加载更多 */}
        <button className="mt-8 w-full border-[3px] border-black bg-paper py-6 font-display text-headline-md uppercase transition-colors duration-fast hover:bg-black hover:text-paper active:translate-y-1">
          加载更多
        </button>
      </main>

      <TabBar />
    </div>
  );
}
