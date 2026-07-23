import type { Metadata, Viewport } from "next";
import { Anton, Archivo_Narrow, Space_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anton",
});

const archivo = Archivo_Narrow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Bitewise",
  description: "拍一张,记下这一餐。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F1E8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${anton.variable} ${archivo.variable} ${spaceMono.variable}`}
    >
      <body className="font-body">
        {/* 桌面访问时收窄为手机宽度,移动端全宽 */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper md:border-x-[3px] md:border-black">
          {children}
        </div>
      </body>
    </html>
  );
}
