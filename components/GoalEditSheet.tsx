"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./ui/Button";

const MIN_GOAL = 500;
const MAX_GOAL = 10000;

interface GoalEditSheetProps {
  initialGoal: number;
  onSave: (goal: number) => Promise<void>;
  onClose: () => void;
}

/** 底部抽屉:编辑每日 kcal 单一目标 */
export function GoalEditSheet({
  initialGoal,
  onSave,
  onClose,
}: GoalEditSheetProps) {
  const [value, setValue] = useState(String(initialGoal));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (close: () => void) => {
    const goal = Math.round(Number(value));
    if (!Number.isFinite(goal) || goal < MIN_GOAL || goal > MAX_GOAL) {
      setError(`请输入 ${MIN_GOAL}–${MAX_GOAL} 的整数`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(goal);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet onClose={onClose} ariaLabel="编辑每日目标">
      {(close) => (
        <>
          <p className="mb-5 font-mono text-label uppercase text-ink-muted">
            EDIT_TARGET // 每日摄入目标
          </p>

          <label
            className="block font-mono text-label uppercase text-ink-muted"
            htmlFor="daily-goal"
          >
            目标 kcal
          </label>
          <input
            id="daily-goal"
            type="number"
            inputMode="numeric"
            min={MIN_GOAL}
            max={MAX_GOAL}
            step={50}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 h-12 w-full border-thick border-black bg-paper px-4 font-display text-headline-md outline-none focus:bg-black focus:text-paper"
          />
          <p className="mt-2 font-mono text-data uppercase text-ink-faint">
            范围 {MIN_GOAL}–{MAX_GOAL}
          </p>

          {error ? (
            <p className="mt-3 font-mono text-data uppercase text-terracotta">
              {error}
            </p>
          ) : null}

          <div className="mt-6">
            <Button onClick={() => save(close)} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
