import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-session";

export const runtime = "nodejs";

const DEFAULT_GOAL = 2000;
const MIN_GOAL = 500;
const MAX_GOAL = 10000;

/**
 * GET /api/profile — 当前用户的每日 kcal 目标。
 * 无 profiles 行时返回默认 2000(不强制写库,首次 PATCH 再 upsert)。
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("daily_kcal_goal")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error(`读取资料失败:${error.message}`);

    return NextResponse.json({
      dailyKcalGoal: data?.daily_kcal_goal ?? DEFAULT_GOAL,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "读取资料失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/profile — 更新每日 kcal 目标(整数 500–10000)。
 * 无行时 upsert。
 */
export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = (await req.json()) as { dailyKcalGoal?: unknown };
    const raw = body.dailyKcalGoal;
    const goal =
      typeof raw === "number"
        ? Math.round(raw)
        : typeof raw === "string"
          ? Math.round(Number(raw))
          : NaN;

    if (!Number.isFinite(goal) || goal < MIN_GOAL || goal > MAX_GOAL) {
      return NextResponse.json(
        { error: `每日目标须为 ${MIN_GOAL}–${MAX_GOAL} 的整数` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          daily_kcal_goal: goal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("daily_kcal_goal")
      .single();
    if (error) throw new Error(`更新资料失败:${error.message}`);

    return NextResponse.json({ dailyKcalGoal: data.daily_kcal_goal });
  } catch (e) {
    const message = e instanceof Error ? e.message : "更新资料失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
