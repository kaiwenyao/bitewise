import type { ReactNode } from "react";
import { ChevronLeftIcon, XMarkIcon } from "./icons";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
}

/** 页面顶栏:返回 + 标题 + 关闭,全部为 44px 触控目标 */
export function ScreenHeader({ title, onBack, onClose }: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b-[3px] border-black bg-paper px-3">
      <HeaderButton label="返回" onClick={onBack}>
        <ChevronLeftIcon />
      </HeaderButton>
      <h1 className="font-display text-headline-md uppercase">{title}</h1>
      <HeaderButton label="关闭" onClick={onClose}>
        <XMarkIcon />
      </HeaderButton>
    </header>
  );
}

function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-fast hover:bg-black hover:text-paper"
    >
      {children}
    </button>
  );
}
