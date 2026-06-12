"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, History, Loader2, Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";

import type { FeatureKey } from "@/lib/features";
import { featureConfigs, featureIcons, getFeatureConfig } from "@/lib/features";
import { makeDownloadName } from "@/lib/markdown";

type GenerateResponse = {
  output?: string;
  markdown?: string;
  savedId?: string | null;
  saveWarning?: string | null;
  naverWarning?: string | null;
  error?: string;
};

type OutputSummary = {
  id: string;
  feature: FeatureKey;
  title: string;
  primary_input: string | null;
  inputs: Record<string, string> | null;
  created_at: string;
};

type OutputDetailResponse = {
  output?: {
    id: string;
    feature: FeatureKey;
    inputs: Record<string, string>;
    output_markdown: string;
  };
  error?: string;
};

type MarkdownBlock =
  | { type: "heading"; level: number; text: string; key: string }
  | { type: "paragraph"; text: string; key: string }
  | { type: "quote"; text: string; key: string }
  | { type: "list"; items: string[]; key: string }
  | { type: "table"; rows: string[][]; key: string }
  | { type: "hr"; key: string };

function normalizeMarkdown(value: string) {
  return value
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^\s*`{2,}markdown\s*$/gim, "")
    .replace(/^\s*`{2,}\s*$/gim, "")
    .trim();
}

