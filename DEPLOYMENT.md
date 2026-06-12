# Deployment

이 프로젝트는 `agency-os`와 연결하지 않는 독립 앱으로 배포합니다.

## 1. Supabase

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/migrations/001_ai_director_outputs.sql` 내용을 실행합니다.
3. Project Settings에서 아래 값을 확인합니다.
   - Project URL
   - anon public key
   - service role key

앱 서버 route가 `SUPABASE_SERVICE_ROLE_KEY`로 결과물을 저장합니다.
이 키는 Vercel 환경변수에만 넣고 브라우저에 노출하지 않습니다.

## 2. GitHub

`agency-os`는 아래 저장소를 사용 중입니다.

```text
https://github.com/dadream00/Sunhan_marketing.git
```

이 앱은 기존 저장소와 연결하지 않습니다. 같은 GitHub 계정을 사용하더라도 새 독립 저장소를 만듭니다.

권장 새 저장소:

```text
https://github.com/dadream00/ai-strategy-director.git
```

GitHub에서 새 독립 저장소를 만든 뒤 아래 명령을 실행합니다.

```powershell
git remote add origin https://github.com/dadream00/ai-strategy-director.git
git branch -M main
git push -u origin main
```

## 3. Vercel

`agency-os`는 Vercel 프로젝트명으로 `sunhan-marketing`을 사용하도록 기록되어 있습니다.

이 앱은 기존 Vercel 프로젝트와 연결하지 않습니다. 새 Vercel 프로젝트를 만들고 GitHub의 새 저장소만 연결합니다.

권장 새 Vercel 프로젝트명:

```text
ai-strategy-director
```

Vercel에서 새 프로젝트를 만들고 GitHub 저장소를 연결합니다.

환경변수:

```text
OPENAI_API_KEY
OPENAI_MODEL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
NAVER_SEARCH_CLIENT_ID
NAVER_SEARCH_CLIENT_SECRET
NAVER_DATALAB_CLIENT_ID
NAVER_DATALAB_CLIENT_SECRET
```

`NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET` 하나의 앱에 `검색`과 `데이터랩(검색어트렌드)` 권한이 모두 있으면 추가 키는 생략해도 됩니다.

검색 API와 데이터랩 API를 서로 다른 네이버 앱에서 발급했다면 아래처럼 분리해서 등록합니다.

```text
NAVER_SEARCH_CLIENT_ID
NAVER_SEARCH_CLIENT_SECRET
NAVER_DATALAB_CLIENT_ID
NAVER_DATALAB_CLIENT_SECRET
```

권장 값:

```text
OPENAI_MODEL=gpt-4.1-mini
```

## 4. CLI 배포

Vercel CLI 로그인이 가능한 환경에서는 아래 명령을 사용합니다.

```powershell
npx vercel
npx vercel --prod
```

현재 Codex 실행 환경에서는 Vercel 자격증명이 없고, 로그인 플로우가 로컬 사용자명 인코딩 문제로 막힐 수 있습니다. 이 경우 Vercel 웹 콘솔에서 GitHub 저장소를 연결하는 방식이 더 안정적입니다.
