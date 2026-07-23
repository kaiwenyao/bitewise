import { redirect } from "next/navigation";

// 首屏为拍照页
export default function Home() {
  redirect("/capture");
}
