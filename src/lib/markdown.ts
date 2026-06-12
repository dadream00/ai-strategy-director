import type { FeatureKey } from "./features";
import { getFeatureConfig } from "./features";

function removeMarkdownFences(value: string) {
  return value
    .replace(/^\s*```(?:markdown|md)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/^\s*`{2,}markdown\s*$/gim, "")
    .replace(/^\s*`{2,}\s*$/gim, "");
}

function removeDecorativeLines(value: string) {
  return value
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (/^[-_*]{3,}$/.test(trimmed)) return false;
      if (/^\.{3,}$/.test(trimmed)) return false;
      return true;
    })
    .join("\n");
}

function removeGeneratedIntro(value: string) {
  return value
    .replace(
      /^#\s*네이버 마케팅용 키워드 리서치 결과[^\n]*\n+[\s\S]*?(?=\n##?\s*\d+\.?\s*메인 키워드|\n##?\s*1\.?\s*메인 키워드)/i,
      "",
    )
    .replace(/^_?업종\s*:\s*[^\n]+_\s*\n+/im, "")
    .replace(/^>?\s*본 결과는 입력.*\n+/im, "");
}

export function cleanGeneratedMarkdown(value: string) {
  return removeDecorativeLines(removeGeneratedIntro(removeMarkdownFences(value)))
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s*(실행 코멘트\s*:)/gim, "$1")
    .trim();
}

export function buildMarkdownDocument({
  feature,
  inputs,
  output,
}: {
  feature: FeatureKey;
  inputs: Record<string, string>;
  output: string;
}) {
  const config = getFeatureConfig(feature);
  const title = config?.label || "AI 전략실장 결과물";
  const fields = config?.fields || [];
  const inputRows = fields
    .filter((field) => inputs[field.name])
    .map((field) => `- ${field.label}: ${inputs[field.name]}`)
    .join("\n");
  const cleanedOutput = cleanGeneratedMarkdown(output);

  return `# ${title}\n\n## 입력 정보\n${inputRows || "- 입력 정보 없음"}\n\n${cleanedOutput}\n`;
}

export function makeDownloadName(feature: FeatureKey, primaryInput: string) {
  const config = getFeatureConfig(feature);
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const cleaned = (primaryInput || config?.shortLabel || "result")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 50);

  return `${date}_${config?.shortLabel || feature}_${cleaned}.md`;
}
