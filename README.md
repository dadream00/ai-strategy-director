# AI 전략실장

네이버 중심 마케팅 대행사용 AI 업무 자동화 MVP입니다.

이 프로젝트는 `agency-os` 관리툴과 연결하지 않는 독립 프로젝트입니다. 나중에 통합하기 쉽게 Next.js API route, React UI, Supabase 저장 구조로 분리했습니다.

## 기능

- `/keyword` 키워드 리서치
- `/content` 콘텐츠 기획
- `/write` 블로그 초안 작성
- `/report` 월간 보고서 작성
- `/proposal` 영업 제안서 작성

`/keyword`는 선택적으로 네이버 공식 API 데이터를 함께 사용합니다.

- 네이버 블로그 검색
- 네이버 카페글 검색
- 네이버 지역 검색
- 네이버 데이터랩 검색어 트렌드

## 구조

```text
ai-strategy-director/
├── src/app/api/generate/route.ts
├── src/app/api/outputs/route.ts
├── src/app/api/outputs/[id]/route.ts
├── src/components/AiDirectorApp.tsx
├── src/lib/features.ts
├── src/lib/prompts.ts
├── src/lib/supabase.ts
├── supabase/migrations/001_ai_director_outputs.sql
├── vercel.json
└── .env.example
```

## 로컬 실행

```powershell
npm.cmd install
copy .env.example .env
notepad .env
npm.cmd run dev
```

`.env`에 아래 값을 입력합니다.

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
```

## Supabase 설정

Supabase SQL Editor에서 아래 파일의 SQL을 실행합니다.

```text
supabase/migrations/001_ai_director_outputs.sql
```

결과물은 `public.ai_director_outputs` 테이블에 저장됩니다.

## Vercel 배포

Vercel 프로젝트 환경변수에 `.env.example`과 같은 키를 등록합니다.

```powershell
npm.cmd run build
vercel
vercel --prod
```

## GitHub

독립 저장소로 관리합니다. `agency-os` 저장소와 연결하지 않습니다.

```powershell
git init
git add .
git commit -m "Create standalone AI strategy director"
```
