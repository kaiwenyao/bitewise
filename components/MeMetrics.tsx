"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDailyStats, fetchProfile, updateProfile } from "@/lib/api";
import type { DailyStat } from "@/lib/types";
import { GoalEditSheet } from "./GoalEditSheet";
import { IntakeHeatmap } from "./IntakeHeatmap";

type Status = "loading" | "ready" | "error";

function todayKey(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 「我的」页:可编辑每日目标 + 今日进度 + 热量热力图 */
export function MeMetrics() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [goal, setGoal] = useState(2000);
  const [days, setDays] = useState<DailyStat[]>([]);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const [profile, stats] = await Promise.all([
        fetchProfile(),
        fetchDailyStats(84),
      ]);
      setGoal(profile.dailyKcalGoal);
      setDays(stats.days);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const todayKcal = useMemo(() => {
    const key = todayKey();
    return days.find((d) => d.date === key)?.kcalMid ?? 0;
  }, [days]);

  const ratio = goal > 0 ? todayKcal / goal : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const over = ratio > 1;

  const onSaveGoal = async (next: number) => {
    const profile = await updateProfile(next);
    setGoal(profile.dailyKcalGoal);
  };

  return (
    <>
      <section className="group border-b-thick border-black p-6">
        <div className="mb-6 flex w-full items-center justify-between">
          <span className="bg-terracotta px-2 py-1 font-mono text-label uppercase tracking-widest text-paper">
            METRICS_TARGET
          </span>
          <span className="material-symbols-outlined text-4xl text-terracotta transition-transform duration-300 group-hover:scale-110">
            target
          </span>
        </div>

        {status === "loading" ? (
          <p className="font-mono text-data uppercase text-ink-faint">
            加载中…
          </p>
        ) : status === "error" ? (
          <div>
            <p className="font-mono text-data uppercase text-terracotta">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 font-mono text-data uppercase underline"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 font-mono text-data uppercase text-ink-faint">
                  每日摄入目标
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display text-display-mobile uppercase leading-none">
                    {goal}
                  </h3>
                  <span className="font-display text-headline-md uppercase">
                    KCAL
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 border-thick border-black bg-paper px-3 py-2 font-mono text-label uppercase shadow-hard transition-all duration-fast hover:bg-black hover:text-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                编辑
              </button>
            </div>

            {/* 今日进度:相对目标;超标时条满并标 OVER */}
            <div className="mt-4 flex h-8 w-full overflow-hidden border-thick border-black">
              <div
                className="h-full bg-black transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
              <div className="h-full flex-1" />
            </div>
            <div className="mt-2 flex w-full items-center justify-between font-mono text-data uppercase">
              <span className="text-ink-muted">
                今日 {todayKcal} / {goal}
              </span>
              <span className={over ? "text-terracotta" : ""}>
                {over ? "OVER" : `${pct}%`}
              </span>
            </div>
          </>
        )}
      </section>

      <section className="p-6">
        <div className="mb-4 flex w-full items-center justify-between">
          <span className="bg-black px-2 py-1 font-mono text-label uppercase tracking-widest text-paper">
            INTAKE_MAP
          </span>
          <span className="material-symbols-outlined text-3xl">grid_on</span>
        </div>
        {status === "ready" ? (
          <IntakeHeatmap days={days} goal={goal} />
        ) : status === "loading" ? (
          <p className="font-mono text-data uppercase text-ink-faint">
            加载中…
          </p>
        ) : (
          <p className="font-mono text-data uppercase text-ink-faint">—</p>
        )}
      </section>

      {editing ? (
        <GoalEditSheet
          initialGoal={goal}
          onSave={onSaveGoal}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}
