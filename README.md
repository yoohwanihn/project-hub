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

ProjectHub는 칸반 보드, 간트 차트, 파일 공유, 위키, 투표, 팀 메일 등 팀 협업에 필요한 모든 도구를 통합한 웹 플랫폼입니다.
복잡한 툴 없이도 프로젝트의 시작부터 완료까지 한 화면에서 관리할 수 있습니다.

---

## 주요 기능

### 대시보드
| 기능 | 설명 |
|---|---|
| 📊 **개인화 통계** | 내 진행 중 업무 / 내 지연 업무 / 이번 주 완료 / 참여 프로젝트 수 |
| 📈 **주간 활동 차트** | 내 일별 완료 업무 수 (7일 막대 차트, 오늘 강조) |
| 🍩 **업무 상태 분포** | 전체 업무 기준 상태별 도넛 차트 |
| 🎯 **우선순위 분포** | 내 미완료 업무 기준 우선순위 바 차트 |
| 📅 **다가오는 마감** | 7일 이내 내 배정 업무, 오늘 마감 강조 표시 |
| 🔥 **번다운 차트** | 전체 프로젝트 잔여 업무 추이 (14일) |

### 업무 관리
| 기능 | 설명 |
|---|---|
| 🗂 **칸반 보드** | 드래그 앤 드롭으로 업무 상태 관리, 담당자별 수영레인 워크로드 표시 |
| 📅 **간트 차트** | 545일 고정 캔버스 스크롤, 마우스 드래그 좌우 패닝, 업무 바 드래그로 일정 조정, 선후행 관계 화살표 시각화 |
| ✅ **내 업무** | 마감일 기준으로 그룹화된 나의 담당 업무 한눈에 보기 |
| 🔢 **우선순위 관리** | 긴급/높음/보통/낮음 4단계 우선순위 지원 |

### 팀 소통
| 기능 | 설명 |
|---|---|
| 📣 **공지사항** | 중요 공지 핀 고정 + 접기/펼치기 |
| 🗳 **투표** | 팀 의사결정을 위한 객관식 투표 |
| 📖 **위키** | 마크다운 에디터 + 실시간 분할 미리보기, 버전 이력 |
| 🔔 **알림** | 업무 변경, 공지 등 실시간 알림 |

### 메일
| 기능 | 설명 |
|---|---|
| 📬 **IMAP 수신** | Daum 메일 IMAP 연동, 폴더별 메일 목록 조회 |
| 📨 **SMTP 발신** | 메일 작성 및 파일 첨부 발송 (최대 25MB) |
| 📎 **첨부파일** | 수신 메일 첨부파일 다운로드, 인라인 이미지 자동 필터링 |
| 🗑 **대량 삭제** | 체크박스 다중 선택 후 일괄 삭제 |
| 🔑 **앱 비밀번호** | Daum 메일 IMAP 앱 비밀번호 설정 가이드 내장 |

### 프로젝트 관리
| 기능 | 설명 |
|---|---|
| 📁 **파일 보관함** | 드래그 앤 드롭 업로드, 그리드/목록 보기 전환 |
| 📊 **자원 관리** | 멤버별 업무 부하 및 시간 추적 |
| ⏱ **타임라인** | 프로젝트 활동 피드 |
| 🔐 **권한 관리** | Owner / Admin / Member / Viewer 역할별 접근 제어 |
| 👥 **관리자 패널** | 신규 가입 승인 및 역할 관리 |

### UX / 운영
| 기능 | 설명 |
|---|---|
| 🍞 **토스트 알림** | 우측 상단 고정, 5초 노출, 모든 액션 즉각 피드백 |
| 💀 **스켈레톤 로딩** | 데이터 로딩 중 자연스러운 플레이스홀더 |
| 🔍 **404 페이지** | 잘못된 URL 진입 시 친절한 안내 |
| 📋 **구조화 로그** | pino 기반 JSON 구조화 서버 로그 (requestId, 응답 시간, 사용자 정보 포함) |

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
# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_hub
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_ACCESS_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m

# 로그 레벨 (trace | debug | info | warn | error) — 기본값: info
LOG_LEVEL=info
```

> **메일 기능 사용 시**: Daum 메일 계정의 IMAP 앱 비밀번호를 발급하여 앱 내 메일 연결 화면에서 직접 입력합니다. 서버 환경변수 설정 불필요.

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
ImapFlow (IMAP 클라이언트)  ·  nodemailer (SMTP 발신)  ·  mailparser (MIME 디코딩)
pino (구조화 JSON 로그)
```

---

## 프로젝트 구조

