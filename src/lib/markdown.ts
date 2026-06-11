import type { FeatureKey } from "./features";
import { getFeatureConfig } from "./features";

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
  const inputRows = Object.entries(inputs)
    .filter(([, value]) => value)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  return `# ${title}\n\n## 입력 정보\n${inputRows || "- 입력 정보 없음"}\n\n---\n\n${output.trim()}\n`;
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
