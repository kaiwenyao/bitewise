"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FoodItem, MealRecord } from "@/lib/types";
import { recognizeMeal, saveMeal } from "@/lib/api";
import { sumMeal } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FoodRow } from "@/components/FoodRow";
import { TotalCard } from "@/components/TotalCard";
import { EditSheet } from "@/components/EditSheet";
import { TabBar } from "@/components/TabBar";
import { Button } from "@/components/ui/Button";
import { CameraIcon, CheckIcon, PlateIcon } from "@/components/icons";

type Status = "loading" | "ready" | "error";

export function ResultClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [meal, setMeal] = useState<MealRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    recognizeMeal()
      .then((m) => {
        setMeal(m);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(load, [load]);

  const total = useMemo(
    () => (meal ? sumMeal(meal.items) : null),
    [meal]
  );
  const editing = meal?.items.find((i) => i.id === editingId) ?? null;

  const updateItem = (next: FoodItem) => {
    setSaved(false);
    setMeal(
      (m) => m && { ...m, items: m.items.map((i) => (i.id === next.id ? next : i)) }
    );
  };

  const removeItem = (id: string) => {
    setSaved(false);
    setEditingId(null);
    setMeal((m) => m && { ...m, items: m.items.filter((i) => i.id !== id) });
  };

  const handleSave = async () => {
    if (!meal || saving || saved) return;
    setSaving(true);
    await saveMeal(meal);
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <ScreenHeader title="识别结果" />

      <main className="flex-1 px-6 pb-6 pt-4">
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState onRetry={load} />}
        {status === "ready" && meal && total && (
          <div className="animate-[rise-in_250ms_ease-out]">
            <PhotoBlock count={meal.items.length} />

            <ul className="mt-6 border-t-[3px] border-black">
              {meal.items.map((item) => (
                <FoodRow key={item.id} item={item} onEdit={(i) => setEditingId(i.id)} />
              ))}
            </ul>

            <div className="mt-6">
              <TotalCard total={total} animate />
            </div>
          </div>
        )}
      </main>

      {/* 拇指区:主按钮 + Tab */}
      {status === "ready" && (
        <div className="sticky bottom-0 bg-paper">
          <div className="px-6 pb-3 pt-1">
            {saved ? (
              <Button variant="ghost" disabled>
                <CheckIcon width={20} height={20} />
                已存到今天
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中…" : "保存到今天"}
              </Button>
            )}
          </div>
          <TabBar />
        </div>
      )}
      {status !== "ready" && <TabBar />}

      {editing && (
        <EditSheet
          item={editing}
          onSave={updateItem}
          onRemove={removeItem}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

/* ---------- 照片区 ---------- */

function PhotoBlock({ count }: { count: number }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden border-[3px] border-black bg-black">
      {/* mock 照片占位:接入 Supabase Storage 后换成 <Image src={photoUrl} /> */}
      <div className="flex h-full items-center justify-center text-paper/40">
        <PlateIcon width={64} height={64} strokeWidth={1.2} />
      </div>

      <span className="absolute left-3 top-3 border-[3px] border-paper bg-black px-3 py-1.5 font-mono text-label uppercase text-paper">
        已识别 {count} 项
      </span>
      <button className="absolute right-3 top-3 flex h-11 items-center gap-1.5 border-[3px] border-paper bg-black px-4 font-mono text-label uppercase text-paper transition-colors duration-fast hover:bg-paper hover:text-black">
        <CameraIcon width={18} height={18} />
        重拍
      </button>
    </div>
  );
}

/* ---------- 识别中:有耐心感 ---------- */

function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="aspect-[4/3] animate-[pulse-soft_1.8s_ease-in-out_infinite] border-[3px] border-black bg-black" />
      <div className="mt-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-24 animate-[pulse-soft_1.8s_ease-in-out_infinite] bg-black" />
            <div className="h-4 w-16 animate-[pulse-soft_1.8s_ease-in-out_infinite] bg-black" />
          </div>
        ))}
      </div>
      <p className="mt-8 text-center font-mono text-data uppercase">
        正在识别这餐…
      </p>
      <p className="mt-2 text-center font-mono text-label uppercase text-ink-faint">
        AI 在数盘子里的食物,通常几秒就好
      </p>
    </div>
  );
}

/* ---------- 错误态:说清发生了什么,给出路 ---------- */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center border-[3px] border-black text-ink">
        <PlateIcon width={28} height={28} />
      </div>
      <h2 className="mt-5 font-display text-headline-md uppercase">
        这张照片没认出食物
      </h2>
      <p className="mt-2 max-w-[260px] text-body-md text-ink-muted">
        可能是光线太暗,或者角度有点刁钻。换一张清晰点的,或者手动记一笔。
      </p>
      <div className="mt-8 w-full space-y-3">
        <Button onClick={onRetry}>重试识别</Button>
        <Button variant="ghost">手动添加</Button>
      </div>
    </div>
  );
}
