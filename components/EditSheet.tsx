"use client";

import { useState } from "react";
import type { FoodItem } from "@/lib/types";
import { roundKcal } from "@/lib/format";
import { Button } from "./ui/Button";
import { BottomSheet } from "./BottomSheet";
import { MinusIcon, PlusIcon } from "./icons";

interface EditSheetProps {
  item: FoodItem;
  onSave: (next: FoodItem) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

/**
 * 底部抽屉:手动微调某一项食物。
 * 修正热量中值时,估算区间按比例缩放,保持「区间」语义不变。
 */
export function EditSheet({ item, onSave, onRemove, onClose }: EditSheetProps) {
  const [name, setName] = useState(item.name);
  const [grams, setGrams] = useState(item.portionGrams);
  const [mid, setMid] = useState(roundKcal(item.kcal.mid));

  const save = (close: () => void) => {
    const ratio = item.kcal.mid > 0 ? mid / item.kcal.mid : 1;
    onSave({
      ...item,
      name: name.trim() || item.name,
      portionGrams: grams,
      kcal: {
        low: roundKcal(item.kcal.low * ratio),
        mid,
        high: roundKcal(item.kcal.high * ratio),
      },
    });
    close();
  };

  const low = roundKcal(item.kcal.mid > 0 ? (item.kcal.low / item.kcal.mid) * mid : mid);
  const high = roundKcal(item.kcal.mid > 0 ? (item.kcal.high / item.kcal.mid) * mid : mid);

  return (
    <BottomSheet onClose={onClose} ariaLabel="修正食物">
      {(close) => (
        <>
          <p className="mb-5 font-mono text-label uppercase text-ink-muted">
            EDIT_ITEM // 修正食物
          </p>

          <label
            className="block font-mono text-label uppercase text-ink-muted"
            htmlFor="food-name"
          >
            名称
          </label>
          <input
            id="food-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-12 w-full border-[3px] border-black bg-paper px-4 text-body-lg outline-none focus:bg-black focus:text-paper"
          />

          <Stepper
            label="份量"
            display={`约 ${grams} g`}
            onDec={() => setGrams((g) => Math.max(0, g - 10))}
            onInc={() => setGrams((g) => g + 10)}
          />
          <Stepper
            label="热量"
            display={`约 ${mid} kcal`}
            hint={`区间 ${low}–${high} kcal,随中值等比调整`}
            onDec={() => setMid((k) => Math.max(0, k - 10))}
            onInc={() => setMid((k) => k + 10)}
          />

          <div className="mt-6">
            <Button onClick={() => save(close)}>完成</Button>
            <button
              onClick={() => onRemove(item.id)}
              className="mt-3 flex h-11 w-full items-center justify-center font-mono text-data uppercase text-ink-faint transition-colors duration-fast hover:text-ink"
            >
              移除此项
            </button>
          </div>
        </>
      )}
    </BottomSheet>
  );
}

function Stepper({
  label,
  display,
  hint,
  onDec,
  onInc,
}: {
  label: string;
  display: string;
  hint?: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="mt-5">
      <p className="font-mono text-label uppercase text-ink-muted">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <StepButton label={`减少${label}`} onClick={onDec}>
          <MinusIcon width={20} height={20} />
        </StepButton>
        <div className="text-center">
          <p className="font-display text-headline-md">{display}</p>
          {hint && (
            <p className="mt-1 font-mono text-label uppercase text-ink-faint">
              {hint}
            </p>
          )}
        </div>
        <StepButton label={`增加${label}`} onClick={onInc}>
          <PlusIcon width={20} height={20} />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-black bg-paper text-ink shadow-hard transition-all duration-fast hover:bg-black hover:text-paper active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
    >
      {children}
    </button>
  );
}
