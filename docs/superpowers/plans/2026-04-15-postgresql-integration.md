# PostgreSQL 연동 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 더미 Zustand 시드 데이터를 PostgreSQL 실제 DB로 교체하고, Express 백엔드 API를 통해 React Query로 서버 상태를 관리한다.

**Architecture:** `server/` 폴더에 Express + TypeScript + `pg` 백엔드(포트 3001). 프론트엔드는 Zustand를 UI 상태(`currentUserId`, `selectedProjectId`)만으로 축소하고, 모든 서버 데이터는 React Query + axios로 관리. Vite dev-proxy `/api → http://localhost:3001`.

**Tech Stack:** Express 4, TypeScript, `pg`, `cors`, `dotenv`, `ts-node-dev` / axios, @tanstack/react-query (이미 설치됨)

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
│       ├── migrate.ts        # CREATE TABLE SQL (CLI: npx ts-node src/migrate.ts)
│       ├── seed-db.ts        # INSERT seed data (CLI: npx ts-node src/seed-db.ts)
│       └── routes/
│           ├── users.ts
│           ├── projects.ts   # project CRUD + /workflow/:id
│           ├── tasks.ts
│           ├── wiki.ts
│           ├── announcements.ts
│           ├── worklogs.ts
│           ├── files.ts
│           ├── polls.ts
│           └── timeline.ts
├── src/
│   ├── store/
│   │   └── useUIStore.ts     # 신규: UI 상태만 (currentUserId, selectedProjectId)
│   ├── lib/
│   │   ├── api.ts            # axios 인스턴스
│   │   └── queryKeys.ts      # React Query 키 상수
│   └── hooks/
│       ├── useUsers.ts
│       ├── useProjects.ts
│       ├── useTasks.ts
│       ├── useWiki.ts
│       ├── useAnnouncements.ts
│       ├── useWorkLogs.ts
│       ├── useFiles.ts
│       ├── usePolls.ts
│       └── useTimeline.ts
├── .env                      # gitignore
├── .env.example
└── vite.config.ts            # /api proxy 추가
```

**삭제 예정:**
- `src/store/useAppStore.ts`
- `src/data/seed.ts`

---

## Task 1: Git 브랜치 생성

**Files:**
- (없음 — git only)

- [ ] **Step 1: feature 브랜치 생성 후 push**

```bash
cd /mnt/c/cmworld
git checkout -b feature/postgresql-integration
git push -u origin feature/postgresql-integration
```

Expected: `Branch 'feature/postgresql-integration' set up to track remote branch`

---

## Task 2: 환경 변수 설정

**Files:**
- Create: `.env`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: `.env` 생성 (gitignore됨)**

```bash
cat > /mnt/c/cmworld/.env << 'EOF'
DB_HOST=192.168.0.199
DB_PORT=5432
DB_NAME=project_hub
DB_USER=cmworld
DB_PASSWORD=12345678
EOF
```

- [ ] **Step 2: `.env.example` 생성 (git에 포함)**

```bash
cat > /mnt/c/cmworld/.env.example << 'EOF'
DB_HOST=your_host
DB_PORT=your_port
DB_NAME=project_hub
DB_USER=your_db_user
DB_PASSWORD=your_db_password
EOF
```

- [ ] **Step 3: `.gitignore`에 `.env` 추가 확인**

```bash
grep -q "^\.env$" /mnt/c/cmworld/.gitignore || echo ".env" >> /mnt/c/cmworld/.gitignore
```

- [ ] **Step 4: 커밋**

```bash
cd /mnt/c/cmworld
git add .env.example .gitignore
git commit -m "chore: add .env.example and gitignore .env"
```

---

## Task 3: 서버 프로젝트 초기화

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`

- [ ] **Step 1: `server/package.json` 생성**

```json
{
  "name": "cmworld-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "migrate": "ts-node src/migrate.ts",
    "seed": "ts-node src/seed-db.ts"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "@types/pg": "^8.11.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: `server/tsconfig.json` 생성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 의존성 설치**

```bash
cd /mnt/c/cmworld/server
npm install
```

Expected: `added N packages`

- [ ] **Step 4: `server/src/` 디렉토리 생성**

```bash
mkdir -p /mnt/c/cmworld/server/src/routes
```

---

## Task 4: DB 연결 풀 (server/src/db.ts)

**Files:**
- Create: `server/src/db.ts`

- [ ] **Step 1: `server/src/db.ts` 작성**

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const db = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

db.on('error', (err) => {
  console.error('DB pool error:', err);
});
```

- [ ] **Step 2: DB 연결 테스트**

```bash
cd /mnt/c/cmworld/server
npx ts-node -e "import('./src/db').then(({db}) => db.query('SELECT 1').then(() => { console.log('DB OK'); db.end(); }))"
```

Expected: `DB OK`

---

## Task 5: DB 스키마 마이그레이션 (server/src/migrate.ts)

**Files:**
- Create: `server/src/migrate.ts`

- [ ] **Step 1: `server/src/migrate.ts` 작성**

```typescript
import { db } from './db';

const SQL = `
-- users
CREATE TABLE IF NOT EXISTS users (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  role  TEXT NOT NULL
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- project_members
CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       TEXT NOT NULL,
  PRIMARY KEY (project_id, user_id)
);

-- workflow_statuses
CREATE TABLE IF NOT EXISTS workflow_statuses (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL,
  "order"    INT  NOT NULL
);

-- tags
CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL
);

