import type { Config } from "tailwindcss";

/**
 * Bitewise 设计系统基准(Neo-Brutalism)
 * - 配色:纸白底 #F4F1E8 + 纯黑墨,3px 黑色描边,无圆角
 * - 字体:Anton(展示)/ Space Mono(标签与数据)/ Archivo Narrow(正文)
 * - 间距:Tailwind 默认 4px 网格,页面左右留白 24px
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F1E8",
        ink: {
          DEFAULT: "#1B1B1B",
          muted: "#5F5F58",
          faint: "#7E7576",
        },
        terracotta: "#E05A47",
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
        body: ["var(--font-archivo)", "sans-serif"],
      },
      fontSize: {
        display: [
          "80px",
          { lineHeight: "80px", letterSpacing: "-0.02em", fontWeight: "400" },
        ],
        "display-mobile": ["48px", { lineHeight: "48px", fontWeight: "400" }],
        "headline-lg": ["40px", { lineHeight: "44px", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "28px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "24px", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "22px", fontWeight: "400" }],
        data: [
          "14px",
          { lineHeight: "14px", letterSpacing: "0.05em", fontWeight: "700" },
        ],
        label: ["12px", { lineHeight: "12px", fontWeight: "700" }],
      },
      spacing: {
        gutter: "24px",
      },
      boxShadow: {
        hard: "4px 4px 0px 0px #000000",
      },
      transitionDuration: {
        fast: "150ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
