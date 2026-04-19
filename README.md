<div align="center">

# ⚡ ProjectHub

**팀의 모든 업무를 한 곳에서 — 스마트 프로젝트 협업 플랫폼**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 소개

ProjectHub는 칸반 보드, 간트 차트, 파일 공유, 위키, 투표 등 팀 협업에 필요한 모든 도구를 통합한 웹 플랫폼입니다.
복잡한 툴 없이도 프로젝트의 시작부터 완료까지 한 화면에서 관리할 수 있습니다.

---

## 주요 기능

### 업무 관리
| 기능 | 설명 |
|---|---|
| 🗂 **칸반 보드** | 드래그 앤 드롭으로 업무 상태 관리, 담당자별 워크로드 표시 |
| 📅 **간트 차트** | 일정 시각화 + 마우스 드래그로 차트 좌우 스크롤 |
| ✅ **내 업무** | 마감일 기준으로 그룹화된 나의 담당 업무 한눈에 보기 |
| 🔢 **우선순위 관리** | 긴급/높음/보통/낮음 4단계 우선순위 지원 |

### 팀 소통
| 기능 | 설명 |
|---|---|
| 📣 **공지사항** | 중요 공지 핀 고정 + 접기/펼치기 |
| 🗳 **투표** | 팀 의사결정을 위한 객관식 투표 |
| 📖 **위키** | 마크다운 기반 팀 지식 베이스 |
| 🔔 **알림** | 업무 변경, 공지 등 실시간 알림 |

### 프로젝트 관리
| 기능 | 설명 |
|---|---|
| 📁 **파일 보관함** | 드래그 앤 드롭 업로드, 그리드/목록 보기 전환 |
| 📊 **자원 관리** | 멤버별 업무 부하 및 시간 추적 |
| ⏱ **타임라인** | 프로젝트 활동 피드 |
| 🔐 **권한 관리** | Owner / Admin / Member / Viewer 역할별 접근 제어 |
| 👥 **관리자 패널** | 신규 가입 승인 및 역할 관리 |

### UX 개선
| 기능 | 설명 |
|---|---|
| 🍞 **토스트 알림** | 업무 생성/삭제 등 모든 액션의 즉각적인 피드백 |
| 💀 **스켈레톤 로딩** | 데이터 로딩 중 자연스러운 플레이스홀더 |
| 🔍 **404 페이지** | 잘못된 URL 진입 시 친절한 안내 |

---

## 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- **PostgreSQL** 14 이상

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/yoohwanihn/project-hub.git
cd project-hub

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일을 열어 DB 연결 정보와 JWT 시크릿 입력
```

### 환경변수 (`.env`)

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

# 샘플 데이터 삽입 (계정 5개 + 프로젝트 4개 + 풍부한 테스트 데이터)
npm run seed
```

### 실행

```bash
# 개발 서버 (프론트엔드 + 백엔드 동시)
npm run dev
```

| 서비스 | 주소 |
|---|---|
| 프론트엔드 | http://localhost:3000 |
| 백엔드 API | http://localhost:3001 |

---

## 기본 계정 (시드 데이터)

| 이름 | 이메일 | 비밀번호 | 역할 |
|---|---|---|---|
| 유환인 | yoohwanihn@cmworld.co.kr | 12345678 | 👑 Owner |
| 김민준 | minjun.kim@cmworld.co.kr | 12345678 | 🛡 Admin |
| 이서연 | seoyeon.lee@cmworld.co.kr | 12345678 | 👤 Member |
| 박지호 | jiho.park@cmworld.co.kr | 12345678 | 👤 Member |
| 최수아 | sua.choi@cmworld.co.kr | 12345678 | 👁 Viewer |

> **신규 가입 시** 관리자 승인이 필요합니다. Owner/Admin 계정으로 로그인 후 **관리자 패널**에서 승인하세요.

---

## 기술 스택

**Frontend**
```
React 18 + TypeScript  ·  Vite  ·  Zustand  ·  Tailwind CSS
TanStack Query  ·  @dnd-kit  ·  React Router v6  ·  Lucide Icons
```

**Backend**
```
Node.js + Express + TypeScript
PostgreSQL  ·  JWT (Access 15m + Refresh 30d)  ·  bcryptjs  ·  multer
```

---

## 프로젝트 구조

```
project-hub/
├── src/                        # 프론트엔드
│   ├── components/
│   │   ├── layout/             # AppLayout, Header, Sidebar
│   │   ├── ui/                 # Avatar, Modal, Toast, Skeleton, ...
│   │   ├── tasks/              # TaskModal
│   │   └── projects/           # ProjectModal
│   ├── pages/
│   │   ├── dashboard/          # 대시보드
│   │   ├── kanban/             # 칸반 보드
│   │   ├── gantt/              # 간트 차트
│   │   ├── mytasks/            # 내 업무
│   │   ├── wiki/               # 위키
│   │   ├── announcements/      # 공지사항
│   │   ├── files/              # 파일 보관함
│   │   ├── resources/          # 자원 관리
│   │   ├── polls/              # 투표
│   │   ├── timeline/           # 타임라인
│   │   ├── settings/           # 프로필 설정
│   │   ├── admin/              # 관리자 패널
│   │   └── errors/             # 404 페이지
│   ├── store/                  # Zustand 스토어
│   ├── hooks/                  # 커스텀 훅
│   └── lib/                    # API, 유틸리티
│
├── server/src/                 # 백엔드
│   ├── routes/                 # API 라우트
│   ├── middleware/             # 인증 미들웨어
│   ├── migrate.ts              # DB 마이그레이션
│   └── seed-db.ts              # 시드 데이터
│
└── uploads/                    # 업로드 파일 저장 경로
```

---

## API 엔드포인트

<details>
<summary>인증</summary>

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/refresh` | 토큰 갱신 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 내 정보 조회 |
| PATCH | `/api/auth/me` | 프로필 수정 |
| DELETE | `/api/auth/me` | 회원 탈퇴 |

</details>

<details>
<summary>프로젝트 / 업무</summary>

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/projects` | 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 생성 |
| GET | `/api/projects/:id/tasks` | 업무 목록 |
| POST | `/api/projects/:id/tasks` | 업무 생성 |
| PATCH | `/api/tasks/:id` | 업무 수정 |
| DELETE | `/api/tasks/:id` | 업무 삭제 |
| POST | `/api/projects/:id/tasks/move` | 업무 상태 이동 |

</details>

<details>
<summary>파일 / 기타</summary>

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/projects/:id/files` | 파일 업로드 |
| GET | `/api/files/:id/download` | 파일 다운로드 |
| DELETE | `/api/files/:id` | 파일 삭제 |
| GET | `/api/projects/:id/timeline` | 타임라인 |
| GET | `/api/projects/:id/wiki` | 위키 목록 |
| GET | `/api/projects/:id/announcements` | 공지사항 목록 |
| GET | `/api/projects/:id/polls` | 투표 목록 |

</details>

---

## 브랜치 전략

```
main          ─── 배포 브랜치
feature/OP-N  ─── 기능 개발 (PR → main)
fix/OP-N      ─── 버그 수정
hotfix/OP-N   ─── 긴급 패치
```

커밋 메시지는 `feat(OP-N):`, `fix(OP-N):`, `chore:` 형식을 따릅니다.

---

## 라이선스

MIT © 2025 [yoohwanihn](https://github.com/yoohwanihn)