-- tasks
CREATE TABLE IF NOT EXISTS tasks (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  status_id        TEXT NOT NULL,
  priority         TEXT NOT NULL,
  assignee_ids     TEXT[] DEFAULT '{}',
  tag_ids          TEXT[] DEFAULT '{}',
  blocked_by       TEXT[] DEFAULT '{}',
  start_date       DATE,
  due_date         DATE,
  estimated_hours  NUMERIC(6,2),
  logged_hours     NUMERIC(6,2) DEFAULT 0,
  "order"          INT  NOT NULL DEFAULT 0,
  parent_id        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- wiki_pages
CREATE TABLE IF NOT EXISTS wiki_pages (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  version    INT  NOT NULL DEFAULT 1,
  author_id  TEXT REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- announcements
CREATE TABLE IF NOT EXISTS announcements (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  author_id  TEXT REFERENCES users(id),
  is_pinned  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- timeline_events
CREATE TABLE IF NOT EXISTS timeline_events (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  actor_id   TEXT REFERENCES users(id),
  payload    JSONB DEFAULT '{}',
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_logs
CREATE TABLE IF NOT EXISTS work_logs (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id),
  hours      NUMERIC(4,2) NOT NULL,
  note       TEXT,
  date       DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- files
CREATE TABLE IF NOT EXISTS files (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  size        BIGINT NOT NULL,
  mime_type   TEXT NOT NULL,
  uploader_id TEXT REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- polls
CREATE TABLE IF NOT EXISTS polls (
  id                        TEXT PRIMARY KEY,
  project_id                TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  description               TEXT,
  is_multiple               BOOLEAN NOT NULL DEFAULT false,
  show_results_before_close BOOLEAN NOT NULL DEFAULT true,
  status                    TEXT NOT NULL DEFAULT 'active',
  due_date                  DATE,
  author_id                 TEXT REFERENCES users(id),
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- poll_options
CREATE TABLE IF NOT EXISTS poll_options (
  id      TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label   TEXT NOT NULL,
  "order" INT  NOT NULL
);

-- poll_votes
CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id   TEXT NOT NULL REFERENCES polls(id)         ON DELETE CASCADE,
  option_id TEXT NOT NULL REFERENCES poll_options(id)  ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id),
  PRIMARY KEY (poll_id, option_id, user_id)
);
`;

async function migrate() {
  console.log('Running migration...');
  await db.query(SQL);
  console.log('Migration complete.');
  await db.end();
}

migrate().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: 마이그레이션 실행**

```bash
cd /mnt/c/cmworld/server
npm run migrate
```

Expected: `Migration complete.`

---

## Task 6: 시드 데이터 INSERT (server/src/seed-db.ts)

**Files:**
- Create: `server/src/seed-db.ts`

- [ ] **Step 1: `server/src/seed-db.ts` 작성**

```typescript
import { db } from './db';

async function seed() {
  console.log('Seeding...');

  // users
  await db.query(`
    INSERT INTO users (id, name, email, role) VALUES
      ('u1','유환인','yoohwanihn@cmworld.co.kr','owner'),
      ('u2','김민준','minjun.kim@cmworld.co.kr','admin'),
      ('u3','이서연','seoyeon.lee@cmworld.co.kr','member'),
      ('u4','박지호','jiho.park@cmworld.co.kr','member'),
      ('u5','최수아','sua.choi@cmworld.co.kr','viewer')
    ON CONFLICT (id) DO NOTHING
  `);

  // projects
  await db.query(`
    INSERT INTO projects (id, name, description, color, start_date, end_date, created_at, updated_at) VALUES
      ('p1','차세대 프로젝트 허브','전사 업무 통합 협업 플랫폼 구축','#3b82f6','2026-03-01','2026-05-31','2026-03-01T09:00:00Z','2026-04-13T09:00:00Z'),
      ('p2','모바일 앱 리뉴얼','iOS / Android 앱 UI/UX 전면 개편','#8b5cf6','2026-02-01','2026-04-30','2026-02-01T09:00:00Z','2026-04-12T17:30:00Z'),
      ('p3','API 게이트웨이 고도화','마이크로서비스 간 API 통합 및 성능 개선','#10b981','2026-04-01','2026-06-30','2026-04-01T09:00:00Z','2026-04-10T14:00:00Z'),
      ('p4','데이터 분석 대시보드','BI 대시보드 신규 구축 및 리포트 자동화','#f59e0b','2026-01-15','2026-04-15','2026-01-15T09:00:00Z','2026-04-13T11:20:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // project_members
  await db.query(`
    INSERT INTO project_members (project_id, user_id, role) VALUES
      ('p1','u1','owner'),('p1','u2','admin'),('p1','u3','member'),('p1','u4','member'),
      ('p2','u2','owner'),('p2','u3','member'),('p2','u4','member'),('p2','u5','viewer'),
      ('p3','u1','owner'),('p3','u2','admin'),('p3','u3','member'),
      ('p4','u1','owner'),('p4','u2','admin'),('p4','u3','member'),('p4','u4','member'),('p4','u5','viewer')
    ON CONFLICT DO NOTHING
  `);

  // workflow_statuses (DEFAULT_WORKFLOW for each project)
  const projects = ['p1','p2','p3','p4'];
  const wfBase = [
    {id:'todo',       label:'진행 전', color:'#94a3b8', order:0},
    {id:'in_progress',label:'진행 중', color:'#3b82f6', order:1},
    {id:'review',     label:'검토 중', color:'#f59e0b', order:2},
    {id:'done',       label:'완료',    color:'#10b981', order:3},
  ];
  for (const pid of projects) {
    for (const w of wfBase) {
      await db.query(
        `INSERT INTO workflow_statuses (id, project_id, label, color, "order") VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [`${pid}-${w.id}`, pid, w.label, w.color, w.order]
      );
    }
  }

  // tags
  await db.query(`
    INSERT INTO tags (id, project_id, name, color) VALUES
      ('tag-be','p1','백엔드','#10b981'),
      ('tag-fe','p1','프론트엔드','#ef4444'),
      ('tag-design','p1','디자인','#f59e0b'),
      ('tag-plan','p1','기획','#8b5cf6'),
      ('tag-infra','p1','인프라','#64748b'),
      ('p2-tag-ios','p2','iOS','#6366f1'),
      ('p2-tag-android','p2','Android','#22c55e'),
      ('p2-tag-ux','p2','UX','#f59e0b'),
      ('p3-tag-api','p3','API','#3b82f6'),
      ('p3-tag-perf','p3','성능','#f43f5e'),
      ('p4-tag-bi','p4','BI','#f59e0b'),
      ('p4-tag-sql','p4','SQL','#06b6d4')
    ON CONFLICT (id) DO NOTHING
  `);

  // tasks (p1 only)
  await db.query(`
    INSERT INTO tasks (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,blocked_by,start_date,due_date,estimated_hours,logged_hours,"order",created_at,updated_at) VALUES
      ('t1','p1','요구사항 정의서 작성','기능 요구사항 및 비기능 요구사항 문서화','p1-done','high','{"u2"}','{"tag-plan"}','{}','2026-03-01','2026-03-07',16,18,0,'2026-03-01T09:00:00Z','2026-03-07T18:00:00Z'),
      ('t2','p1','ERD 설계 및 DB 스키마 확정','엔티티 관계도 작성 및 PostgreSQL 스키마 정의','p1-done','high','{"u3"}','{"tag-be"}','{"t1"}','2026-03-08','2026-03-14',24,22,1,'2026-03-08T09:00:00Z','2026-03-14T18:00:00Z'),
      ('t3','p1','UI/UX 스토리보드 작성','주요 화면 와이어프레임 및 프로토타입 제작','p1-review','high','{"u4"}','{"tag-design"}','{"t1"}','2026-03-10','2026-03-21',40,38,0,'2026-03-10T09:00:00Z','2026-03-20T16:00:00Z'),
      ('t4','p1','로그인/인증 API 구현','JWT 기반 토큰 인증, 소셜 로그인 연동','p1-done','urgent','{"u1"}','{"tag-be"}','{"t2"}','2026-03-15','2026-03-22',32,28,2,'2026-03-15T09:00:00Z','2026-03-22T18:00:00Z'),
      ('t5','p1','칸반 보드 컴포넌트 개발','드래그 앤 드롭 기능 포함한 칸반 UI 구현','p1-in_progress','high','{"u1","u2"}','{"tag-fe"}','{"t3","t4"}','2026-04-01','2026-04-15',48,24,0,'2026-04-01T09:00:00Z','2026-04-12T18:00:00Z'),
      ('t6','p1','간트차트 인터랙션 구현','마우스 드래그로 일정 조정 및 선후행 관계 시각화','p1-in_progress','high','{"u3"}','{"tag-fe"}','{"t3"}','2026-04-08','2026-04-22',56,20,1,'2026-04-08T09:00:00Z','2026-04-12T16:00:00Z'),
      ('t7','p1','프로젝트 위키 기능 개발','마크다운 에디터, 버전 관리 기능 구현','p1-todo','medium','{"u4"}','{"tag-fe"}','{}','2026-04-20','2026-04-30',32,0,0,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('t8','p1','파일 업로드/다운로드 기능','프로젝트별 파일 저장소 및 미리보기 기능','p1-todo','medium','{"u2"}','{"tag-be"}','{}','2026-04-25','2026-05-05',24,0,1,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('t9','p1','실시간 타임라인 피드','업무 변경 이력을 뉴스피드 형식으로 표시','p1-todo','low','{}','{"tag-fe"}','{}','2026-05-01','2026-05-10',20,0,2,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('t10','p1','성능 최적화 및 배포 준비','페이징, 무한스크롤, 번들 최적화','p1-todo','high','{"u1"}','{"tag-infra"}','{}','2026-05-15','2026-05-30',40,0,3,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // wiki_pages
  await db.query(`
    INSERT INTO wiki_pages (id,project_id,title,content,version,author_id,updated_at) VALUES
      ('w1','p1','프로젝트 개요 및 목표','# 프로젝트 개요\n\n차세대 스마트 프로젝트 협업 관리 시스템은...\n\n## 목표\n- 업무 투명성 확보\n- 실시간 협업 지원',3,'u1','2026-04-10T10:00:00Z'),
      ('w2','p1','개발 환경 설정 가이드','# 개발 환경 설정\n\n## 사전 요구사항\n- Node.js 20+\n- PostgreSQL 15+\n\n## 설치 방법\n```bash\nnpm install\n```',5,'u2','2026-04-12T14:30:00Z'),
      ('w3','p1','코딩 컨벤션','# 코딩 컨벤션\n\n## TypeScript\n- 타입 명시 필수\n- any 사용 금지\n\n## 컴포넌트\n- 함수형 컴포넌트 사용',2,'u3','2026-04-08T09:00:00Z'),
      ('w4','p1','API 명세 요약','# API 명세\n\n## 인증\n`POST /api/auth/login`\n\n## 프로젝트\n`GET /api/projects`',7,'u1','2026-04-13T08:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // announcements
  await db.query(`
    INSERT INTO announcements (id,project_id,title,content,author_id,is_pinned,created_at) VALUES
      ('a1','p1','4월 스프린트 계획 공유','이번 스프린트는 칸반 보드와 간트차트 핵심 기능 완성에 집중합니다.','u1',true,'2026-04-01T09:00:00Z'),
      ('a2','p1','코드 리뷰 일정 변경 안내','매주 수요일 오후 3시로 코드 리뷰 시간이 변경되었습니다.','u2',false,'2026-04-08T11:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // timeline_events (p1, 20 events)
  const tlEvents = [
    ['e1','task_completed','u1','p1','{"taskTitle":"로그인/인증 API 구현"}','2026-04-14T11:30:00Z'],
    ['e2','task_updated','u3','p1','{"taskTitle":"간트차트 인터랙션 구현","field":"status","from":"todo","to":"in_progress"}','2026-04-14T10:15:00Z'],
    ['e3','file_uploaded','u4','p1','{"fileName":"UI_스토리보드_v2.pdf"}','2026-04-14T09:40:00Z'],
    ['e4','task_completed','u2','p1','{"taskTitle":"칸반 보드 수영레인 구현"}','2026-04-13T17:20:00Z'],
    ['e5','task_completed','u1','p1','{"taskTitle":"업무 의존성(선후행) 관리"}','2026-04-13T15:00:00Z'],
    ['e6','comment_added','u2','p1','{"taskTitle":"UI/UX 스토리보드 작성","comment":"전체적인 흐름은 좋은데 모바일 레이아웃 재검토가 필요합니다."}','2026-04-13T12:20:00Z'],
    ['e7','task_completed','u3','p1','{"taskTitle":"프로젝트 워크플로우 커스터마이징"}','2026-04-12T18:00:00Z'],
    ['e8','task_created','u1','p1','{"taskTitle":"성능 최적화 및 배포 준비"}','2026-04-12T14:00:00Z'],
    ['e9','task_completed','u4','p1','{"taskTitle":"UI/UX 스토리보드 작성"}','2026-04-11T17:30:00Z'],
    ['e10','task_completed','u1','p1','{"taskTitle":"태그 시스템 구현"}','2026-04-11T14:00:00Z'],
    ['e11','member_joined','u5','p1','{}','2026-04-11T09:00:00Z'],
    ['e12','task_completed','u2','p1','{"taskTitle":"칸반 보드 컴포넌트 개발"}','2026-04-10T17:00:00Z'],
    ['e13','task_updated','u2','p1','{"taskTitle":"칸반 보드 컴포넌트 개발","field":"priority","from":"medium","to":"high"}','2026-04-10T16:30:00Z'],
    ['e14','task_completed','u3','p1','{"taskTitle":"ERD 설계 및 DB 스키마 확정"}','2026-04-09T18:00:00Z'],
    ['e15','task_completed','u5','p1','{"taskTitle":"프로젝트 멤버 역할 관리"}','2026-04-09T15:00:00Z'],
    ['e16','task_completed','u1','p1','{"taskTitle":"대시보드 기본 레이아웃"}','2026-04-08T16:30:00Z'],
    ['e17','task_completed','u2','p1','{"taskTitle":"REST API 기본 라우트 설계"}','2026-04-07T17:00:00Z'],
    ['e18','task_completed','u4','p1','{"taskTitle":"컴포넌트 디자인 시스템 구축"}','2026-04-07T14:00:00Z'],
    ['e19','task_completed','u3','p1','{"taskTitle":"Docker 환경 구성"}','2026-04-05T16:00:00Z'],
    ['e20','project_created','u1','p1','{"projectName":"프로젝트 관리 시스템"}','2026-04-03T09:00:00Z'],
  ];
  for (const [id,type,actor,proj,payload,created] of tlEvents) {
    await db.query(
      `INSERT INTO timeline_events (id,type,actor_id,project_id,payload,created_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6) ON CONFLICT (id) DO NOTHING`,
      [id,type,actor,proj,payload,created]
    );
  }

  // work_logs
  await db.query(`
    INSERT INTO work_logs (id,task_id,user_id,hours,note,date,created_at) VALUES
      ('wl1','t1','u1',3,'기본 JWT 구조 설계','2026-04-08','2026-04-08T18:00:00Z'),
      ('wl2','t1','u1',2.5,'토큰 갱신 로직 구현','2026-04-09','2026-04-09T17:30:00Z'),
      ('wl3','t1','u1',2,'단위 테스트 작성 및 수정','2026-04-10','2026-04-10T16:00:00Z'),
      ('wl4','t2','u2',4,'DndKit 드래그 구현','2026-04-08','2026-04-08T19:00:00Z'),
      ('wl5','t2','u2',4,'수영레인 뷰 구현','2026-04-09','2026-04-09T18:30:00Z'),
      ('wl6','t2','u2',3.5,'업무 로드 패널 추가','2026-04-10','2026-04-10T17:00:00Z'),
      ('wl7','t3','u3',4,'바 드래그 기본 구현','2026-04-11','2026-04-11T18:00:00Z'),
      ('wl8','t3','u3',3,'선후행 SVG 화살표','2026-04-12','2026-04-12T17:00:00Z'),
      ('wl9','t4','u3',2.5,'초기 ERD 작성','2026-04-06','2026-04-06T16:00:00Z'),
      ('wl10','t4','u3',2,'팀 리뷰 반영 수정','2026-04-07','2026-04-07T15:00:00Z'),
      ('wl11','t5','u4',3,'와이어프레임 초안','2026-04-07','2026-04-07T17:00:00Z'),
      ('wl12','t5','u4',4,'피그마 목업 완성','2026-04-08','2026-04-08T18:30:00Z'),
      ('wl13','t6','u1',3,'SVG 도넛 차트 구현','2026-04-12','2026-04-12T17:00:00Z'),
      ('wl14','t6','u1',2.5,'번다운 라인 차트','2026-04-13','2026-04-13T16:30:00Z'),
      ('wl15','t7','u2',4,'기본 CRUD 엔드포인트','2026-04-05','2026-04-05T17:00:00Z'),
      ('wl16','t7','u2',3.5,'인증 미들웨어 연동','2026-04-06','2026-04-06T18:00:00Z'),
      ('wl17','t8','u3',2,'Dockerfile 작성','2026-04-04','2026-04-04T15:00:00Z'),
      ('wl18','t8','u3',1.5,'docker-compose 설정','2026-04-05','2026-04-05T14:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // files
  await db.query(`
    INSERT INTO files (id,project_id,name,size,mime_type,uploader_id,created_at) VALUES
      ('f1','p1','UI_스토리보드_v2.pdf',4820000,'application/pdf','u4','2026-04-13T09:40:00Z'),
      ('f2','p1','ERD_설계서_최종.png',1240000,'image/png','u3','2026-03-14T17:00:00Z'),
      ('f3','p1','API_명세서_v1.3.xlsx',320000,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','u1','2026-04-05T11:30:00Z'),
      ('f4','p1','RFP_프로젝트관리시스템.docx',890000,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','u1','2026-03-01T09:00:00Z'),
      ('f5','p1','스프린트1_완료보고.pptx',6500000,'application/vnd.openxmlformats-officedocument.presentationml.presentation','u2','2026-03-31T18:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // polls
  await db.query(`
    INSERT INTO polls (id,project_id,title,description,is_multiple,show_results_before_close,status,due_date,author_id,created_at) VALUES
      ('poll1','p1','스프린트 회고 방식 선택','이번 스프린트부터 적용할 회고 방식을 선택해 주세요.',false,true,'active','2026-04-20','u1','2026-04-10T10:00:00Z'),
      ('poll2','p1','다음 스프린트 우선 구현 기능 (복수 선택)','다음 스프린트에 집중할 기능을 모두 선택해 주세요. 상위 2개를 우선 진행합니다.',true,false,'active',NULL,'u1','2026-04-12T09:30:00Z'),
      ('poll3','p2','앱 아이콘 디자인 최종 선택','디자인 팀이 제안한 3가지 안 중 최종 아이콘을 선택해 주세요.',false,true,'closed','2026-04-07','u2','2026-04-01T14:00:00Z'),
      ('poll4','p2','모바일 앱 출시 일정 조율','팀 상황을 고려해 현실적인 출시 일정을 선택해 주세요.',false,false,'active','2026-04-18','u2','2026-04-13T11:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // poll_options
  await db.query(`
    INSERT INTO poll_options (id,poll_id,label,"order") VALUES
      ('poll1-o1','poll1','KPT (Keep / Problem / Try)',0),
      ('poll1-o2','poll1','Start / Stop / Continue',1),
      ('poll1-o3','poll1','4L (Liked / Learned / Lacked / Longed for)',2),
      ('poll2-o1','poll2','글로벌 검색 기능',0),
      ('poll2-o2','poll2','인앱 알림 센터',1),
      ('poll2-o3','poll2','모바일 반응형 지원',2),
      ('poll2-o4','poll2','다크 모드',3),
      ('poll3-o1','poll3','안 A — 미니멀 라인 스타일',0),
      ('poll3-o2','poll3','안 B — 그라디언트 입체형',1),
      ('poll3-o3','poll3','안 C — 플랫 컬러 블록',2),
      ('poll4-o1','poll4','4월 말 (4/28)',0),
      ('poll4-o2','poll4','5월 초 (5/7)',1),
      ('poll4-o3','poll4','5월 중순 (5/14)',2)
    ON CONFLICT (id) DO NOTHING
  `);

  // poll_votes
  await db.query(`
    INSERT INTO poll_votes (poll_id,option_id,user_id) VALUES
      ('poll1','poll1-o1','u2'),
      ('poll1','poll1-o1','u3'),
      ('poll1','poll1-o2','u4'),
      ('poll2','poll2-o1','u1'),
      ('poll2','poll2-o1','u3'),
      ('poll2','poll2-o2','u1'),
      ('poll2','poll2-o2','u2'),
      ('poll2','poll2-o2','u3'),
      ('poll2','poll2-o3','u2'),
      ('poll2','poll2-o4','u3'),
      ('poll2','poll2-o4','u4'),
      ('poll3','poll3-o1','u1'),
      ('poll3','poll3-o1','u3'),
      ('poll3','poll3-o2','u2'),
      ('poll3','poll3-o2','u4'),
      ('poll3','poll3-o2','u5')
    ON CONFLICT DO NOTHING
  `);

  console.log('Seed complete.');
  await db.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
```

> **Note:** workflow status ID를 `{projectId}-{statusId}` 형식(예: `p1-todo`)으로 시드하는 이유: 각 프로젝트마다 독립적인 상태를 가지기 위함. 컴포넌트의 `statusId` 참조도 이 형식으로 맞춰야 함. 기존 시드 task에서 `statusId`를 `p1-done`, `p1-in_progress` 등으로 직접 설정했으므로 일관성 유지.

- [ ] **Step 2: 시드 실행**

```bash
cd /mnt/c/cmworld/server
npm run seed
```

Expected: `Seed complete.`

- [ ] **Step 3: DB 데이터 확인**

```bash
cd /mnt/c/cmworld/server
npx ts-node -e "
import('./src/db').then(({db}) => 
  db.query('SELECT COUNT(*) FROM users').then(r => { console.log('users:', r.rows[0].count); return db.end(); })
)"
```

Expected: `users: 5`

---

## Task 7: Express 앱 + 라우트 등록 (server/src/index.ts)

**Files:**
- Create: `server/src/index.ts`

- [ ] **Step 1: `server/src/index.ts` 작성**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { usersRouter }        from './routes/users';
import { projectsRouter }     from './routes/projects';
import { tasksRouter }        from './routes/tasks';
import { wikiRouter }         from './routes/wiki';
import { announcementsRouter } from './routes/announcements';
import { worklogsRouter }     from './routes/worklogs';
import { filesRouter }        from './routes/files';
import { pollsRouter }        from './routes/polls';
import { timelineRouter }     from './routes/timeline';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users',         usersRouter);
app.use('/api/projects',      projectsRouter);
app.use('/api/tasks',         tasksRouter);
app.use('/api/wiki',          wikiRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/worklogs',      worklogsRouter);
app.use('/api/files',         filesRouter);
app.use('/api/polls',         pollsRouter);
app.use('/api/timeline',      timelineRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));
```

---

## Task 8: Users 라우트 (server/src/routes/users.ts)

**Files:**
- Create: `server/src/routes/users.ts`

- [ ] **Step 1: `server/src/routes/users.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';

export const usersRouter = Router();

// GET /api/users
usersRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM users ORDER BY name');
  res.json(rows);
});
```

---

## Task 9: Projects 라우트 (server/src/routes/projects.ts)

**Files:**
- Create: `server/src/routes/projects.ts`

`Project` 타입에는 `members`, `workflow`, `tags`가 포함되므로 각 프로젝트마다 서브쿼리로 조립.

- [ ] **Step 1: `server/src/routes/projects.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';
import { randomUUID } from 'crypto';

export const projectsRouter = Router();

// 프로젝트 행을 Frontend Project 타입으로 조립하는 헬퍼
async function assembleProjects(projectIds: string[]) {
  if (projectIds.length === 0) return [];

  const [projRes, memberRes, wfRes, tagRes] = await Promise.all([
    db.query(`SELECT * FROM projects WHERE id = ANY($1)`, [projectIds]),
    db.query(`
      SELECT pm.project_id, pm.role, u.id, u.name, u.email, u.avatar
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ANY($1)
    `, [projectIds]),
    db.query(`
      SELECT * FROM workflow_statuses WHERE project_id = ANY($1) ORDER BY "order"
    `, [projectIds]),
    db.query(`SELECT * FROM tags WHERE project_id = ANY($1)`, [projectIds]),
  ]);

  return projRes.rows.map((p) => ({
    id:          p.id,
    name:        p.name,
    description: p.description ?? '',
    color:       p.color,
    startDate:   p.start_date?.toISOString?.().slice(0,10) ?? '',
    endDate:     p.end_date?.toISOString?.().slice(0,10) ?? '',
    createdAt:   p.created_at,
    updatedAt:   p.updated_at,
    members: memberRes.rows
      .filter((m) => m.project_id === p.id)
      .map((m) => ({ id: m.id, name: m.name, email: m.email, avatar: m.avatar, role: m.role })),
    workflow: wfRes.rows
      .filter((w) => w.project_id === p.id)
      .map((w) => ({ id: w.id, label: w.label, color: w.color, order: w.order })),
    tags: tagRes.rows
      .filter((t) => t.project_id === p.id)
      .map((t) => ({ id: t.id, name: t.name, color: t.color })),
  }));
}

// GET /api/projects
projectsRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT id FROM projects ORDER BY updated_at DESC');
  const ids = rows.map((r: { id: string }) => r.id);
  const projects = await assembleProjects(ids);
  res.json(projects);
});

// POST /api/projects
projectsRouter.post('/', async (req, res) => {
  const { name, description, color, startDate, endDate, members, workflow, tags } = req.body;
  const id  = randomUUID();
  const now = new Date().toISOString();

  await db.query(
    `INSERT INTO projects (id,name,description,color,start_date,end_date,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, name, description, color, startDate || null, endDate || null, now, now]
  );

  // members
  for (const m of (members ?? [])) {
    await db.query(
      `INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [id, m.id, m.role]
    );
  }
  // workflow
  for (const w of (workflow ?? [])) {
    await db.query(
      `INSERT INTO workflow_statuses (id,project_id,label,color,"order") VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [w.id, id, w.label, w.color, w.order]
    );
  }
  // tags
  for (const t of (tags ?? [])) {
    await db.query(
      `INSERT INTO tags (id,project_id,name,color) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [t.id, id, t.name, t.color]
    );
  }

  const [assembled] = await assembleProjects([id]);
  res.status(201).json(assembled);
});

// PUT /api/projects/:id
projectsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, color, startDate, endDate, members, workflow, tags } = req.body;
  const now = new Date().toISOString();

  await db.query(
    `UPDATE projects SET name=$1,description=$2,color=$3,start_date=$4,end_date=$5,updated_at=$6 WHERE id=$7`,
    [name, description, color, startDate || null, endDate || null, now, id]
  );

  if (members !== undefined) {
    await db.query('DELETE FROM project_members WHERE project_id=$1', [id]);
    for (const m of members) {
      await db.query(
        `INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,$3)`,
        [id, m.id, m.role]
      );
    }
  }
  if (workflow !== undefined) {
    await db.query('DELETE FROM workflow_statuses WHERE project_id=$1', [id]);
    for (const w of workflow) {
      await db.query(
        `INSERT INTO workflow_statuses (id,project_id,label,color,"order") VALUES ($1,$2,$3,$4,$5)`,
        [w.id, id, w.label, w.color, w.order]
      );
    }
  }
  if (tags !== undefined) {
    await db.query('DELETE FROM tags WHERE project_id=$1', [id]);
    for (const t of tags) {
      await db.query(
        `INSERT INTO tags (id,project_id,name,color) VALUES ($1,$2,$3,$4)`,
        [t.id, id, t.name, t.color]
      );
    }
  }

  const [assembled] = await assembleProjects([id]);
  res.json(assembled);
});

// DELETE /api/projects/:id
projectsRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
  res.status(204).end();
});

// GET /api/workflow/:projectId
projectsRouter.get('/workflow/:projectId', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM workflow_statuses WHERE project_id=$1 ORDER BY "order"`,
    [req.params.projectId]
  );
  res.json(rows.map((w) => ({ id: w.id, label: w.label, color: w.color, order: w.order })));
});

// PUT /api/workflow/:projectId
projectsRouter.put('/workflow/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const workflow: Array<{ id: string; label: string; color: string; order: number }> = req.body;

  await db.query('DELETE FROM workflow_statuses WHERE project_id=$1', [projectId]);
  for (const w of workflow) {
    await db.query(
      `INSERT INTO workflow_statuses (id,project_id,label,color,"order") VALUES ($1,$2,$3,$4,$5)`,
      [w.id, projectId, w.label, w.color, w.order]
    );
  }
  res.json(workflow);
});
```

---

## Task 10: Tasks 라우트 (server/src/routes/tasks.ts)

**Files:**
- Create: `server/src/routes/tasks.ts`

- [ ] **Step 1: `server/src/routes/tasks.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';
import { randomUUID } from 'crypto';

export const tasksRouter = Router();

function rowToTask(r: Record<string, unknown>) {
  return {
    id:             r.id,
    projectId:      r.project_id,
    title:          r.title,
    description:    r.description ?? '',
    statusId:       r.status_id,
    priority:       r.priority,
    assigneeIds:    r.assignee_ids ?? [],
    tagIds:         r.tag_ids ?? [],
    blockedBy:      r.blocked_by ?? [],
    startDate:      (r.start_date as Date | null)?.toISOString?.().slice(0,10) ?? undefined,
    dueDate:        (r.due_date as Date | null)?.toISOString?.().slice(0,10) ?? undefined,
    estimatedHours: r.estimated_hours ? Number(r.estimated_hours) : undefined,
    loggedHours:    Number(r.logged_hours) || 0,
    order:          r.order,
    parentId:       r.parent_id ?? undefined,
    createdAt:      r.created_at,
    updatedAt:      r.updated_at,
  };
}

// GET /api/tasks?projectId=
tasksRouter.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  const { rows } = await db.query(
    `SELECT * FROM tasks WHERE project_id=$1 ORDER BY "order"`,
    [projectId]
  );
  res.json(rows.map(rowToTask));
});

// POST /api/tasks
tasksRouter.post('/', async (req, res) => {
  const {
    projectId, title, description, statusId, priority,
    assigneeIds, tagIds, blockedBy, startDate, dueDate,
    estimatedHours, parentId
  } = req.body;
  const id  = randomUUID();
  const now = new Date().toISOString();

  // compute max order in column
  const { rows: colRows } = await db.query(
    `SELECT MAX("order") as max_order FROM tasks WHERE project_id=$1 AND status_id=$2`,
    [projectId, statusId]
  );
  const order = colRows[0].max_order !== null ? Number(colRows[0].max_order) + 1 : 0;

  await db.query(`
    INSERT INTO tasks
      (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,blocked_by,
       start_date,due_date,estimated_hours,logged_hours,"order",parent_id,created_at,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,$13,$14,$15,$15)
  `, [
    id, projectId, title, description ?? '', statusId, priority,
    assigneeIds ?? [], tagIds ?? [], blockedBy ?? [],
    startDate || null, dueDate || null, estimatedHours ?? null,
    order, parentId ?? null, now
  ]);

  const { rows } = await db.query('SELECT * FROM tasks WHERE id=$1', [id]);
  res.status(201).json(rowToTask(rows[0]));
});

// PUT /api/tasks/:id
tasksRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title, description, statusId, priority,
    assigneeIds, tagIds, blockedBy, startDate, dueDate,
    estimatedHours, loggedHours, order, parentId
  } = req.body;
  const now = new Date().toISOString();

  await db.query(`
    UPDATE tasks SET
      title=$1, description=$2, status_id=$3, priority=$4,
      assignee_ids=$5, tag_ids=$6, blocked_by=$7,
      start_date=$8, due_date=$9, estimated_hours=$10, logged_hours=$11,
      "order"=$12, parent_id=$13, updated_at=$14
    WHERE id=$15
  `, [
    title, description, statusId, priority,
    assigneeIds, tagIds, blockedBy,
    startDate || null, dueDate || null,
    estimatedHours ?? null, loggedHours ?? 0,
    order ?? 0, parentId ?? null, now, id
  ]);

  const { rows } = await db.query('SELECT * FROM tasks WHERE id=$1', [id]);
  res.json(rowToTask(rows[0]));
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
  res.status(204).end();
});
```

---

## Task 11: Wiki 라우트 (server/src/routes/wiki.ts)

**Files:**
- Create: `server/src/routes/wiki.ts`

- [ ] **Step 1: `server/src/routes/wiki.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';
import { randomUUID } from 'crypto';

