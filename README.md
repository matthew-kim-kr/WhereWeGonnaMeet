# 우리 어디서 만날까? 🗺️

n명의 출발역을 입력하면 모두가 이동하기 가장 편한 최적의 중간 지하철역을 추천해주는 서비스.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **지하철 경로 API**: ODsay API
- **주변 장소 API**: Google Places API
- **Hosting**: Vercel

## 환경 재현 방법

### 1. Node.js 설치 (nvm 사용 권장)

```bash
# nvm 설치 (Homebrew)
brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

# 프로젝트 Node 버전 설치 (.nvmrc 기준)
nvm install
nvm use
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local 파일에 API 키 입력
```

| 변수명 | 발급처 | 용도 |
|--------|--------|------|
| `ODSAY_API_KEY` | [lab.odsay.com](https://lab.odsay.com/) | 지하철 경로/소요 시간 |
| `GOOGLE_PLACES_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) | 주변 장소 추천 |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | 위와 동일 | 클라이언트 사이드 호출 |

### 4. 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

## 스크립트

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint 검사
```

## 프로젝트 구조

```
src/
├── app/          # Next.js App Router 페이지
├── components/   # 재사용 UI 컴포넌트
├── lib/          # API 연동, 유틸리티 함수
├── data/         # 수도권 역 정보 정적 데이터
└── types/        # TypeScript 타입 정의
```
