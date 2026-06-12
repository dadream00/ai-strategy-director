import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const feature = url.searchParams.get("feature");
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("ai_director_outputs")
      .select("id, feature, title, primary_input, inputs, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (feature) {
      query = query.eq("feature", feature);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ outputs: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "저장된 결과물을 불러오지 못했습니다. Supabase 설정을 확인해주세요." },
      { status: 500 },
    );
  }
}