export const wikiRouter = Router();

function rowToWiki(r: Record<string, unknown>) {
  return {
    id:        r.id,
    projectId: r.project_id,
    title:     r.title,
    content:   r.content ?? '',
    version:   r.version,
    authorId:  r.author_id,
    updatedAt: r.updated_at,
  };
}

// GET /api/wiki?projectId=
wikiRouter.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  const { rows } = await db.query(
    `SELECT * FROM wiki_pages WHERE project_id=$1 ORDER BY updated_at DESC`,
    [projectId]
  );
  res.json(rows.map(rowToWiki));
});

// POST /api/wiki
wikiRouter.post('/', async (req, res) => {
  const { projectId, title, content, authorId } = req.body;
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO wiki_pages (id,project_id,title,content,version,author_id,updated_at) VALUES ($1,$2,$3,$4,1,$5,$6)`,
    [id, projectId, title, content ?? '', authorId, now]
  );
  const { rows } = await db.query('SELECT * FROM wiki_pages WHERE id=$1', [id]);
  res.status(201).json(rowToWiki(rows[0]));
});

// PUT /api/wiki/:id
wikiRouter.put('/:id', async (req, res) => {
  const { title, content } = req.body;
  const now = new Date().toISOString();
  await db.query(
    `UPDATE wiki_pages SET title=$1, content=$2, version=version+1, updated_at=$3 WHERE id=$4`,
    [title, content, now, req.params.id]
  );
  const { rows } = await db.query('SELECT * FROM wiki_pages WHERE id=$1', [req.params.id]);
  res.json(rowToWiki(rows[0]));
});

// DELETE /api/wiki/:id
wikiRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM wiki_pages WHERE id=$1', [req.params.id]);
  res.status(204).end();
});
```

---

## Task 12: Announcements 라우트 (server/src/routes/announcements.ts)

**Files:**
- Create: `server/src/routes/announcements.ts`

- [ ] **Step 1: `server/src/routes/announcements.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';
import { randomUUID } from 'crypto';

export const announcementsRouter = Router();

function rowToAnn(r: Record<string, unknown>) {
  return {
    id:        r.id,
    projectId: r.project_id,
    title:     r.title,
    content:   r.content ?? '',
    authorId:  r.author_id,
    isPinned:  r.is_pinned,
    createdAt: r.created_at,
  };
}

// GET /api/announcements?projectId=
announcementsRouter.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  const { rows } = await db.query(
    `SELECT * FROM announcements WHERE project_id=$1 ORDER BY is_pinned DESC, created_at DESC`,
    [projectId]
  );
  res.json(rows.map(rowToAnn));
});

// POST /api/announcements
announcementsRouter.post('/', async (req, res) => {
  const { projectId, title, content, authorId, isPinned } = req.body;
  const id  = randomUUID();
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO announcements (id,project_id,title,content,author_id,is_pinned,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, projectId, title, content ?? '', authorId, isPinned ?? false, now]
  );
  const { rows } = await db.query('SELECT * FROM announcements WHERE id=$1', [id]);
  res.status(201).json(rowToAnn(rows[0]));
});

// PUT /api/announcements/:id
announcementsRouter.put('/:id', async (req, res) => {
  const { title, content, isPinned } = req.body;
  await db.query(
    `UPDATE announcements SET title=$1, content=$2, is_pinned=$3 WHERE id=$4`,
    [title, content, isPinned, req.params.id]
  );
  const { rows } = await db.query('SELECT * FROM announcements WHERE id=$1', [req.params.id]);
  res.json(rowToAnn(rows[0]));
});

// DELETE /api/announcements/:id
announcementsRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
  res.status(204).end();
});

// PATCH /api/announcements/:id/pin
announcementsRouter.patch('/:id/pin', async (req, res) => {
  await db.query(
    `UPDATE announcements SET is_pinned = NOT is_pinned WHERE id=$1`,
    [req.params.id]
  );
  const { rows } = await db.query('SELECT * FROM announcements WHERE id=$1', [req.params.id]);
  res.json(rowToAnn(rows[0]));
});
```

---

## Task 13: WorkLogs 라우트 (server/src/routes/worklogs.ts)

**Files:**
- Create: `server/src/routes/worklogs.ts`

- [ ] **Step 1: `server/src/routes/worklogs.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';
import { randomUUID } from 'crypto';

export const worklogsRouter = Router();

function rowToLog(r: Record<string, unknown>) {
  return {
    id:        r.id,
    taskId:    r.task_id,
    userId:    r.user_id,
    hours:     Number(r.hours),
    note:      r.note ?? '',
    date:      (r.date as Date)?.toISOString?.().slice(0,10) ?? r.date,
    createdAt: r.created_at,
  };
}

// GET /api/worklogs?taskId=
worklogsRouter.get('/', async (req, res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });
  const { rows } = await db.query(
    `SELECT * FROM work_logs WHERE task_id=$1 ORDER BY date DESC`,
    [taskId]
  );
  res.json(rows.map(rowToLog));
});

// POST /api/worklogs
worklogsRouter.post('/', async (req, res) => {
  const { taskId, userId, hours, note, date } = req.body;
  const id  = randomUUID();
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO work_logs (id,task_id,user_id,hours,note,date,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, taskId, userId, hours, note ?? '', date, now]
  );
  // update logged_hours on task
  await db.query(
    `UPDATE tasks SET logged_hours = logged_hours + $1, updated_at=$2 WHERE id=$3`,
    [hours, now, taskId]
  );
  const { rows } = await db.query('SELECT * FROM work_logs WHERE id=$1', [id]);
  res.status(201).json(rowToLog(rows[0]));
});

// DELETE /api/worklogs/:id
worklogsRouter.delete('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM work_logs WHERE id=$1', [req.params.id]);
  if (rows.length > 0) {
    const wl = rows[0];
    await db.query('DELETE FROM work_logs WHERE id=$1', [req.params.id]);
    await db.query(
      `UPDATE tasks SET logged_hours = GREATEST(0, logged_hours - $1), updated_at=$2 WHERE id=$3`,
      [wl.hours, new Date().toISOString(), wl.task_id]
    );
  }
  res.status(204).end();
});
```

---

## Task 14: Files 라우트 (server/src/routes/files.ts)

**Files:**
- Create: `server/src/routes/files.ts`

- [ ] **Step 1: `server/src/routes/files.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';
import { randomUUID } from 'crypto';

export const filesRouter = Router();

function rowToFile(r: Record<string, unknown>) {
  return {
    id:         r.id,
    projectId:  r.project_id,
    name:       r.name,
    size:       Number(r.size),
    mimeType:   r.mime_type,
    uploaderId: r.uploader_id,
    createdAt:  r.created_at,
  };
}

// GET /api/files?projectId=
filesRouter.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  const { rows } = await db.query(
    `SELECT * FROM files WHERE project_id=$1 ORDER BY created_at DESC`,
    [projectId]
  );
  res.json(rows.map(rowToFile));
});

// POST /api/files
filesRouter.post('/', async (req, res) => {
  const { projectId, name, size, mimeType, uploaderId } = req.body;
  const id  = randomUUID();
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO files (id,project_id,name,size,mime_type,uploader_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, projectId, name, size, mimeType, uploaderId, now]
  );
  const { rows } = await db.query('SELECT * FROM files WHERE id=$1', [id]);
  res.status(201).json(rowToFile(rows[0]));
});

// DELETE /api/files/:id
filesRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM files WHERE id=$1', [req.params.id]);
  res.status(204).end();
});
```

---

## Task 15: Polls 라우트 (server/src/routes/polls.ts)

**Files:**
- Create: `server/src/routes/polls.ts`

- [ ] **Step 1: `server/src/routes/polls.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';
import { randomUUID } from 'crypto';

export const pollsRouter = Router();

async function assemblePolls(pollIds: string[]) {
  if (pollIds.length === 0) return [];
  const [pollRes, optRes, voteRes] = await Promise.all([
    db.query('SELECT * FROM polls WHERE id = ANY($1)', [pollIds]),
    db.query('SELECT * FROM poll_options WHERE poll_id = ANY($1) ORDER BY "order"', [pollIds]),
    db.query('SELECT * FROM poll_votes WHERE poll_id = ANY($1)', [pollIds]),
  ]);
  return pollRes.rows.map((p) => ({
    id:                     p.id,
    projectId:              p.project_id,
    title:                  p.title,
    description:            p.description ?? '',
    isMultiple:             p.is_multiple,
    showResultsBeforeClose: p.show_results_before_close,
    status:                 p.status,
    dueDate:                p.due_date?.toISOString?.().slice(0,10) ?? undefined,
    authorId:               p.author_id,
    createdAt:              p.created_at,
    options: optRes.rows
      .filter((o) => o.poll_id === p.id)
      .map((o) => ({
        id:       o.id,
        label:    o.label,
        voterIds: voteRes.rows
          .filter((v) => v.option_id === o.id)
          .map((v) => v.user_id),
      })),
  }));
}

// GET /api/polls?projectId=
pollsRouter.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  const { rows } = await db.query(
    `SELECT id FROM polls WHERE project_id=$1 ORDER BY created_at DESC`,
    [projectId]
  );
  const polls = await assemblePolls(rows.map((r: { id: string }) => r.id));
  res.json(polls);
});

// POST /api/polls
pollsRouter.post('/', async (req, res) => {
  const { projectId, title, description, options, isMultiple, showResultsBeforeClose, dueDate, authorId } = req.body;
  const id  = randomUUID();
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO polls (id,project_id,title,description,is_multiple,show_results_before_close,status,due_date,author_id,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,$9)`,
    [id, projectId, title, description ?? '', isMultiple ?? false, showResultsBeforeClose ?? true, dueDate || null, authorId, now]
  );
  for (let i = 0; i < (options ?? []).length; i++) {
    const optId = randomUUID();
    await db.query(
      `INSERT INTO poll_options (id,poll_id,label,"order") VALUES ($1,$2,$3,$4)`,
      [optId, id, options[i].label, i]
    );
  }
  const [assembled] = await assemblePolls([id]);
  res.status(201).json(assembled);
});

