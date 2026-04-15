# PostgreSQL 연동 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 더미 Zustand 시드 데이터를 PostgreSQL 실제 DB로 교체하고, Express 백엔드 API를 통해 React Query로 서버 상태를 관리한다.

**Architecture:**
- 백엔드: `server/` 폴더에 Express + TypeScript + node-postgres (`pg`)
- 프론트엔드: Zustand는 UI 상태만 (`currentUserId`, `selectedProjectId`), 서버 데이터는 React Query + axios
- DB: PostgreSQL 192.168.0.199:5432, database `project_hub`
- 개발 환경: Vite proxy `/api → http://localhost:3001`

**Tech Stack:**
- Backend: Express 4, TypeScript, `pg`, `cors`, `dotenv`, `ts-node-dev`
- Frontend: axios (이미 설치), @tanstack/react-query (이미 설치)
- DB: PostgreSQL 15+

---

## 데이터베이스 스키마

### 테이블 목록

```sql
-- 사용자
users (id TEXT PK, name, email, avatar, role)

-- 프로젝트
projects (id TEXT PK, name, description, color, start_date, end_date, created_at, updated_at)
project_members (project_id → projects, user_id → users, role)
workflow_statuses (id TEXT PK, project_id → projects, label, color, "order")
tags (id TEXT PK, project_id → projects, name, color)

-- 업무
tasks (
  id TEXT PK, project_id → projects, title, description,
  status_id TEXT, priority TEXT,
  assignee_ids TEXT[], tag_ids TEXT[], blocked_by TEXT[],
  start_date, due_date, estimated_hours, logged_hours NUMERIC,
  "order" INT, parent_id TEXT,
  created_at, updated_at
)

-- 위키
wiki_pages (id TEXT PK, project_id → projects, title, content TEXT, version INT, author_id → users, updated_at)

-- 공지사항
announcements (id TEXT PK, project_id → projects, title, content TEXT, author_id → users, is_pinned BOOL, created_at)

-- 타임라인
timeline_events (id TEXT PK, type TEXT, actor_id → users, payload JSONB, project_id → projects, created_at)

-- 업무 로그
work_logs (id TEXT PK, task_id → tasks, user_id → users, hours NUMERIC, note TEXT, date DATE, created_at)

-- 파일
files (id TEXT PK, project_id → projects, name TEXT, size BIGINT, mime_type TEXT, uploader_id → users, created_at)

-- 투표
polls (
  id TEXT PK, project_id → projects, title, description TEXT,
  is_multiple BOOL, show_results_before_close BOOL,
  status TEXT, due_date DATE, author_id → users, created_at
)
poll_options (id TEXT PK, poll_id → polls, label TEXT, "order" INT)
poll_votes (poll_id → polls, option_id → poll_options, user_id → users, PRIMARY KEY(poll_id, option_id, user_id))
```

### 설계 원칙
- `assignee_ids`, `tag_ids`, `blocked_by`는 `TEXT[]`로 비정규화 (JOIN 없이 단순하게)
- `timeline_events.payload`는 `JSONB`
- `poll_votes`는 정규화된 별도 테이블 (중복 투표 방지)

---

## API 엔드포인트

모든 엔드포인트는 `/api` 프리픽스.

```
GET  /api/users

GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/tasks?projectId=
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id

GET    /api/wiki?projectId=
POST   /api/wiki
PUT    /api/wiki/:id
DELETE /api/wiki/:id

GET    /api/announcements?projectId=
POST   /api/announcements
PUT    /api/announcements/:id
DELETE /api/announcements/:id
PATCH  /api/announcements/:id/pin

GET    /api/worklogs?taskId=
POST   /api/worklogs
DELETE /api/worklogs/:id

GET    /api/files?projectId=
POST   /api/files
DELETE /api/files/:id

GET    /api/polls?projectId=
POST   /api/polls
POST   /api/polls/:id/vote
DELETE /api/polls/:id/vote
POST   /api/polls/:id/close
DELETE /api/polls/:id

GET    /api/timeline?projectId=
POST   /api/timeline

GET    /api/workflow/:projectId
PUT    /api/workflow/:projectId
```

---

## 프론트엔드 변경

### Zustand (UI 상태만)

```ts
// src/store/useUIStore.ts (기존 useAppStore.ts 대체)
interface UIState {
  currentUserId: string;
  selectedProjectId: string | null;
  setSelectedProject: (id: string) => void;
}
```

### React Query 훅 구조

```
src/
  lib/
    api.ts          # axios 인스턴스 (baseURL: /api)
    queryKeys.ts    # 쿼리 키 상수
  hooks/
    useUsers.ts
    useProjects.ts
    useTasks.ts
    useWiki.ts
    useAnnouncements.ts
    useWorkLogs.ts
    useFiles.ts
    usePolls.ts
    useTimeline.ts
```

각 훅은 `useQuery` (데이터 조회) + `useMutation` (생성/수정/삭제) 쌍으로 구성.

### 컴포넌트 변경 패턴

```ts
// Before
const projects = useAppStore(s => s.projects);
const createProject = useAppStore(s => s.createProject);

// After
const { data: projects } = useProjects();
const { mutate: createProject } = useCreateProject();
```

---

## 파일 구조

```
cmworld/
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express 앱, 포트 3001
│       ├── db.ts             # pg Pool 싱글톤
│       ├── migrate.ts        # 테이블 생성 + 시드 데이터 INSERT
│       └── routes/
│           ├── users.ts
│           ├── projects.ts
│           ├── tasks.ts
│           ├── wiki.ts
│           ├── announcements.ts
│           ├── worklogs.ts
│           ├── files.ts
│           ├── polls.ts
│           └── timeline.ts
├── src/
│   ├── store/
│   │   └── useUIStore.ts     # UI 상태만 (currentUserId, selectedProjectId)
│   ├── lib/
│   │   ├── api.ts            # axios 인스턴스
│   │   └── queryKeys.ts      # React Query 키 상수
│   └── hooks/                # React Query 훅들
├── docs/
│   └── db.md                 # DB 스키마 문서
├── .env                      # DB 접속 정보 (gitignore)
├── .env.example              # 예시 (git에 포함)
└── vite.config.ts            # /api proxy 추가
```

---

## 환경 변수

```env
# .env (gitignore)
DB_HOST=192.168.0.199
DB_PORT=5432
DB_NAME=project_hub
DB_USER=cmworld
DB_PASSWORD=12345678
```

---

## 인증 범위

이번 구현에서 로그인 기능은 포함하지 않는다. `currentUserId`는 `'u1'`로 고정하며, 추후 별도 인증 기능으로 확장한다.
