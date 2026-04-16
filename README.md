# Project Hub — 스마트 프로젝트 협업 관리 시스템

팀의 모든 업무를 한 곳에서 관리하는 통합 협업 플랫폼입니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| **칸반 보드** | 드래그 앤 드롭으로 업무 상태 관리 |
| **간트 차트** | 프로젝트 일정 시각화 |
| **파일 보관함** | 파일 업로드/다운로드 (실제 저장) |
| **위키** | 팀 지식 베이스 문서 관리 |
| **공지사항** | 중요 공지 핀 고정 기능 |
| **타임라인** | 프로젝트 활동 피드 (DB 연동) |
| **투표** | 팀 의사결정 투표 기능 |
| **권한 관리** | 역할별 접근 제어 (owner/admin/member/viewer) |
| **관리자 패널** | 사용자 승인 및 역할 관리 |

---

## 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- **PostgreSQL** 14 이상
- npm 8 이상

### 설치

```bash
# 1. 저장소 클론
git clone <repo-url>
cd cmworld

# 2. 의존성 설치 (루트 + 서버 한 번에)
npm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일을 열어 DB 연결 정보와 JWT 시크릿 입력
```

### 환경변수 (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_hub
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_ACCESS_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
```

### DB 초기화

```bash
# 테이블 생성
npm run migrate

# 샘플 데이터 삽입
npm run seed
```

### 실행

```bash
# 개발 서버 (프론트엔드 + 백엔드 동시 실행)
npm run dev
```

| 서비스 | 주소 |
|--------|------|
| 프론트엔드 | http://localhost:3000 |
| 백엔드 API | http://localhost:3001 |

---

## 기본 계정 (시드 데이터)

| 이름 | 이메일 | 비밀번호 | 역할 |
|------|--------|----------|------|
| 유환인 | yoohwanihn@cmworld.co.kr | 12345678 | owner |
| 김민준 | minjun.kim@cmworld.co.kr | 12345678 | admin |
| 이서연 | seoyeon.lee@cmworld.co.kr | 12345678 | member |
| 박지호 | jiho.park@cmworld.co.kr | 12345678 | member |
| 최수아 | sua.choi@cmworld.co.kr | 12345678 | viewer |

> **신규 가입 시** 관리자 승인이 필요합니다. owner/admin 계정으로 로그인 후 관리자 패널에서 승인할 수 있습니다.

---

## 기술 스택

**프론트엔드**
- React 18 + TypeScript
- Vite (빌드 도구)
- Zustand (상태 관리)
- TanStack Query
- Tailwind CSS
- @dnd-kit (드래그 앤 드롭)

**백엔드**
- Node.js + Express
- TypeScript (tsx)
- PostgreSQL + pg
- JWT (Access Token 15분 + Refresh Token 30일)
- bcrypt (비밀번호 해싱)
- multer (파일 업로드)

---

## 프로젝트 구조

```
cmworld/
├── src/                    # 프론트엔드 소스
│   ├── components/         # 공통 컴포넌트
│   ├── pages/              # 페이지 컴포넌트
│   ├── store/              # Zustand 스토어
│   ├── hooks/              # 커스텀 훅
│   └── lib/                # 유틸리티
├── server/                 # 백엔드 소스
│   └── src/
│       ├── routes/         # API 라우트
│       ├── middleware/     # 인증 미들웨어
│       ├── migrate.ts      # DB 마이그레이션
│       └── seed-db.ts      # 시드 데이터
└── uploads/                # 업로드된 파일 저장 경로
```

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/logout` | 로그아웃 |
| DELETE | `/api/auth/me` | 회원 탈퇴 |
| GET | `/api/projects` | 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 생성 |
| GET | `/api/projects/:id/tasks` | 태스크 목록 |
| POST | `/api/projects/:id/files` | 파일 업로드 |
| GET | `/api/files/:id/download` | 파일 다운로드 |
| GET | `/api/projects/:id/timeline` | 타임라인 |