// POST /api/polls/:id/vote
pollsRouter.post('/:id/vote', async (req, res) => {
  const { optionId, userId } = req.body;
  const { rows } = await db.query('SELECT * FROM polls WHERE id=$1', [req.params.id]);
  if (!rows[0] || rows[0].status === 'closed') return res.status(400).json({ error: 'Poll closed' });

  if (!rows[0].is_multiple) {
    // 단일 선택: 기존 투표 제거 후 새로 INSERT
    const { rows: existOpts } = await db.query(
      `SELECT id FROM poll_options WHERE poll_id=$1`, [req.params.id]
    );
    const optIds = existOpts.map((o: { id: string }) => o.id);
    await db.query(
      `DELETE FROM poll_votes WHERE poll_id=$1 AND user_id=$2 AND option_id = ANY($3)`,
      [req.params.id, userId, optIds]
    );
  }
  await db.query(
    `INSERT INTO poll_votes (poll_id,option_id,user_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [req.params.id, optionId, userId]
  );
  const [assembled] = await assemblePolls([req.params.id]);
  res.json(assembled);
});

// DELETE /api/polls/:id/vote
pollsRouter.delete('/:id/vote', async (req, res) => {
  const { optionId, userId } = req.body;
  await db.query(
    `DELETE FROM poll_votes WHERE poll_id=$1 AND option_id=$2 AND user_id=$3`,
    [req.params.id, optionId, userId]
  );
  const [assembled] = await assemblePolls([req.params.id]);
  res.json(assembled);
});

// POST /api/polls/:id/close
pollsRouter.post('/:id/close', async (req, res) => {
  await db.query(`UPDATE polls SET status='closed' WHERE id=$1`, [req.params.id]);
  const [assembled] = await assemblePolls([req.params.id]);
  res.json(assembled);
});

// DELETE /api/polls/:id
pollsRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM polls WHERE id=$1', [req.params.id]);
  res.status(204).end();
});
```

---

## Task 16: Timeline 라우트 (server/src/routes/timeline.ts)

**Files:**
- Create: `server/src/routes/timeline.ts`

- [ ] **Step 1: `server/src/routes/timeline.ts` 작성**

```typescript
import { Router } from 'express';
import { db } from '../db';
import { randomUUID } from 'crypto';

export const timelineRouter = Router();

function rowToEvent(r: Record<string, unknown>) {
  return {
    id:        r.id,
    type:      r.type,
    actorId:   r.actor_id,
    payload:   r.payload ?? {},
    projectId: r.project_id,
    createdAt: r.created_at,
  };
}

// GET /api/timeline?projectId=
timelineRouter.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  const { rows } = await db.query(
    `SELECT * FROM timeline_events WHERE project_id=$1 ORDER BY created_at DESC LIMIT 200`,
    [projectId]
  );
  res.json(rows.map(rowToEvent));
});

// POST /api/timeline
timelineRouter.post('/', async (req, res) => {
  const { type, actorId, payload, projectId } = req.body;
  const id  = randomUUID();
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO timeline_events (id,type,actor_id,payload,project_id,created_at) VALUES ($1,$2,$3,$4::jsonb,$5,$6)`,
    [id, type, actorId, JSON.stringify(payload ?? {}), projectId, now]
  );
  const { rows } = await db.query('SELECT * FROM timeline_events WHERE id=$1', [id]);
  res.status(201).json(rowToEvent(rows[0]));
});
```

---

## Task 17: 서버 실행 확인

- [ ] **Step 1: 서버 개발 서버 실행**

```bash
cd /mnt/c/cmworld/server
npm run dev
```

Expected: `Server running on :3001`

- [ ] **Step 2: 엔드포인트 확인 (새 터미널)**

```bash
curl http://localhost:3001/api/users | head -c 200
curl "http://localhost:3001/api/projects" | head -c 200
curl "http://localhost:3001/api/tasks?projectId=p1" | head -c 200
```

Expected: 각각 JSON 배열 반환

- [ ] **Step 3: 서버 종료 후 커밋**

```bash
cd /mnt/c/cmworld
git add server/
git commit -m "feat: add Express backend with PostgreSQL routes"
```

---

## Task 18: Vite proxy + QueryClientProvider 설정

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: `vite.config.ts`에 proxy 추가**

현재 내용:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

변경 후:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 2: `src/main.tsx`에 QueryClientProvider 추가**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

---

## Task 19: useUIStore (src/store/useUIStore.ts)

**Files:**
- Create: `src/store/useUIStore.ts`

- [ ] **Step 1: `src/store/useUIStore.ts` 작성**

```typescript
import { create } from 'zustand';

