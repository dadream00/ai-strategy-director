type NaverSearchItem = {
  title?: string;
  link?: string;
  description?: string;
  bloggername?: string;
  cafename?: string;
  category?: string;
  address?: string;
  roadAddress?: string;
  postdate?: string;
};

type NaverSearchResponse = {
  total?: number;
  items?: NaverSearchItem[];
};

type NaverTrendPoint = {
  period: string;
  ratio: number;
};

type NaverTrendResult = {
  title: string;
  keywords: string[];
  data: NaverTrendPoint[];
};

type NaverTrendResponse = {
  results?: NaverTrendResult[];
};

type NaverApiErrorBody = {
  errorCode?: string;
  errorMessage?: string;
  message?: string;
};

type NaverSourceFailure = {
  label: string;
  detail: string;
};

export type NaverKeywordInsights = {
  enabled: boolean;
  warning?: string;
  failedSources?: string[];
  failures?: NaverSourceFailure[];
  seedKeywords: string[];
  search: {
    blog: NaverSearchResponse | null;
    cafe: NaverSearchResponse | null;
    local: NaverSearchResponse | null;
  };
  trend: NaverTrendResponse | null;
};

const NAVER_SEARCH_ENDPOINTS = {
  blog: "https://openapi.naver.com/v1/search/blog.json",
  cafe: "https://openapi.naver.com/v1/search/cafearticle.json",
  local: "https://openapi.naver.com/v1/search/local.json",
};

class NaverApiError extends Error {
  constructor(
    public source: string,
    public status: number,
    public detail: string,
  ) {
    super(`${source} failed: ${status} ${detail}`);
  }
}

function stripHtml(value = "") {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function makeSeedKeywords(inputs: Record<string, string>) {
  const industry = inputs.industry || "";
  const region = inputs.region || "";
  const service = inputs.service || "";
  const targetCustomer = inputs.targetCustomer || "";
  const competitor = inputs.competitor || "";

  return unique([
    `${region} ${service}`,
    `${region} ${industry}`,
    `${service} ${targetCustomer}`,
    service,
    industry,
    competitor,
  ]).slice(0, 5);
}

function getDateMonthsAgo(monthsAgo: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

async function getNaverErrorDetail(response: Response) {
  try {
    const data = (await response.json()) as NaverApiErrorBody;
    return data.errorMessage || data.message || data.errorCode || response.statusText;
  } catch {
    return response.statusText || "알 수 없는 오류";
  }
}

async function fetchNaverSearch({
  endpoint,
  query,
  clientId,
  clientSecret,
  display = 5,
}: {
  endpoint: string;
  query: string;
  clientId: string;
  clientSecret: string;
  display?: number;
}) {
  const url = new URL(endpoint);
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "sim");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  if (!response.ok) {
    const detail = await getNaverErrorDetail(response);
    throw new NaverApiError("Naver search", response.status, detail);
  }

  const data = (await response.json()) as NaverSearchResponse;
  return {
    ...data,
    items: data.items?.map((item) => ({
      ...item,
      title: stripHtml(item.title),
      description: stripHtml(item.description),
    })),
  };
}

async function fetchNaverTrend({
  seedKeywords,
  clientId,
  clientSecret,
}: {
  seedKeywords: string[];
  clientId: string;
  clientSecret: string;
}) {
  if (seedKeywords.length === 0) {
    return null;
  }

  const response = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    body: JSON.stringify({
      startDate: getDateMonthsAgo(12),
      endDate: getToday(),
      timeUnit: "month",
      keywordGroups: seedKeywords.map((keyword) => ({
        groupName: keyword,
        keywords: [keyword],
      })),
      device: "mo",
    }),
  });

  if (!response.ok) {
    const detail = await getNaverErrorDetail(response);
    throw new NaverApiError("Naver trend", response.status, detail);
  }

  return (await response.json()) as NaverTrendResponse;
}

