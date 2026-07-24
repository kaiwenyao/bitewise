"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FoodItem, MealRecord } from "@/lib/types";
import {
  PENDING_MEAL_KEY,
  recognizePhoto,
  saveMeal,
  type PendingMeal,
  type RecognizeResult,
} from "@/lib/api";
import { sumMeal, toDateTimeInputValue } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FoodRow } from "@/components/FoodRow";
import { TotalCard } from "@/components/TotalCard";
import { EditSheet } from "@/components/EditSheet";
import { TabBar } from "@/components/TabBar";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/ui/Button";
import { CameraIcon, CheckIcon, PlateIcon } from "@/components/icons";

type Status = "loading" | "ready" | "error" | "empty";

export function ResultClient() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [meal, setMeal] = useState<MealRecord | null>(null);
  /** 压缩后的照片(base64),识别为空时也保留,供重试与保存 */
  const [photo, setPhoto] = useState<{ base64: string; mimeType: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  /** 记录时间(datetime-local 值),点保存时弹出设置,默认现在 */
  const [when, setWhen] = useState("");
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);

  const toMeal = (result: RecognizeResult): MealRecord => ({
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    photoUrl: null, // 照片未保存前没有 URL,展示用 photo 的 data URL
    items: result.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
  });

  // 首次进入:取拍照页识别好的结果
  useEffect(() => {
    setWhen(toDateTimeInputValue(new Date()));
    const raw = sessionStorage.getItem(PENDING_MEAL_KEY);
    if (!raw) {
      setStatus("empty");
      return;
    }
    try {
      const pending = JSON.parse(raw) as PendingMeal;
      setPhoto({ base64: pending.photoBase64, mimeType: pending.mimeType });
      if (pending.items.length === 0) {
        setError("这张照片没认出食物");
        setStatus("error");
        return;
      }
      setMeal(toMeal(pending));
      setStatus("ready");
    } catch {
      sessionStorage.removeItem(PENDING_MEAL_KEY);
      setStatus("empty");
    }
  }, []);

  // 对同一张照片重新识别
  const retry = useCallback(async () => {
    if (!photo) {
      router.push("/capture");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const result = await recognizePhoto(photo);
      if (result.items.length === 0) {
        setMeal(null);
        setError("这张照片没认出食物");
        setStatus("error");
        return;
      }
      setMeal(toMeal(result));
      setSaved(false);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "识别失败,请重试");
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, router]);

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

  const handleSave = async (): Promise<boolean> => {
    if (!meal || saving || saved) return false;
    setSaving(true);
    try {
      const whenDate = when ? new Date(when) : null;
      await saveMeal({
        photoBase64: photo?.base64 ?? null,
        mimeType: photo?.mimeType ?? "image/jpeg",
        items: meal.items,
        createdAt:
          whenDate && !Number.isNaN(whenDate.getTime())
            ? whenDate.toISOString()
            : null,
      });
      sessionStorage.removeItem(PENDING_MEAL_KEY);
      setSaved(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败,请重试");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <ScreenHeader
        title="识别结果"
        onBack={() => router.push("/capture")}
        onClose={() => router.push("/capture")}
      />

      <main className="flex-1 px-6 pb-6 pt-4">
        {status === "loading" && <LoadingState />}
        {status === "empty" && <EmptyState onCapture={() => router.push("/capture")} />}
        {status === "error" && (
          <ErrorState
            message={error}
            onRetry={retry}
            onCapture={() => router.push("/capture")}
          />
        )}
        {status === "ready" && meal && total && (
          <div className="animate-[rise-in_250ms_ease-out]">
            <PhotoBlock
              src={photo ? `data:${photo.mimeType};base64,${photo.base64}` : null}
              count={meal.items.length}
              onRetake={() => router.push("/capture")}
            />

            <ul className="mt-6 border-t-[3px] border-black">
              {meal.items.map((item) => (
                <FoodRow key={item.id} item={item} onEdit={(i) => setEditingId(i.id)} />
              ))}
            </ul>

            <div className="mt-6">
              <TotalCard total={total} animate />
            </div>

            {error && (
              <p className="mt-4 border-[3px] border-black bg-terracotta px-4 py-3 text-center font-mono text-data uppercase text-paper">
                {error}
              </p>
            )}
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
              <Button onClick={() => setTimeSheetOpen(true)} disabled={saving}>
                保存到今天
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

      {/* 保存前设置记录时间 */}
      {timeSheetOpen && (
        <BottomSheet onClose={() => setTimeSheetOpen(false)} ariaLabel="设置记录时间">
          {(close) => (
            <>
              <p className="mb-5 font-mono text-label uppercase text-ink-muted">
                MEAL_TIME // 这餐是什么时候吃的
              </p>
              <input
                type="datetime-local"
                value={when}
                max={toDateTimeInputValue(new Date())}
                onChange={(e) => setWhen(e.target.value)}
                aria-label="记录时间"
                className="block h-12 w-full min-w-0 max-w-full border-[3px] border-black bg-paper px-3 font-mono text-data outline-none focus:bg-black focus:text-paper"
              />
              <p className="mt-2 font-mono text-label uppercase text-ink-faint">
                默认当前时间,补记可改
              </p>
              {error && (
                <p className="mt-3 border-[3px] border-black bg-terracotta px-4 py-3 text-center font-mono text-data uppercase text-paper">
                  {error}
                </p>
              )}
              <div className="mt-6">
                <Button
                  onClick={async () => {
                    const ok = await handleSave();
                    if (ok) close();
                  }}
                  disabled={saving}
                >
                  {saving ? "保存中…" : "确认保存"}
                </Button>
              </div>
            </>
          )}
        </BottomSheet>
      )}
    </div>
  );
}

/* ---------- 照片区 ---------- */

function PhotoBlock({
  src,
  count,
  onRetake,
}: {
  src: string | null;
  count: number;
  onRetake: () => void;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden border-[3px] border-black bg-black">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="这一餐的照片"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-paper/40">
          <PlateIcon width={64} height={64} strokeWidth={1.2} />
        </div>
      )}

      <span className="absolute left-3 top-3 border-[3px] border-paper bg-black px-3 py-1.5 font-mono text-label uppercase text-paper">
        已识别 {count} 项
      </span>
      <button
        onClick={onRetake}
        className="absolute right-3 top-3 flex h-11 items-center gap-1.5 border-[3px] border-paper bg-black px-4 font-mono text-label uppercase text-paper transition-colors duration-fast hover:bg-paper hover:text-black"
      >
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

/* ---------- 没有照片:引导去拍 ---------- */

function EmptyState({ onCapture }: { onCapture: () => void }) {
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center border-[3px] border-black text-ink">
        <PlateIcon width={28} height={28} />
      </div>
      <h2 className="mt-5 font-display text-headline-md uppercase">
        还没有照片
      </h2>
      <p className="mt-2 max-w-[260px] text-body-md text-ink-muted">
        先给这餐拍一张,AI 会帮你数出每种食物和热量。
      </p>
      <div className="mt-8 w-full">
        <Button onClick={onCapture}>去拍照</Button>
      </div>
    </div>
  );
}

/* ---------- 错误态:说清发生了什么,给出路 ---------- */

function ErrorState({
  message,
  onRetry,
  onCapture,
}: {
  message: string;
  onRetry: () => void;
  onCapture: () => void;
}) {
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center border-[3px] border-black text-ink">
        <PlateIcon width={28} height={28} />
      </div>
      <h2 className="mt-5 font-display text-headline-md uppercase">
        {message || "这张照片没认出食物"}
      </h2>
      <p className="mt-2 max-w-[260px] text-body-md text-ink-muted">
        可能是光线太暗,或者角度有点刁钻。换一张清晰点的试试。
      </p>
      <div className="mt-8 w-full space-y-3">
        <Button onClick={onRetry}>重试识别</Button>
        <Button variant="ghost" onClick={onCapture}>重新拍照</Button>
      </div>
    </div>
  );
}