function parseTableLine(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = normalizeMarkdown(markdown).split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      blocks.push({ type: "hr", key: `hr-${index}` });
      index += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
        key: `heading-${index}`,
      });
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      blocks.push({ type: "quote", text: line.replace(/^>\s?/, ""), key: `quote-${index}` });
      index += 1;
      continue;
    }

    if (line.includes("|") && lines[index + 1] && isTableDivider(lines[index + 1])) {
      const rows = [parseTableLine(line)];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(parseTableLine(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", rows, key: `table-${index}` });
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length) {
        const itemLine = lines[index].trim();
        if (!/^[-*]\s+/.test(itemLine) && !/^\d+\.\s+/.test(itemLine)) break;
        items.push(itemLine.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", items, key: `list-${index}` });
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index].trim()) {
      const next = lines[index].trim();
      if (
        /^#{1,4}\s+/.test(next) ||
        /^-{3,}$/.test(next) ||
        next.startsWith(">") ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        (next.includes("|") && lines[index + 1] && isTableDivider(lines[index + 1]))
      ) {
        break;
      }
      paragraph.push(next);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" "), key: `paragraph-${index}` });
  }

  return blocks;
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(markdown), [markdown]);

  if (!markdown) {
    return <div className="markdown-preview empty">결과 생성 후 보기 좋은 문서 형태로 표시됩니다.</div>;
  }

  return (
    <article className="markdown-preview">
      {blocks.map((block) => {
        if (block.type === "heading") {
          const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
          return <Tag key={block.key}>{block.text}</Tag>;
        }
        if (block.type === "quote") {
          return <blockquote key={block.key}>{block.text}</blockquote>;
        }
        if (block.type === "list") {
          return (
            <ul key={block.key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${block.key}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "table") {
          const [head, ...body] = block.rows;
          return (
            <div className="table-scroll" key={block.key}>
              <table>
                <thead>
                  <tr>
                    {head.map((cell, cellIndex) => (
                      <th key={`${block.key}-h-${cellIndex}`}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rowIndex) => (
                    <tr key={`${block.key}-r-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${block.key}-c-${rowIndex}-${cellIndex}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "hr") {
          return <hr key={block.key} />;
        }
        return <p key={block.key}>{block.text}</p>;
      })}
    </article>
  );
}

export function AiDirectorApp() {
  const [feature, setFeature] = useState<FeatureKey>("keyword");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [markdown, setMarkdown] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftMarkdown, setDraftMarkdown] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [historyItems, setHistoryItems] = useState<OutputSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const config = useMemo(() => getFeatureConfig(feature), [feature]);

  const loadHistory = useCallback(async (nextFeature: FeatureKey) => {
    setIsHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await fetch(`/api/outputs?feature=${nextFeature}`);
      const data = (await response.json()) as { outputs?: OutputSummary[]; error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error || "저장 기록을 불러오지 못했습니다.");
      }
      setHistoryItems(data.outputs || []);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "저장 기록을 불러오지 못했습니다.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory(feature);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [feature, loadHistory]);

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
      setDraftMarkdown(data.markdown || "");
      setSavedId(data.savedId || null);
      setIsEditing(false);
      setMessage(
        [data.naverWarning, data.saveWarning || "결과 생성과 저장이 완료됐습니다."]
          .filter(Boolean)
          .join(" "),
      );
      void loadHistory(feature);
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

  function startEdit() {
    setDraftMarkdown(markdown);
    setIsEditing(true);
    setMessage("결과를 직접 수정할 수 있습니다. 저장하면 화면 결과가 갱신됩니다.");
  }

  async function saveEdit() {
    const nextMarkdown = draftMarkdown.trim();
    if (!nextMarkdown) {
      setMessage("저장할 결과물이 비어 있습니다.");
      return;
    }

    setIsSavingEdit(true);
    try {
      if (savedId) {
        const response = await fetch(`/api/outputs/${savedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ output_markdown: nextMarkdown }),
        });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Supabase 저장본 수정에 실패했습니다.");
        }
      }
      setMarkdown(nextMarkdown);
      setIsEditing(false);
      setMessage(savedId ? "수정한 결과를 저장했습니다." : "수정한 결과를 화면에 반영했습니다.");
      void loadHistory(feature);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "수정 저장 중 문제가 발생했습니다.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function deleteResult() {
    if (!markdown) return;
    const shouldDelete = window.confirm("현재 결과물을 삭제할까요?");
    if (!shouldDelete) return;

    try {
      if (savedId) {
        const response = await fetch(`/api/outputs/${savedId}`, { method: "DELETE" });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Supabase 저장본 삭제에 실패했습니다.");
        }
      }
      setMarkdown("");
      setDraftMarkdown("");
      setSavedId(null);
      setIsEditing(false);
      setMessage("결과물을 삭제했습니다.");
      void loadHistory(feature);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제 중 문제가 발생했습니다.");
    }
  }

  async function loadSavedOutput(id: string) {
    setMessage("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/outputs/${id}`);
      const data = (await response.json()) as OutputDetailResponse;
      if (!response.ok || data.error || !data.output) {
        throw new Error(data.error || "저장된 결과물을 불러오지 못했습니다.");
      }

      setFeature(data.output.feature);
      setInputs(data.output.inputs || {});
      setMarkdown(data.output.output_markdown || "");
      setDraftMarkdown(data.output.output_markdown || "");
      setSavedId(data.output.id);
      setIsEditing(false);
      setMessage("저장된 결과를 불러왔습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장된 결과물을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function formatHistoryDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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

                {feature === "keyword" && (
                  <section className="history-panel">
                    <div className="history-head">
                      <h3>
                        <History size={16} />
                        최근 키워드 리서치
                      </h3>
                      <button
                        disabled={isHistoryLoading}
                        onClick={() => void loadHistory(feature)}
                        title="새로고침"
                        type="button"
                      >
                        <RefreshCw className={isHistoryLoading ? "spin" : ""} size={15} />
                      </button>
                    </div>
                    {historyError && <p className="history-error">{historyError}</p>}
                    <div className="history-list">
                      {historyItems.length === 0 && !isHistoryLoading ? (
                        <p className="history-empty">아직 저장된 키워드 리서치가 없습니다.</p>
                      ) : (
                        historyItems.map((item) => (
                          <button
                            className={item.id === savedId ? "history-item active" : "history-item"}
                            key={item.id}
                            onClick={() => void loadSavedOutput(item.id)}
                            type="button"
                          >
                            <strong>{item.primary_input || item.title}</strong>
                            <span>
                              {item.inputs?.industry || "업종 미입력"}
                              {item.inputs?.region ? ` · ${item.inputs.region}` : ""}
                            </span>
                            <small>{formatHistoryDate(item.created_at)}</small>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </section>

              <section className="panel output-panel">
                <div className="output-head">
                  <div>
                    <h2>결과</h2>
                    {savedId && <span>Supabase 저장 ID: {savedId}</span>}
                  </div>
                  <div className="actions">
                    {isEditing ? (
                      <>
                        <button disabled={isSavingEdit} onClick={saveEdit} type="button" title="수정 저장">
                          {isSavingEdit ? <Loader2 className="spin" size={17} /> : <Check size={17} />}
                        </button>
                        <button disabled={isSavingEdit} onClick={() => setIsEditing(false)} type="button" title="취소">
                          <X size={17} />
                        </button>
                      </>
                    ) : (
                      <button disabled={!markdown} onClick={startEdit} type="button" title="수정">
                        <Pencil size={17} />
                      </button>
                    )}
                    <button disabled={!markdown} onClick={copyMarkdown} type="button" title="복사">
                      <Clipboard size={17} />
                    </button>
                    <button disabled={!markdown} onClick={downloadMarkdown} type="button" title="다운로드">
                      <Download size={17} />
                    </button>
                    <button disabled={!markdown || isEditing} onClick={deleteResult} type="button" title="삭제">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {message && <div className="notice">{message}</div>}
                {isEditing ? (
                  <textarea
                    className="markdown-editor"
                    onChange={(event) => setDraftMarkdown(event.target.value)}
                    value={draftMarkdown}
                  />
                ) : (
                  <MarkdownPreview markdown={markdown} />
                )}
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