export async function getNaverKeywordInsights(
  inputs: Record<string, string>,
): Promise<NaverKeywordInsights> {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  const seedKeywords = makeSeedKeywords(inputs);

  if (!clientId || !clientSecret) {
    return {
      enabled: false,
      warning: "NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 없어 네이버 실시간 데이터 없이 생성했습니다.",
      seedKeywords,
      search: { blog: null, cafe: null, local: null },
      trend: null,
    };
  }

  const primaryQuery = seedKeywords[0] || inputs.service || inputs.industry || "";
  const requests = {
    blog: fetchNaverSearch({
      endpoint: NAVER_SEARCH_ENDPOINTS.blog,
      query: primaryQuery,
      clientId,
      clientSecret,
      display: 10,
    }),
    cafe: fetchNaverSearch({
      endpoint: NAVER_SEARCH_ENDPOINTS.cafe,
      query: primaryQuery,
      clientId,
      clientSecret,
      display: 10,
    }),
    local: fetchNaverSearch({
      endpoint: NAVER_SEARCH_ENDPOINTS.local,
      query: primaryQuery,
      clientId,
      clientSecret,
      display: 10,
    }),
    trend: fetchNaverTrend({ seedKeywords, clientId, clientSecret }),
  };

  const [blogResult, cafeResult, localResult, trendResult] = await Promise.allSettled([
    requests.blog,
    requests.cafe,
    requests.local,
    requests.trend,
  ]);

  const failedSources: string[] = [];
  const failures: NaverSourceFailure[] = [];

  function getSettledValue<T>(label: string, result: PromiseSettledResult<T>) {
    if (result.status === "fulfilled") {
      return result.value;
    }
    console.error(`${label} Naver API failed`, result.reason);
    failedSources.push(label);
    const reason = result.reason;
    const detail =
      reason instanceof NaverApiError
        ? `${reason.status} ${reason.detail}`
        : reason instanceof Error
          ? reason.message
          : "알 수 없는 오류";
    failures.push({ label, detail });
    return null;
  }

  const blog = getSettledValue("블로그", blogResult);
  const cafe = getSettledValue("카페글", cafeResult);
  const local = getSettledValue("지역", localResult);
  const trend = getSettledValue("데이터랩", trendResult);
  const hasAnyData = Boolean(blog || cafe || local || trend);

  return {
    enabled: hasAnyData,
    warning:
      failedSources.length > 0
        ? `네이버 API 일부 항목 수집에 실패했습니다: ${failures.map((failure) => `${failure.label}(${failure.detail})`).join(", ")}. 수집된 데이터만 반영했습니다.`
        : undefined,
    failedSources,
    failures,
    seedKeywords,
    search: { blog, cafe, local },
    trend,
  };
}

function summarizeSearch(label: string, response: NaverSearchResponse | null) {
  if (!response) {
    return `### ${label}\n- 수집 실패 또는 미설정`;
  }

  const rows =
    response.items
      ?.slice(0, 5)
      .map((item, index) => {
        const source = item.bloggername || item.cafename || item.category || item.roadAddress || item.address || "";
        return `${index + 1}. ${item.title || "제목 없음"}${source ? ` / ${source}` : ""}`;
      })
      .join("\n") || "- 결과 없음";

  return `### ${label}\n- 총 검색 결과 수: ${response.total ?? "알 수 없음"}\n${rows}`;
}

function summarizeTrend(response: NaverTrendResponse | null) {
  if (!response?.results?.length) {
    return "### 데이터랩 검색 트렌드\n- 수집 실패 또는 결과 없음";
  }

  const rows = response.results
    .map((result) => {
      const data = result.data || [];
      const latest = data[data.length - 1];
      const max = data.reduce<NaverTrendPoint | null>((current, point) => {
        if (!current || point.ratio > current.ratio) return point;
        return current;
      }, null);
      return `- ${result.title}: 최신 ${latest?.period ?? "-"} ${latest?.ratio ?? "-"} / 최고 ${max?.period ?? "-"} ${max?.ratio ?? "-"}`;
    })
    .join("\n");

  return `### 데이터랩 검색 트렌드\n${rows}`;
}

export function formatNaverKeywordInsights(insights: NaverKeywordInsights) {
  const warning = insights.warning ? `> ${insights.warning}\n\n` : "";
  const status =
    insights.failedSources && insights.failedSources.length > 0
      ? `### 수집 상태\n- 성공: ${["블로그", "카페글", "지역", "데이터랩"].filter((label) => !insights.failedSources?.includes(label)).join(", ") || "없음"}\n- 실패: ${insights.failures?.map((failure) => `${failure.label}(${failure.detail})`).join(", ") || insights.failedSources.join(", ")}\n\n`
      : "### 수집 상태\n- 네이버 API 수집 완료\n\n";

  return `${warning}## 네이버 API 수집 데이터

${status}

### 분석 시드 키워드
${insights.seedKeywords.map((keyword) => `- ${keyword}`).join("\n") || "- 없음"}

${summarizeSearch("블로그 검색 결과", insights.search.blog)}

${summarizeSearch("카페글 검색 결과", insights.search.cafe)}

${summarizeSearch("지역 검색 결과", insights.search.local)}

${summarizeTrend(insights.trend)}

위 데이터는 네이버 공식 API 응답을 요약한 참고 데이터다. 단, 데이터가 없거나 수집 실패한 항목은 추정으로 보완하되 실제 수집 데이터처럼 단정하지 마라.`;
}
