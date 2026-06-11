import {
  BarChart3,
  FilePenLine,
  FileText,
  Lightbulb,
  Search,
} from "lucide-react";

export type FeatureKey = "keyword" | "content" | "write" | "report" | "proposal";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number";
  placeholder?: string;
  required?: boolean;
};

export type FeatureConfig = {
  key: FeatureKey;
  command: string;
  label: string;
  shortLabel: string;
  description: string;
  primaryField: string;
  fields: FieldConfig[];
};

export const featureConfigs: FeatureConfig[] = [
  {
    key: "keyword",
    command: "/keyword",
    label: "키워드 리서치",
    shortLabel: "키워드",
    description: "네이버 블로그, 플레이스, 카페, 검색광고 관점의 키워드 전략을 만듭니다.",
    primaryField: "service",
    fields: [
      { name: "industry", label: "업종", placeholder: "예: 피부과, 변호사, 인테리어", required: true },
      { name: "region", label: "지역", placeholder: "예: 강남, 부산 해운대", required: true },
      { name: "service", label: "서비스", placeholder: "예: 여드름 치료, 이혼 상담", required: true },
      { name: "targetCustomer", label: "타깃 고객", placeholder: "예: 20대 직장인 여성", required: true },
      { name: "competitor", label: "경쟁사명", placeholder: "선택 입력" },
    ],
  },
  {
    key: "content",
    command: "/content",
    label: "콘텐츠 기획",
    shortLabel: "기획",
    description: "블로그 작가가 바로 사용할 수 있는 상위노출형 콘텐츠 기획서를 만듭니다.",
    primaryField: "mainKeyword",
    fields: [
      { name: "mainKeyword", label: "핵심 키워드", placeholder: "예: 강남 여드름 피부과", required: true },
      { name: "industry", label: "업종", required: true },
      { name: "region", label: "지역", required: true },
      { name: "brandTone", label: "브랜드 톤", placeholder: "예: 전문적이지만 친절한 톤", required: true },
      { name: "contentGoal", label: "콘텐츠 목적", placeholder: "예: 상담 문의 유도", required: true },
    ],
  },
  {
    key: "write",
    command: "/write",
    label: "블로그 초안 작성",
    shortLabel: "초안",
    description: "기획서를 바탕으로 네이버 블로그에 맞는 자연스러운 초안을 작성합니다.",
    primaryField: "brandTone",
    fields: [
      { name: "contentPlan", label: "콘텐츠 기획서", type: "textarea", required: true },
      { name: "brandTone", label: "브랜드 톤", placeholder: "예: 담백하고 신뢰감 있는 톤", required: true },
      { name: "wordCount", label: "글자 수", placeholder: "예: 1800자", required: true },
      { name: "bannedExpressions", label: "금지 표현", type: "textarea", placeholder: "예: 무조건, 100%, 최고, 완치, 보장" },
      { name: "requiredPoints", label: "필수 포함 내용", type: "textarea" },
    ],
  },
  {
    key: "report",
    command: "/report",
    label: "월간 보고서 작성",
    shortLabel: "보고서",
    description: "고객사에게 보낼 수 있는 월간 성과 보고서와 내부 메모를 작성합니다.",
    primaryField: "clientName",
    fields: [
      { name: "clientName", label: "고객사명", required: true },
      { name: "industry", label: "업종", required: true },
      { name: "workSummary", label: "이번 달 작업 내역", type: "textarea", required: true },
      { name: "blogCount", label: "블로그 발행 수", placeholder: "예: 12건" },
      { name: "views", label: "조회수", placeholder: "예: 8,500회" },
      { name: "inflowKeywords", label: "유입 키워드", type: "textarea" },
      { name: "leadCount", label: "문의 수", placeholder: "예: 23건" },
      { name: "monthChange", label: "전월 대비 변화", type: "textarea" },
      { name: "issues", label: "이슈", type: "textarea" },
      { name: "nextPlan", label: "다음 달 계획", type: "textarea", required: true },
    ],
  },
  {
    key: "proposal",
    command: "/proposal",
    label: "영업 제안서 작성",
    shortLabel: "제안서",
    description: "미팅 전후에 바로 활용 가능한 네이버 마케팅 제안서 초안을 만듭니다.",
    primaryField: "service",
    fields: [
      { name: "industry", label: "업종", required: true },
      { name: "region", label: "지역", required: true },
      { name: "service", label: "서비스", required: true },
      { name: "currentProblem", label: "현재 고민", type: "textarea", required: true },
      { name: "goal", label: "목표", type: "textarea", required: true },
      { name: "budget", label: "예산 범위", placeholder: "예: 월 200만~300만원" },
      { name: "competitors", label: "경쟁사", type: "textarea" },
      { name: "proposalPeriod", label: "제안 기간", placeholder: "예: 3개월", required: true },
    ],
  },
];

export const featureIcons = {
  keyword: Search,
  content: Lightbulb,
  write: FilePenLine,
  report: BarChart3,
  proposal: FileText,
};

export function getFeatureConfig(key: FeatureKey) {
  return featureConfigs.find((feature) => feature.key === key);
}
