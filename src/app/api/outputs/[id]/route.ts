import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ai_director_outputs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ output: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "결과물을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
