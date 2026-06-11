"use client";

import { useMemo, useState } from "react";
import { Clipboard, Download, Loader2, Save } from "lucide-react";

import type { FeatureKey } from "@/lib/features";
import { featureConfigs, featureIcons, getFeatureConfig } from "@/lib/features";
import { makeDownloadName } from "@/lib/markdown";

type GenerateResponse = {
  output?: string;
  markdown?: string;
  savedId?: string | null;
  saveWarning?: string | null;
  error?: string;
};

export function AiDirectorApp() {
  const [feature, setFeature] = useState<FeatureKey>("keyword");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [markdown, setMarkdown] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const config = useMemo(() => getFeatureConfig(feature), [feature]);

  function updateInput(name: string, value: string) {
    setInputs((current) => ({ ...current, [name]: value }));
  }

  async function generate() {
    if (!config) return;

    const missing = config.fields
      .filter((field) => field.required)
      .filter((field) => !inputs[field.name]?.trim())
      .map((field) => field.label);

    if (missing.length > 0) {
      setMessage(`필수 입력값이 비어 있습니다: ${missing.join(", ")}`);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setSavedId(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, inputs }),
      });
      const data = (await response.json()) as GenerateResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error || "결과 생성에 실패했습니다.");
      }

      setMarkdown(data.markdown || "");
      setSavedId(data.savedId || null);
      setMessage(data.saveWarning || "결과 생성과 저장이 완료됐습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function downloadMarkdown() {
    const primaryInput = config ? inputs[config.primaryField] : "";
    const fileName = makeDownloadName(feature, primaryInput);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setMessage("결과물을 클립보드에 복사했습니다.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AI</span>
          <div>
            <strong>AI 전략실장</strong>
            <small>독립 개발용 MVP</small>
          </div>
        </div>

        <nav className="feature-nav" aria-label="기능 선택">
          {featureConfigs.map((item) => {
            const Icon = featureIcons[item.key];
            const active = item.key === feature;
            return (
              <button
                className={active ? "feature-button active" : "feature-button"}
                key={item.key}
                onClick={() => {
                  setFeature(item.key);
                  setMessage("");
                }}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
                <code>{item.command}</code>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        {config && (
          <>
            <header className="workspace-header">
              <div>
                <p>{config.command}</p>
                <h1>{config.label}</h1>
                <span>{config.description}</span>
              </div>
              <button className="primary-button" disabled={isLoading} onClick={generate} type="button">
                {isLoading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                결과 생성
              </button>
            </header>

            <div className="work-grid">
              <section className="panel">
                <h2>입력</h2>
                <div className="form-grid">
                  {config.fields.map((field) => (
                    <label className="field" key={field.name}>
                      <span>
                        {field.label}
                        {field.required && <b>*</b>}
                      </span>
                      {field.type === "textarea" ? (
                        <textarea
                          onChange={(event) => updateInput(field.name, event.target.value)}
                          placeholder={field.placeholder}
                          value={inputs[field.name] || ""}
                        />
                      ) : (
                        <input
                          onChange={(event) => updateInput(field.name, event.target.value)}
                          placeholder={field.placeholder}
                          type={field.type || "text"}
                          value={inputs[field.name] || ""}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>

              <section className="panel output-panel">
                <div className="output-head">
                  <div>
                    <h2>결과</h2>
                    {savedId && <span>Supabase 저장 ID: {savedId}</span>}
                  </div>
                  <div className="actions">
                    <button disabled={!markdown} onClick={copyMarkdown} type="button" title="복사">
                      <Clipboard size={17} />
                    </button>
                    <button disabled={!markdown} onClick={downloadMarkdown} type="button" title="다운로드">
                      <Download size={17} />
                    </button>
                  </div>
                </div>

                {message && <div className="notice">{message}</div>}
                <pre className={markdown ? "markdown-result" : "markdown-result empty"}>
                  {markdown || "결과 생성 후 Markdown 결과물이 여기에 표시됩니다."}
                </pre>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
