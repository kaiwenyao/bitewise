"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { key: "capture", href: "/capture", label: "拍照", icon: "photo_camera" },
  { key: "history", href: "/history", label: "记录", icon: "history" },
  { key: "me", href: "/me", label: "我的", icon: "person" },
] as const;

/** 识别结果页属于拍照流程 */
const extraMatches: Record<string, string[]> = {
  capture: ["/result"],
};

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 grid h-20 grid-cols-3 border-t-[3px] border-black bg-paper pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ key, href, label, icon }) => {
        const active =
          pathname.startsWith(href) ||
          (extraMatches[key]?.some((p) => pathname.startsWith(p)) ?? false);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-full flex-col items-center justify-center gap-1 border-l-[3px] border-black transition-colors duration-fast first:border-l-0 ${
              active
                ? "bg-black text-paper"
                : "bg-paper text-ink hover:bg-black hover:text-paper"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={
                active
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {icon}
            </span>
            <span className="font-mono text-label uppercase">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
