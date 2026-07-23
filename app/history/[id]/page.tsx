"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FoodItem } from "@/lib/types";
import { roundKcal, sumMeal } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TotalCard } from "@/components/TotalCard";
import { TabBar } from "@/components/TabBar";
import { PlateIcon } from "@/components/icons";

interface MealDetail {
  id: string;
  createdAt: string;
  photoUrl: string | null;
  items: FoodItem[];
}

type Status = "loading" | "ready" | "error";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

/** 记录详情页:一餐的照片、全部食物项与合计 */
export default function MealDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [meal, setMeal] = useState<MealDetail | null>(null);

  useEffect(() => {
    fetch(`/api/meals/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `请求失败(${res.status})`);
        setMeal(data as MealDetail);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "读取失败");
        setStatus("error");
      });
  }, [id]);

  const total = useMemo(
    () => (meal ? sumMeal(meal.items) : null),
    [meal]
  );

  const at = meal ? new Date(meal.createdAt) : null;
  const dateLabel = at
    ? `${at.getFullYear()}.${String(at.getMonth() + 1).padStart(2, "0")}.${String(at.getDate()).padStart(2, "0")} ${WEEKDAYS[at.getDay()]} · ${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`
    : "";

  return (
    <div className="flex min-h-dvh flex-col">
      <ScreenHeader
        title="记录详情"
        onBack={() => router.push("/history")}
        onClose={() => router.push("/history")}
      />

      <main className="flex-1 px-6 pb-6 pt-4">
        {status === "loading" && (
          <div aria-busy="true">
            <div className="aspect-[4/3] animate-[pulse-soft_1.8s_ease-in-out_infinite] border-[3px] border-black bg-black" />
            <div className="mt-6 space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-24 animate-[pulse-soft_1.8s_ease-in-out_infinite] bg-black" />
                  <div className="h-4 w-16 animate-[pulse-soft_1.8s_ease-in-out_infinite] bg-black" />
                </div>
              ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center pt-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center border-[3px] border-black text-ink">
              <PlateIcon width={28} height={28} />
            </div>
            <h2 className="mt-5 font-display text-headline-md uppercase">
              {error}
            </h2>
          </div>
        )}

        {status === "ready" && meal && total && (
          <div className="animate-[rise-in_250ms_ease-out]">
            <div className="relative aspect-[4/3] overflow-hidden border-[3px] border-black bg-black">
              {meal.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meal.photoUrl}
                  alt="这一餐的照片"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-paper/40">
                  <PlateIcon width={64} height={64} strokeWidth={1.2} />
                </div>
              )}
              <span className="absolute left-3 top-3 border-[3px] border-paper bg-black px-3 py-1.5 font-mono text-label uppercase text-paper">
                {meal.items.length} 项食物
              </span>
            </div>

            <p className="mt-4 font-mono text-data uppercase text-ink-muted">
              {dateLabel}
            </p>

            <ul className="mt-4 border-t-[3px] border-black">
              {meal.items.map((item) => (
                <li
                  key={item.id}
                  className="flex min-h-[72px] items-center gap-3 border-b-[3px] border-black py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-lg">{item.name}</p>
                    <p className="mt-1 font-mono text-data uppercase text-ink-muted">
                      约 {item.portionGrams} g
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-data uppercase">
                      约 {roundKcal(item.kcal.mid)} kcal
                    </p>
                    <p className="mt-1 font-mono text-label uppercase text-ink-faint">
                      {roundKcal(item.kcal.low)}–{roundKcal(item.kcal.high)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <TotalCard total={total} animate />
            </div>
          </div>
        )}
      </main>

      <TabBar />
    </div>
  );
}
