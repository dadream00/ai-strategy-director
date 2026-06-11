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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { output_markdown?: string };
    const markdown = body.output_markdown?.trim();

    if (!markdown) {
      return NextResponse.json({ error: "저장할 결과물이 비어 있습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ai_director_outputs")
      .update({ output_markdown: markdown })
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ output: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "결과물을 수정하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("ai_director_outputs").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "결과물을 삭제하지 못했습니다." },
      { status: 500 },
    );
  }
}
