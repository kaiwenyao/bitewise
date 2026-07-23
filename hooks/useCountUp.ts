"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 550;

/**
 * 数字平滑滚动到位(如识别完成后的合计热量)。
 * active 时从当前值过渡到目标值;inactive 时直接显示目标值。
 * 系统开启「减少动态效果」时直接跳到目标值。
 */
export function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);

  return active ? value : target;
}