interface UIState {
  currentUserId:    string;
  selectedProjectId: string | null;
  setSelectedProject: (id: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  currentUserId:    'u1',
  selectedProjectId: 'p1',
  setSelectedProject: (id) => set({ selectedProjectId: id }),
}));
```

---

## Task 20: API 클라이언트 + Query Keys

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/lib/queryKeys.ts`

- [ ] **Step 1: `src/lib/api.ts` 작성**

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});
```

- [ ] **Step 2: `src/lib/queryKeys.ts` 작성**

```typescript
export const queryKeys = {
  users:           ['users']                          as const,
  projects:        ['projects']                       as const,
  tasks:    (pid: string) => ['tasks', pid]           as const,
  wiki:     (pid: string) => ['wiki', pid]            as const,
  announcements: (pid: string) => ['announcements', pid] as const,
  worklogs: (tid: string) => ['worklogs', tid]        as const,
  files:    (pid: string) => ['files', pid]           as const,
  polls:    (pid: string) => ['polls', pid]           as const,
  timeline: (pid: string) => ['timeline', pid]        as const,
};
```

---

## Task 21: React Query 훅 — Users + Projects

**Files:**
- Create: `src/hooks/useUsers.ts`
- Create: `src/hooks/useProjects.ts`

- [ ] **Step 1: `src/hooks/useUsers.ts` 작성**

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { User } from '../types';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return Object.fromEntries(data.map((u) => [u.id, u])) as Record<string, User>;
    },
  });
}
```

