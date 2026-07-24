"use client";

import { useMemo, useState } from "react";
import type { DailyStat } from "@/lib/types";

const WEEKS = 12;
const DAYS = 7;

/** 相对目标的颜色档:0 空 / 1–4 加深 */
function levelFor(kcalMid: number | undefined, goal: number): 0 | 1 | 2 | 3 | 4 {
  if (kcalMid == null || kcalMid <= 0) return 0;
  if (goal <= 0) return 1;
  const ratio = kcalMid / goal;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-paper",
  1: "bg-black/15",
  2: "bg-black/35",
  3: "bg-black/60",
  4: "bg-black",
};

/** 本地日 YYYY-MM-DD */
function toLocalDateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/**
 * 生成 12 周 × 7 天网格(周日为首,与常见贡献图一致)。
 * 末列对齐到「本周含今天」;网格起点向前补齐到周日。
 */
function buildGrid(): { date: string; dow: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // 本周日结束列:今天所在周的周六
  const end = addDays(today, 6 - today.getDay());
  const total = WEEKS * DAYS;
  const start = addDays(end, -(total - 1));

  const cells: { date: string; dow: number }[] = [];
  for (let i = 0; i < total; i++) {
    const d = addDays(start, i);
    cells.push({ date: toLocalDateKey(d), dow: d.getDay() });
  }
  return cells;
}

interface IntakeHeatmapProps {
  days: DailyStat[];
  goal: number;
}

/** GitHub 式热量贡献热力图:无记录为空,有记录按相对目标分档加深 */
export function IntakeHeatmap({ days, goal }: IntakeHeatmapProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of days) map.set(d.date, d.kcalMid);
    return map;
  }, [days]);

  const cells = useMemo(() => buildGrid(), []);

  const selectedKcal =
    selected != null ? (byDate.get(selected) ?? null) : null;

  // 按列(周)排:每列 7 行(日→六)
  const weeks: { date: string; dow: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * DAYS, (w + 1) * DAYS));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-data uppercase text-ink-faint">
          近 {WEEKS} 周摄入
        </p>
        <div className="flex items-center gap-1">
          <span className="font-mono text-label uppercase text-ink-faint">
            少
          </span>
          {([0, 1, 2, 3, 4] as const).map((lv) => (
            <span
              key={lv}
              className={`h-3.5 w-3.5 border border-black ${LEVEL_CLASS[lv]}`}
              aria-hidden
            />
          ))}
          <span className="font-mono text-label uppercase text-ink-faint">
            多
          </span>
        </div>
      </div>

      <div className="flex gap-[3px] overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => {
              const kcal = byDate.get(cell.date);
              const level = levelFor(kcal, goal);
              const isSelected = selected === cell.date;
              return (
                <button
                  key={cell.date}
                  type="button"
                  title={
                    kcal != null
                      ? `${cell.date}: ${kcal} kcal`
                      : `${cell.date}: 无记录`
                  }
                  aria-label={
                    kcal != null
                      ? `${cell.date} ${kcal} kcal`
                      : `${cell.date} 无记录`
                  }
                  onClick={() =>
                    setSelected((prev) =>
                      prev === cell.date ? null : cell.date
                    )
                  }
                  className={`h-3.5 w-3.5 shrink-0 border border-black ${LEVEL_CLASS[level]} ${
                    isSelected ? "ring-2 ring-terracotta ring-offset-1" : ""
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-3 min-h-[14px] font-mono text-data uppercase text-ink-muted">
        {selected
          ? selectedKcal != null
            ? `${selected.replace(/-/g, ".")} · ${selectedKcal} KCAL`
            : `${selected.replace(/-/g, ".")} · 无记录`
          : "点击格子查看当日"}
      </p>
    </div>
  );
}
