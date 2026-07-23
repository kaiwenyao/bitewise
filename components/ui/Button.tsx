import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "quiet";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const styles: Record<ButtonVariant, string> = {
  // 主按钮:黑底纸字,hover 反色,硬阴影按压下沉
  primary:
    "border-[3px] border-black bg-black text-paper shadow-hard hover:bg-paper hover:text-black active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  // 次按钮:纸底描边
  ghost:
    "border-[3px] border-black bg-paper text-ink shadow-hard hover:bg-black hover:text-paper active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  // 文字按钮:最小干预
  quiet: "bg-transparent text-ink-muted hover:text-ink",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`flex h-14 w-full items-center justify-center gap-2 font-mono text-data uppercase transition-all duration-fast disabled:opacity-40 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