- [ ] **Step 2: `src/hooks/useProjects.ts` 작성**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { Project } from '../types';

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects');
      return Object.fromEntries(data.map((p) => [p.id, p])) as Record<string, Project>;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) =>
      api.post<Project>('/projects', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Project> & { id: string }) =>
      api.put<Project>(`/projects/${id}`, patch).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}
```

---

## Task 22: React Query 훅 — Tasks + Wiki + Announcements

**Files:**
- Create: `src/hooks/useTasks.ts`
- Create: `src/hooks/useWiki.ts`
- Create: `src/hooks/useAnnouncements.ts`

- [ ] **Step 1: `src/hooks/useTasks.ts` 작성**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { Task } from '../types';

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks(projectId),
    queryFn: async () => {
      const { data } = await api.get<Task[]>(`/tasks?projectId=${projectId}`);
      return Object.fromEntries(data.map((t) => [t.id, t])) as Record<string, Task>;
    },
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours' | 'order'>) =>
      api.post<Task>('/tasks', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks(projectId) }),
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Task> & { id: string }) =>
      api.put<Task>(`/tasks/${id}`, patch).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks(projectId) }),
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks(projectId) }),
  });
}
```

- [ ] **Step 2: `src/hooks/useWiki.ts` 작성**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { WikiPage } from '../types';

export function useWiki(projectId: string) {
  return useQuery({
    queryKey: queryKeys.wiki(projectId),
    queryFn: async () => {
      const { data } = await api.get<WikiPage[]>(`/wiki?projectId=${projectId}`);
      return Object.fromEntries(data.map((w) => [w.id, w])) as Record<string, WikiPage>;
    },
    enabled: !!projectId,
  });
}

export function useCreateWikiPage(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WikiPage, 'id'>) =>
      api.post<WikiPage>('/wiki', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wiki(projectId) }),
  });
}

export function useUpdateWikiPage(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<WikiPage> & { id: string }) =>
      api.put<WikiPage>(`/wiki/${id}`, patch).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wiki(projectId) }),
  });
}

export function useDeleteWikiPage(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/wiki/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wiki(projectId) }),
  });
}
```

- [ ] **Step 3: `src/hooks/useAnnouncements.ts` 작성**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { Announcement } from '../types';

export function useAnnouncements(projectId: string) {
  return useQuery({
    queryKey: queryKeys.announcements(projectId),
    queryFn: async () => {
      const { data } = await api.get<Announcement[]>(`/announcements?projectId=${projectId}`);
      return Object.fromEntries(data.map((a) => [a.id, a])) as Record<string, Announcement>;
    },
    enabled: !!projectId,
  });
}

export function useCreateAnnouncement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Announcement, 'id' | 'createdAt'>) =>
      api.post<Announcement>('/announcements', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements(projectId) }),
  });
}

export function useUpdateAnnouncement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Announcement> & { id: string }) =>
      api.put<Announcement>(`/announcements/${id}`, patch).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements(projectId) }),
  });
}

export function useDeleteAnnouncement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements(projectId) }),
  });
}

export function useTogglePinAnnouncement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Announcement>(`/announcements/${id}/pin`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements(projectId) }),
  });
}
```

---

## Task 23: React Query 훅 — WorkLogs, Files, Polls, Timeline

**Files:**
- Create: `src/hooks/useWorkLogs.ts`
- Create: `src/hooks/useFiles.ts`
- Create: `src/hooks/usePolls.ts`
- Create: `src/hooks/useTimeline.ts`

- [ ] **Step 1: `src/hooks/useWorkLogs.ts` 작성**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { WorkLog } from '../types';

export function useWorkLogs(taskId: string) {
  return useQuery({
    queryKey: queryKeys.worklogs(taskId),
    queryFn: async () => {
      const { data } = await api.get<WorkLog[]>(`/worklogs?taskId=${taskId}`);
      return Object.fromEntries(data.map((w) => [w.id, w])) as Record<string, WorkLog>;
    },
    enabled: !!taskId,
  });
}

