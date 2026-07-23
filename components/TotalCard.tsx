"use client";

import { useCountUp } from "@/hooks/useCountUp";
import type { KcalTotal } from "@/lib/format";
import { roundKcal } from "@/lib/format";

interface TotalCardProps {
  total: KcalTotal;
  /** 识别完成后置为 true,触发数字滚动到位 */
  animate: boolean;
}

/**
 * 合计卡片:超大号总热量 + 估算区间。
 * 数字大但语气平静——中性黑色,不暗示盈亏或达标。
 */
export function TotalCard({ total, animate }: TotalCardProps) {
  const mid = useCountUp(roundKcal(total.mid), animate);
  const low = useCountUp(roundKcal(total.low), animate);
  const high = useCountUp(roundKcal(total.high), animate);

  return (
    <section className="border-[3px] border-black bg-paper p-6 shadow-hard">
      <p className="font-mono text-label uppercase text-ink-muted">
        TOTAL_EST // 合计(估算)
      </p>
      <p className="mt-3 font-display text-display-mobile">
        {mid}
        <span className="font-body text-body-lg text-ink-muted"> kcal</span>
      </p>
      <p className="mt-4 border-t-[3px] border-black pt-3 font-mono text-data uppercase text-ink-muted">
        区间 {low}–{high} kcal · 点任意食物可修正
      </p>
    </section>
  );
}
