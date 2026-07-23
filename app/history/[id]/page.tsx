"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FoodItem } from "@/lib/types";
import { sumMeal, toDateTimeInputValue } from "@/lib/format";
import { deleteMeal, updateMeal } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TotalCard } from "@/components/TotalCard";
import { FoodRow } from "@/components/FoodRow";
import { EditSheet } from "@/components/EditSheet";
import { TabBar } from "@/components/TabBar";
import { Button } from "@/components/ui/Button";
import { CheckIcon, PlateIcon } from "@/components/icons";

interface MealDetail {
  id: string;
  createdAt: string;
  photoUrl: string | null;
  items: FoodItem[];
}

type Status = "loading" | "ready" | "error";

/** 记录详情页:照片、可修改的时间与食物明细、合计、删除 */
export default function MealDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [meal, setMeal] = useState<MealDetail | null>(null);

  // 可编辑状态:时间与明细,改动后置 dirty
  const [items, setItems] = useState<FoodItem[]>([]);
  const [when, setWhen] = useState("");
  const [dirty, setDirty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /** 删除:第一段点击进入确认态,第二段真正执行 */
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetch(`/api/meals/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `请求失败(${res.status})`);
        const detail = data as MealDetail;
        setMeal(detail);
        setItems(detail.items);
        setWhen(toDateTimeInputValue(new Date(detail.createdAt)));
        setStatus("ready");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "读取失败");
        setStatus("error");
      });
  }, [id]);

  const total = useMemo(() => sumMeal(items), [items]);
  const editing = items.find((i) => i.id === editingId) ?? null;

  const updateItem = (next: FoodItem) => {
    setDirty(true);
    setSaved(false);
    setItems((list) => list.map((i) => (i.id === next.id ? next : i)));
  };

  const removeItem = (itemId: string) => {
    if (items.length <= 1) return; // 至少保留一项;清空请用删除记录
    setDirty(true);
    setSaved(false);
    setEditingId(null);
    setItems((list) => list.filter((i) => i.id !== itemId));
  };

  const handleSave = async () => {
    if (!meal || saving || !dirty) return;
    const whenDate = when ? new Date(when) : null;
    setSaving(true);
    try {
      await updateMeal(meal.id, {
        createdAt:
          whenDate && !Number.isNaN(whenDate.getTime())
            ? whenDate.toISOString()
            : null,
        items,
      });
      setDirty(false);
      setSaved(true);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "保存失败,请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!meal || deleting) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteMeal(meal.id);
      router.push("/history");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "删除失败,请重试");
      setDeleting(false);
      setConfirming(false);
    }
  };

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

        {status === "ready" && meal && (
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
                {items.length} 项食物
              </span>
            </div>

            {/* 记录时间:可修改 */}
            <div className="mt-4">
              <label
                htmlFor="meal-time"
                className="font-mono text-label uppercase text-ink-muted"
              >
                记录时间
              </label>
              <input
                id="meal-time"
                type="datetime-local"
                value={when}
                onChange={(e) => {
                  setWhen(e.target.value);
                  setDirty(true);
                  setSaved(false);
                }}
                className="mt-2 h-12 w-full border-[3px] border-black bg-paper px-4 font-mono text-data outline-none focus:bg-black focus:text-paper"
              />
            </div>

            {/* 明细:点行修改 */}
            <ul className="mt-4 border-t-[3px] border-black">
              {items.map((item) => (
                <FoodRow
                  key={item.id}
                  item={item}
                  onEdit={(i) => setEditingId(i.id)}
                />
              ))}
            </ul>

            <div className="mt-6">
              <TotalCard total={total} animate={false} />
            </div>

            {/* 保存修改:有改动时出现 */}
            {dirty && (
              <div className="mt-6">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "保存中…" : "保存修改"}
                </Button>
              </div>
            )}
            {saved && !dirty && (
              <div className="mt-6">
                <Button variant="ghost" disabled>
                  <CheckIcon width={20} height={20} />
                  已保存修改
                </Button>
              </div>
            )}

            {/* 删除:两段确认 */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`mt-6 flex h-14 w-full items-center justify-center border-[3px] border-black font-mono text-data uppercase transition-all duration-fast disabled:opacity-40 ${
                confirming
                  ? "bg-terracotta text-paper shadow-hard hover:bg-black active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                  : "bg-paper text-ink-muted hover:text-terracotta"
              }`}
            >
              {deleting
                ? "删除中…"
                : confirming
                  ? "再点一次,确认删除(不可恢复)"
                  : "删除这条记录"}
            </button>
            {deleteError && (
              <p className="mt-3 border-[3px] border-black bg-terracotta px-4 py-3 text-center font-mono text-data uppercase text-paper">
                {deleteError}
              </p>
            )}
          </div>
        )}
      </main>

      <TabBar />

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