export function useAddWorkLog(taskId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkLog, 'id' | 'createdAt'>) =>
      api.post<WorkLog>('/worklogs', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.worklogs(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
    },
  });
}

export function useDeleteWorkLog(taskId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/worklogs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.worklogs(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
    },
  });
}
```

- [ ] **Step 2: `src/hooks/useFiles.ts` 작성**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { FileItem } from '../types';

export function useFiles(projectId: string) {
  return useQuery({
    queryKey: queryKeys.files(projectId),
    queryFn: async () => {
      const { data } = await api.get<FileItem[]>(`/files?projectId=${projectId}`);
      return Object.fromEntries(data.map((f) => [f.id, f])) as Record<string, FileItem>;
    },
    enabled: !!projectId,
  });
}

export function useAddFile(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FileItem, 'id' | 'createdAt'>) =>
      api.post<FileItem>('/files', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.files(projectId) }),
  });
}

export function useDeleteFile(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/files/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.files(projectId) }),
  });
}
```

- [ ] **Step 3: `src/hooks/usePolls.ts` 작성**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { Poll } from '../types';

export function usePolls(projectId: string) {
  return useQuery({
    queryKey: queryKeys.polls(projectId),
    queryFn: async () => {
      const { data } = await api.get<Poll[]>(`/polls?projectId=${projectId}`);
      return Object.fromEntries(data.map((p) => [p.id, p])) as Record<string, Poll>;
    },
    enabled: !!projectId,
  });
}

export function useCreatePoll(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Poll, 'id' | 'createdAt'>) =>
      api.post<Poll>('/polls', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.polls(projectId) }),
  });
}

export function useCastVote(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId, userId }: { pollId: string; optionId: string; userId: string }) =>
      api.post<Poll>(`/polls/${pollId}/vote`, { optionId, userId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.polls(projectId) }),
  });
}

export function useRetractVote(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId, userId }: { pollId: string; optionId: string; userId: string }) =>
      api.delete<Poll>(`/polls/${pollId}/vote`, { data: { optionId, userId } }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.polls(projectId) }),
  });
}

export function useClosePoll(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pollId: string) => api.post<Poll>(`/polls/${pollId}/close`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.polls(projectId) }),
  });
}

export function useDeletePoll(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pollId: string) => api.delete(`/polls/${pollId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.polls(projectId) }),
  });
}
```

- [ ] **Step 4: `src/hooks/useTimeline.ts` 작성**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { TimelineEvent } from '../types';

export function useTimeline(projectId: string) {
  return useQuery({
    queryKey: queryKeys.timeline(projectId),
    queryFn: async () => {
      const { data } = await api.get<TimelineEvent[]>(`/timeline?projectId=${projectId}`);
      return data; // timeline은 배열로 유지 (순서가 중요)
    },
    enabled: !!projectId,
  });
}

export function useAddTimelineEvent(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TimelineEvent, 'id' | 'createdAt'>) =>
      api.post<TimelineEvent>('/timeline', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.timeline(projectId) }),
  });
}
```

---

## Task 24: 컴포넌트 마이그레이션 — Layout (Sidebar, Header)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx`

**마이그레이션 패턴:**
```typescript
// Before
import { useAppStore } from '../../store/useAppStore';
const projects = useAppStore(s => s.projects);
const currentUserId = useAppStore(s => s.currentUserId);

// After
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
const { data: projects = {} } = useProjects();
const currentUserId = useUIStore(s => s.currentUserId);
```

- [ ] **Step 1: `src/components/layout/Sidebar.tsx` 수정**

`useAppStore` import 및 사용을 다음으로 교체:

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useUsers } from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';
```

```typescript
// store 호출 교체
const { data: projectsMap = {} } = useProjects();
const { data: users = {} }       = useUsers();
const currentUserId              = useUIStore(s => s.currentUserId);
const currentUser                = users[currentUserId];
```

- [ ] **Step 2: `src/components/layout/Header.tsx` 수정**

Header에서 `useAppStore` 사용 확인 후 `useUIStore` + 적절한 훅으로 교체.

---

## Task 25: 컴포넌트 마이그레이션 — Projects

**Files:**
- Modify: `src/pages/projects/ProjectsPage.tsx`
- Modify: `src/pages/projects/ProjectDetailPage.tsx`
- Modify: `src/components/projects/ProjectModal.tsx`

- [ ] **Step 1: `src/pages/projects/ProjectsPage.tsx` 수정**

```typescript
// 교체할 import
import { useUIStore } from '../../store/useUIStore';
import { useProjects, useCreateProject, useDeleteProject } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';

// store 호출 교체
const { data: projects = {} }  = useProjects();
const { data: users = {} }     = useUsers();
const currentUserId            = useUIStore(s => s.currentUserId);
const { mutate: createProject } = useCreateProject();
const { mutate: deleteProject } = useDeleteProject();
```

- [ ] **Step 2: `src/pages/projects/ProjectDetailPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects, useUpdateProject, useDeleteProject } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';

const { data: projects = {} }  = useProjects();
const selectedProjectId        = useUIStore(s => s.selectedProjectId);
const { data: tasks = {} }     = useTasks(selectedProjectId ?? '');
const { mutate: updateProject } = useUpdateProject();
const { mutate: deleteProject } = useDeleteProject();
```

- [ ] **Step 3: `src/components/projects/ProjectModal.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useUsers } from '../../hooks/useUsers';
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects';

const { data: users = {} }      = useUsers();
const currentUserId             = useUIStore(s => s.currentUserId);
const { mutate: createProject } = useCreateProject();
const { mutate: updateProject } = useUpdateProject();
```

submit 핸들러에서:
```typescript
// Before
if (isEdit) updateProject(project.id, { ... });
else        createProject({ ... });

// After
if (isEdit) updateProject({ id: project.id, ... });
else        createProject({ ... });
```

---

## Task 26: 컴포넌트 마이그레이션 — Kanban + Gantt + TaskModal

**Files:**
- Modify: `src/pages/kanban/KanbanPage.tsx`
- Modify: `src/pages/gantt/GanttPage.tsx`
- Modify: `src/components/tasks/TaskModal.tsx`

- [ ] **Step 1: `src/pages/kanban/KanbanPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects, useUpdateProject } from '../../hooks/useProjects';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';

const selectedProjectId         = useUIStore(s => s.selectedProjectId) ?? '';
const currentUserId             = useUIStore(s => s.currentUserId);
const { data: projects = {} }   = useProjects();
const { data: tasks = {} }      = useTasks(selectedProjectId);
const { data: users = {} }      = useUsers();
const { mutate: createTask }    = useCreateTask(selectedProjectId);
const { mutate: updateTask }    = useUpdateTask(selectedProjectId);
const { mutate: deleteTask }    = useDeleteTask(selectedProjectId);
```

`moveTask` / `reorderTask` 로직은 `updateTask({ id, statusId, order })` 호출로 변환.

- [ ] **Step 2: `src/pages/gantt/GanttPage.tsx` 수정**

KanbanPage와 동일한 패턴 적용. `useTasks`, `useUpdateTask` 사용.

- [ ] **Step 3: `src/components/tasks/TaskModal.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import { useCreateTask, useUpdateTask } from '../../hooks/useTasks';

const selectedProjectId        = useUIStore(s => s.selectedProjectId) ?? '';
const { data: projects = {} }  = useProjects();
const { data: users = {} }     = useUsers();
const { mutate: createTask }   = useCreateTask(selectedProjectId);
const { mutate: updateTask }   = useUpdateTask(selectedProjectId);
```

---

## Task 27: 컴포넌트 마이그레이션 — Wiki + Announcements

**Files:**
- Modify: `src/pages/wiki/WikiPage.tsx`
- Modify: `src/pages/announcements/AnnouncementsPage.tsx`

- [ ] **Step 1: `src/pages/wiki/WikiPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import { useWiki, useCreateWikiPage, useUpdateWikiPage, useDeleteWikiPage } from '../../hooks/useWiki';

const selectedProjectId             = useUIStore(s => s.selectedProjectId) ?? '';
const currentUserId                 = useUIStore(s => s.currentUserId);
const { data: projects = {} }       = useProjects();
const { data: wikiPages = {} }      = useWiki(selectedProjectId);
const { mutate: createWikiPage }    = useCreateWikiPage(selectedProjectId);
const { mutate: updateWikiPage }    = useUpdateWikiPage(selectedProjectId);
const { mutate: deleteWikiPage }    = useDeleteWikiPage(selectedProjectId);
```

- [ ] **Step 2: `src/pages/announcements/AnnouncementsPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import {
  useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement,
  useDeleteAnnouncement, useTogglePinAnnouncement,
} from '../../hooks/useAnnouncements';

const selectedProjectId                   = useUIStore(s => s.selectedProjectId) ?? '';
const currentUserId                       = useUIStore(s => s.currentUserId);
const { data: projects = {} }             = useProjects();
const { data: announcements = {} }        = useAnnouncements(selectedProjectId);
const { mutate: createAnnouncement }      = useCreateAnnouncement(selectedProjectId);
const { mutate: updateAnnouncement }      = useUpdateAnnouncement(selectedProjectId);
const { mutate: deleteAnnouncement }      = useDeleteAnnouncement(selectedProjectId);
const { mutate: togglePinAnnouncement }   = useTogglePinAnnouncement(selectedProjectId);
```

---

## Task 28: 컴포넌트 마이그레이션 — Files + Polls

**Files:**
- Modify: `src/pages/files/FilesPage.tsx`
- Modify: `src/pages/polls/PollsPage.tsx`
- Modify: `src/pages/polls/PollCard.tsx`

- [ ] **Step 1: `src/pages/files/FilesPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import { useFiles, useAddFile, useDeleteFile } from '../../hooks/useFiles';