```
project-hub/
├── src/                        # 프론트엔드
│   ├── components/
│   │   ├── layout/             # AppLayout, Header, Sidebar
│   │   ├── ui/                 # Avatar, Modal, Toast, Skeleton, Badge, ...
│   │   ├── tasks/              # TaskModal
│   │   └── projects/           # ProjectModal
│   ├── pages/
│   │   ├── dashboard/          # 개인화 대시보드 (통계, 차트, 마감 위젯)
│   │   ├── kanban/             # 칸반 보드 (수영레인 포함)
│   │   ├── gantt/              # 간트 차트 (드래그 일정 조정, 선후행 화살표)
│   │   ├── mail/               # 메일 (IMAP 수신 + SMTP 발신)
│   │   ├── mytasks/            # 내 업무
│   │   ├── wiki/               # 위키 (마크다운 에디터)
│   │   ├── announcements/      # 공지사항
│   │   ├── files/              # 파일 보관함
│   │   ├── resources/          # 자원 관리
│   │   ├── polls/              # 투표
│   │   ├── timeline/           # 타임라인
│   │   ├── settings/           # 프로필 설정
│   │   ├── admin/              # 관리자 패널
│   │   └── errors/             # 404 페이지
│   ├── store/                  # Zustand 스토어
│   ├── hooks/                  # 커스텀 훅 (usePermission 등)
│   └── lib/                    # API 클라이언트, 유틸리티
│
├── server/src/                 # 백엔드
│   ├── routes/                 # API 라우트 (auth, projects, tasks, mail, admin, ...)
│   ├── middleware/             # 인증 미들웨어, 요청 로거 (requestId 포함)
│   ├── logger.ts               # pino JSON 구조화 로그
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
| POST | `/api/auth/me/avatar` | 프로필 이미지 업로드 |
| DELETE | `/api/auth/me` | 회원 탈퇴 |

</details>

<details>
<summary>프로젝트 / 업무</summary>

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/projects` | 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 생성 |
| PATCH | `/api/projects/:id` | 프로젝트 수정 |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 |
| PUT | `/api/projects/:id/workflow` | 워크플로우(상태) 수정 |
| GET | `/api/projects/:id/tasks` | 업무 목록 |
| POST | `/api/projects/:id/tasks` | 업무 생성 |
| PATCH | `/api/tasks/:id` | 업무 수정 |
| DELETE | `/api/tasks/:id` | 업무 삭제 |
| POST | `/api/projects/:id/tasks/move` | 업무 상태 이동 |

</details>

<details>
<summary>메일</summary>

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/mail/connect` | IMAP 연결 (Daum 메일 앱 비밀번호) |
| POST | `/api/mail/disconnect` | IMAP 연결 해제 |
| GET | `/api/mail/status` | 연결 상태 확인 |
| GET | `/api/mail/folders` | 폴더 목록 조회 |
| GET | `/api/mail/messages` | 메일 목록 조회 |
| GET | `/api/mail/messages/:uid` | 메일 상세 조회 (첨부파일 포함) |
| POST | `/api/mail/send` | 메일 발송 (파일 첨부 multipart/form-data) |
| DELETE | `/api/mail/messages/:uid` | 메일 단건 삭제 |
| DELETE | `/api/mail/messages` | 메일 일괄 삭제 (uid 배열) |

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
| POST | `/api/projects/:id/wiki` | 위키 페이지 생성 |
| PATCH | `/api/wiki/:id` | 위키 페이지 수정 |
| DELETE | `/api/wiki/:id` | 위키 페이지 삭제 |
| GET | `/api/projects/:id/announcements` | 공지사항 목록 |
| GET | `/api/projects/:id/polls` | 투표 목록 |

</details>

<details>
<summary>관리자</summary>

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/admin/users` | 전체 사용자 목록 |
| PATCH | `/api/admin/users/:id/approve` | 회원 가입 승인 |
| PATCH | `/api/admin/users/:id/reject` | 회원 가입 거절 |
| PATCH | `/api/admin/users/:id/role` | 역할 변경 |

</details>

---

## 브랜치 전략

```
main          ─── 배포 브랜치 (PR을 통해서만 머지)
develop       ─── 통합 개발 브랜치
feature/OP-N  ─── 신규 기능 개발 (→ develop PR)
fix/OP-N      ─── 버그 수정 / 개선 (→ develop PR)
release/vX.Y  ─── 릴리즈 준비 브랜치
hotfix/OP-N   ─── 프로덕션 긴급 패치 (→ main 직접 PR)
```

커밋 메시지는 `feat(OP-N):`, `fix(OP-N):`, `chore:`, `docs:` 형식을 따릅니다.

---

## 라이선스

MIT © 2025 [yoohwanihn](https://github.com/yoohwanihn)
