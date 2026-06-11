import { NextResponse } from "next/server";

import type { FeatureKey } from "@/lib/features";
import { getFeatureConfig } from "@/lib/features";
import { buildMarkdownDocument } from "@/lib/markdown";
import { renderPrompt, systemPrompts, userPromptTemplates } from "@/lib/prompts";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type GenerateRequest = {
  feature: FeatureKey;
  inputs: Record<string, string>;
};

type OpenAITextPart = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  type?: string;
  content?: OpenAITextPart[];
};

type OpenAIResponsesPayload = {
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: {
    message?: string;
  };
};

function validateRequest(body: GenerateRequest) {
  const config = getFeatureConfig(body.feature);
  if (!config) {
    return "지원하지 않는 기능입니다.";
  }

  const missing = config.fields
    .filter((field) => field.required)
    .filter((field) => !body.inputs?.[field.name]?.trim())
    .map((field) => field.label);

  if (missing.length > 0) {
    return `필수 입력값이 비어 있습니다: ${missing.join(", ")}`;
  }

  return null;
}

function extractResponseText(payload: OpenAIResponsesPayload) {
  const fromOutputText = payload.output_text?.trim();
  if (fromOutputText) {
    return fromOutputText;
  }

  return (
    payload.output
      ?.flatMap((item) => item.content || [])
      .map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GenerateRequest;
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const config = getFeatureConfig(body.feature);
    if (!config) {
      return NextResponse.json({ error: "지원하지 않는 기능입니다." }, { status: 400 });
    }

    const userPrompt = renderPrompt(userPromptTemplates[body.feature], body.inputs);
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompts[body.feature] },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const payload = (await aiResponse.json()) as OpenAIResponsesPayload;
    if (!aiResponse.ok) {
      throw new Error(payload.error?.message || "OpenAI API 호출에 실패했습니다.");
    }

    const output = extractResponseText(payload);
    if (!output) {
      throw new Error("OpenAI 응답에서 텍스트 결과를 찾지 못했습니다.");
    }

    const markdown = buildMarkdownDocument({
      feature: body.feature,
      inputs: body.inputs,
      output,
    });
    const primaryInput = body.inputs[config.primaryField] || config.label;

    let savedId: string | null = null;
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("ai_director_outputs")
        .insert({
          feature: body.feature,
          title: config.label,
          primary_input: primaryInput,
          inputs: body.inputs,
          output_markdown: markdown,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }
      savedId = data.id;
    } catch (error) {
      console.error("Supabase save failed", error);
    }

    return NextResponse.json({
      output,
      markdown,
      savedId,
      saveWarning: savedId
        ? null
        : "결과 생성은 완료됐지만 Supabase 저장은 실패했습니다. 환경변수와 테이블을 확인해주세요.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "결과 생성 중 문제가 발생했습니다. API 키, 사용량, 입력값을 확인해주세요." },
      { status: 500 },
    );
  }
}