const selectedProjectId       = useUIStore(s => s.selectedProjectId) ?? '';
const currentUserId           = useUIStore(s => s.currentUserId);
const { data: projects = {} } = useProjects();
const { data: users = {} }    = useUsers();
const { data: files = {} }    = useFiles(selectedProjectId);
const { mutate: addFile }     = useAddFile(selectedProjectId);
const { mutate: deleteFile }  = useDeleteFile(selectedProjectId);
```

- [ ] **Step 2: `src/pages/polls/PollsPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import { usePolls, useCreatePoll } from '../../hooks/usePolls';

const selectedProjectId          = useUIStore(s => s.selectedProjectId);
const currentUserId              = useUIStore(s => s.currentUserId);
const setSelectedProject         = useUIStore(s => s.setSelectedProject);
const { data: projects = {} }    = useProjects();
const { data: polls = {} }       = usePolls(selectedProjectId ?? '');
const { mutate: createPoll }     = useCreatePoll(selectedProjectId ?? '');
```

- [ ] **Step 3: `src/pages/polls/PollCard.tsx` 수정**

PollCard는 `poll.projectId`를 통해 projectId를 알 수 있음.

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useCastVote, useRetractVote, useClosePoll, useDeletePoll } from '../../hooks/usePolls';

const currentUserId          = useUIStore(s => s.currentUserId);
const { mutate: castVote }   = useCastVote(poll.projectId);
const { mutate: retractVote }= useRetractVote(poll.projectId);
const { mutate: closePoll }  = useClosePoll(poll.projectId);
const { mutate: deletePoll } = useDeletePoll(poll.projectId);
```

`handleVote` 함수 수정:
```typescript
function handleVote(optionId: string) {
  if (poll.status === 'closed') return;
  const alreadyVoted = myVotes.includes(optionId);
  if (!poll.isMultiple && alreadyVoted) return;
  if (alreadyVoted) {
    retractVote({ pollId: poll.id, optionId, userId: currentUserId });
  } else {
    castVote({ pollId: poll.id, optionId, userId: currentUserId });
  }
}
```

closePoll / deletePoll 호출:
```typescript
// Before
closePoll(poll.id)
deletePoll(poll.id)

// After
closePoll(poll.id)
deletePoll(poll.id)
// (mutate 함수 시그니처 동일)
```

---

## Task 29: 컴포넌트 마이그레이션 — Timeline + Dashboard + Resources + Settings

**Files:**
- Modify: `src/pages/timeline/TimelinePage.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Modify: `src/pages/resources/ResourcesPage.tsx`
- Modify: `src/pages/settings/SettingsPage.tsx`

- [ ] **Step 1: `src/pages/timeline/TimelinePage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import { useTimeline } from '../../hooks/useTimeline';

const selectedProjectId       = useUIStore(s => s.selectedProjectId) ?? '';
const { data: projects = {} } = useProjects();
const { data: users = {} }    = useUsers();
const { data: timeline = [] } = useTimeline(selectedProjectId);
```

- [ ] **Step 2: `src/pages/dashboard/DashboardPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useTimeline } from '../../hooks/useTimeline';

const selectedProjectId        = useUIStore(s => s.selectedProjectId) ?? '';
const currentUserId            = useUIStore(s => s.currentUserId);
const { data: projects = {} }  = useProjects();
const { data: tasks = {} }     = useTasks(selectedProjectId);
const { data: users = {} }     = useUsers();
const { data: timeline = [] }  = useTimeline(selectedProjectId);
```

`getProjectProgress`는 `useAppStore`에서 import하던 것을 `src/lib/utils.ts`로 이동:
```typescript
// src/lib/utils.ts에 추가
export function getProjectProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.statusId === 'done').length;
  return Math.round((done / tasks.length) * 100);
}
```

DashboardPage import 수정:
```typescript
import { getProjectProgress } from '../../lib/utils';
```

- [ ] **Step 3: `src/pages/resources/ResourcesPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import { useTasks } from '../../hooks/useTasks';

const selectedProjectId       = useUIStore(s => s.selectedProjectId) ?? '';
const { data: projects = {} } = useProjects();
const { data: users = {} }    = useUsers();
const { data: tasks = {} }    = useTasks(selectedProjectId);
```

- [ ] **Step 4: `src/pages/settings/SettingsPage.tsx` 수정**

```typescript
import { useUIStore } from '../../store/useUIStore';
import { useProjects, useUpdateProject } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';

const selectedProjectId         = useUIStore(s => s.selectedProjectId) ?? '';
const { data: projects = {} }   = useProjects();
const { data: users = {} }      = useUsers();
const { mutate: updateProject } = useUpdateProject();
```

---

## Task 30: 클린업 — useAppStore 및 seed 파일 삭제

**Files:**
- Delete: `src/store/useAppStore.ts`
- Delete: `src/data/seed.ts`
- Modify: `src/lib/utils.ts` — `getProjectProgress` 추가

- [ ] **Step 1: `src/lib/utils.ts`에 `getProjectProgress` 추가**

`src/lib/utils.ts` 파일을 읽고 끝에 추가:
```typescript
import type { Task } from '../types';

export function getProjectProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.statusId === 'done').length;
  return Math.round((done / tasks.length) * 100);
}
```

- [ ] **Step 2: 타입스크립트 빌드 체크**

```bash
cd /mnt/c/cmworld
npx tsc --noEmit
```

Expected: 오류 없음 (또는 기존 오류만). `useAppStore`/`seed` 관련 오류가 없어야 함.

- [ ] **Step 3: `useAppStore.ts` 및 `seed.ts` 삭제**

```bash
rm /mnt/c/cmworld/src/store/useAppStore.ts
rm /mnt/c/cmworld/src/data/seed.ts
```

- [ ] **Step 4: 다시 빌드 체크**

```bash
cd /mnt/c/cmworld
npx tsc --noEmit
```

Expected: 오류 없음.

---

## Task 31: 통합 테스트 + 커밋 + Push + PR + 머지

- [ ] **Step 1: 서버 + 프론트엔드 동시 실행**

터미널 1:
```bash
cd /mnt/c/cmworld/server && npm run dev
```

터미널 2:
```bash
cd /mnt/c/cmworld && npm run dev
```

- [ ] **Step 2: 브라우저에서 확인 (http://localhost:5173)**

다음 항목을 직접 확인:
- [ ] 사이드바에 4개 프로젝트 표시
- [ ] 대시보드 — 업무 현황 차트 및 타임라인 표시
- [ ] 칸반 보드 — p1 업무 4개 컬럼에 표시, 드래그 & 드롭 후 DB 반영
- [ ] 새 업무 생성 — 새로고침 후에도 유지
- [ ] 위키 페이지 목록 표시
- [ ] 공지사항 표시, 핀 토글
- [ ] 타임라인 이벤트 표시
- [ ] 파일 목록 표시
- [ ] 투표 목록 표시, 투표 클릭 후 결과 반영

- [ ] **Step 3: 커밋 및 Push**

```bash
cd /mnt/c/cmworld
git add -A
git commit -m "feat(OP-5): PostgreSQL 연동 — Express API + React Query 마이그레이션"
git push
```

- [ ] **Step 4: PR 생성 (Gitea)**

```bash
gh pr create \
  --repo http://192.168.0.199:3003/yoohwanihn/cmworld \
  --title "feat(OP-5): PostgreSQL 연동 — 더미 데이터 → 실제 DB" \
  --body "## Summary
- Express 4 + TypeScript 백엔드 서버 (server/) 신규 구성
- PostgreSQL 192.168.0.199:5432/project_hub 연동
- 13개 테이블 스키마 마이그레이션 및 시드 데이터 INSERT
- Zustand → React Query 서버 상태 마이그레이션 (17개 컴포넌트)
- useAppStore 제거, useUIStore로 UI 상태만 관리

## Test plan
- [ ] 서버 npm run dev 정상 실행 확인
- [ ] 칸반 드래그 앤 드롭 DB 반영 확인
- [ ] 투표 / 공지사항 CRUD 정상 동작 확인
- [ ] 새로고침 후 데이터 유지 확인"
```

- [ ] **Step 5: PR 머지**

Gitea UI 또는:
```bash
# Gitea API로 머지 (토큰 필요시 Gitea 설정에서 발급)
# 또는 브라우저에서 직접 머지
```

- [ ] **Step 6: develop 브랜치로 체크아웃 + pull**

```bash
cd /mnt/c/cmworld
git checkout develop
git pull
```

---

## 주의사항

### Workflow Status ID 일관성

시드 데이터에서 workflow status ID를 `{projectId}-{statusId}` 형식(예: `p1-todo`)으로 저장했으나, task의 `status_id`도 동일하게 `p1-done`, `p1-in_progress` 등으로 시드됨. 새 프로젝트 생성 시 `ProjectModal`에서 `DEFAULT_WORKFLOW`를 사용하면 `'todo'`, `'in_progress'` 등 기본 ID를 사용하게 됨. 프로젝트별로 workflow status ID를 일관되게 유지하도록 POST /api/projects 핸들러에서 새 프로젝트의 workflow ID를 그대로 사용하면 됨 (클라이언트에서 전달하는 ID 사용).

### 인증

이번 구현에서 `currentUserId`는 `'u1'`로 고정. API 요청에 user ID 정보가 필요한 경우 (파일 업로드, 타임라인 이벤트 등) 프론트엔드에서 `useUIStore(s => s.currentUserId)`를 통해 전달.

### 에러 핸들링

각 라우트에서 async/await 오류가 발생하면 서버가 크래시될 수 있음. 프로덕션 배포 전 express-async-errors 패키지 또는 try/catch 추가 필요. 현재 계획 범위에서는 생략.
