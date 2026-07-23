import type { FoodItem } from "@/lib/types";
import { roundKcal } from "@/lib/format";
import { ChevronRightIcon } from "./icons";

interface FoodRowProps {
  item: FoodItem;
  onEdit: (item: FoodItem) => void;
}

/** 识别出的单个食物:整行可点,进入修正 */
export function FoodRow({ item, onEdit }: FoodRowProps) {
  return (
    <li>
      <button
        onClick={() => onEdit(item)}
        className="group flex min-h-[72px] w-full items-center gap-3 border-b-[3px] border-black px-4 py-3 text-left transition-colors duration-fast hover:bg-black hover:text-paper"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-lg">{item.name}</p>
          <p className="mt-1 font-mono text-data uppercase text-ink-muted group-hover:text-paper/60">
            约 {item.portionGrams} g
          </p>
        </div>
        <span className="shrink-0 font-mono text-data uppercase">
          约 {roundKcal(item.kcal.mid)} kcal
        </span>
        <ChevronRightIcon
          width={18}
          height={18}
          className="shrink-0 text-ink-faint group-hover:text-paper"
        />
      </button>
    </li>
  );
}
