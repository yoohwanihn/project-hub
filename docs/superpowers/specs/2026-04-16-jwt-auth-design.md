# JWT 인증 + 권한 관리 설계

> **작성일:** 2026-04-16  
> **프로젝트:** cmworld / project-hub

---

## Goal

하드코딩된 `currentUserId: 'u1'` 완전 제거. 이메일+비밀번호 로그인, 관리자 승인 회원가입, JWT Access+Refresh Token 인증, 글로벌·프로젝트 이중 권한 관리 구현.

---

## Architecture

### 인증 흐름

```
[Register]  → POST /api/auth/register → DB status='pending'
[Admin 승인] → PATCH /api/admin/users/:id/approve → status='active'
[Login]     → POST /api/auth/login
              → accessToken (15분, Zustand 메모리)
              + refreshToken (30일, localStorage + DB hash)
[API 요청]  → Authorization: Bearer <accessToken>
[401 수신]  → axios interceptor → POST /api/auth/refresh → 재시도
[Logout]    → POST /api/auth/logout → DB refresh_token 삭제
```

### Access Token 페이로드

```json
{ "sub": "u1", "role": "admin", "iat": 1234567890, "exp": 1234568790 }
```

글로벌 role을 페이로드에 포함하여 매 요청마다 DB 조회 없이 권한 판단.

### 상태 관리

- **`useAuthStore`** (신규): `accessToken`, `currentUser` (id, name, email, role, status)
- **`useUIStore`** (기존 유지): `selectedProjectId`, `setSelectedProject`
- `currentUserId` 하드코딩 완전 제거 → `useAuthStore(s => s.currentUser.id)` 사용

---

## DB 스키마 변경

### users 테이블 컬럼 추가

```sql
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
-- status: 'pending' | 'active' | 'rejected'
```

기존 시드 유저(u1~u5) → `status='active'`, `password_hash=bcrypt('cmworld1234!')`.

### refresh_tokens 테이블 신규

```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Refresh Token 원문은 클라이언트 localStorage에 보관. DB에는 bcrypt 해시만 저장하여 DB 유출 시에도 토큰 재사용 불가.

---

## 권한 정의

### 글로벌 역할 (users.role)

| 작업 | owner | admin | member | viewer |
|------|:-----:|:-----:|:------:|:------:|
| 앱 로그인 / 사용 | ✅ | ✅ | ✅ | ✅ |
| 프로젝트 생성 | ✅ | ✅ | ❌ | ❌ |
| 전체 프로젝트 조회 | ✅ | ✅ | 참여분만 | 참여분만 |
| 회원 승인·거절 | ✅ | ✅ | ❌ | ❌ |
| 회원 역할 변경 | ✅ | ✅ | ❌ | ❌ |
| /admin 페이지 접근 | ✅ | ✅ | ❌ | ❌ |

### 프로젝트 역할 (project_members.role)

| 작업 | owner | admin | member | viewer |
|------|:-----:|:-----:|:------:|:------:|
| 프로젝트 수정·삭제 | ✅ | ✅ | ❌ | ❌ |
| 멤버 추가·제거 | ✅ | ✅ | ❌ | ❌ |
| 업무 생성·수정·삭제 | ✅ | ✅ | ✅ | ❌ |
| 위키·공지·파일 작성 | ✅ | ✅ | ✅ | ❌ |
| 투표 참여 | ✅ | ✅ | ✅ | ✅ |
| 읽기 전용 조회 | ✅ | ✅ | ✅ | ✅ |

> **원칙:** owner와 admin은 글로벌·프로젝트 양쪽에서 동일한 최고 권한 보유.

---

## 백엔드 API

### 신규 라우트

```
POST  /api/auth/register              # 회원가입 (status=pending 생성)
POST  /api/auth/login                 # 로그인 → { accessToken, refreshToken, user }
POST  /api/auth/refresh               # { refreshToken } → { accessToken }
POST  /api/auth/logout                # { refreshToken } → DB 삭제
GET   /api/auth/me                    # 현재 유저 정보 (authMiddleware 필요)

GET   /api/admin/users                # 전체 유저 목록 (owner/admin only)
PATCH /api/admin/users/:id/approve    # status=active
PATCH /api/admin/users/:id/reject     # status=rejected
PATCH /api/admin/users/:id/role       # { role } 변경
```

### 미들웨어

```typescript
// server/src/middleware/auth.ts

// 1. JWT 검증 — 유효하지 않으면 401
authMiddleware(req, res, next): void

// 2. 글로벌 역할 체크 팩토리
requireRole(...roles: ('owner'|'admin'|'member'|'viewer')[]): Middleware

// 3. 프로젝트 역할 체크 팩토리
//    projectId 추출 우선순위:
//      req.params.projectId → req.params.id → req.body.projectId → req.query.projectId
//    task/wiki/announcement/:id 라우트는 DB에서 해당 레코드의 project_id를 조회하여 사용
requireProjectRole(...roles: ('owner'|'admin'|'member'|'viewer')[]): Middleware

// 4. 프로젝트 멤버 여부만 확인 (역할 무관)
requireProjectMember(): Middleware
```

### 기존 라우트 보호 적용

```
GET    /api/users              → authMiddleware
GET    /api/projects           → authMiddleware (member/viewer는 참여 프로젝트만 반환)
POST   /api/projects           → auth + requireRole('owner','admin')
PUT    /api/projects/:id       → auth + requireProjectRole('owner','admin')
DELETE /api/projects/:id       → auth + requireProjectRole('owner','admin')
PUT    /api/workflow/:id        → auth + requireProjectRole('owner','admin')

GET    /api/tasks?projectId=   → auth + requireProjectMember() (query.projectId 기준)
POST   /api/tasks              → auth + requireProjectRole('owner','admin','member')
PUT    /api/tasks/:id          → auth + requireProjectRole('owner','admin','member') (DB에서 task.project_id 조회)
DELETE /api/tasks/:id          → auth + requireProjectRole('owner','admin','member') (DB에서 task.project_id 조회)

POST   /api/wiki               → auth + requireProjectRole('owner','admin','member')
PUT    /api/wiki/:id           → auth + requireProjectRole('owner','admin','member')
DELETE /api/wiki/:id           → auth + requireProjectRole('owner','admin','member')

POST   /api/announcements      → auth + requireProjectRole('owner','admin','member')
PUT    /api/announcements/:id  → auth + requireProjectRole('owner','admin','member')
DELETE /api/announcements/:id  → auth + requireProjectRole('owner','admin','member')
PATCH  /api/announcements/:id/pin → auth + requireProjectRole('owner','admin')

POST   /api/worklogs           → auth + requireProjectRole('owner','admin','member')
DELETE /api/worklogs/:id       → auth (본인 로그 또는 project owner/admin만 삭제 가능. DB에서 worklog.user_id 비교)

POST   /api/files              → auth + requireProjectRole('owner','admin','member')
DELETE /api/files/:id          → auth + requireProjectRole('owner','admin','member')

POST   /api/polls              → auth + requireProjectRole('owner','admin','member')
POST   /api/polls/:id/vote     → auth (멤버 여부만 확인, viewer도 가능)
DELETE /api/polls/:id/vote     → auth
POST   /api/polls/:id/close    → auth + requireProjectRole('owner','admin','member')
DELETE /api/polls/:id          → auth + requireProjectRole('owner','admin','member')

POST   /api/timeline           → authMiddleware
```

### 환경 변수 추가 (.env)

```env
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

---

## 파일 구조

### 백엔드 신규/변경

```
server/src/
├── middleware/
│   └── auth.ts              # authMiddleware, requireRole, requireProjectRole
├── routes/
│   ├── auth.ts              # register, login, refresh, logout, me
│   ├── admin.ts             # users 목록, approve, reject, role 변경
│   ├── projects.ts          # 기존 + auth 미들웨어 적용
│   ├── tasks.ts             # 기존 + auth 미들웨어 적용
│   ├── wiki.ts              # 기존 + auth 미들웨어 적용
│   ├── announcements.ts     # 기존 + auth 미들웨어 적용
│   ├── worklogs.ts          # 기존 + auth 미들웨어 적용
│   ├── files.ts             # 기존 + auth 미들웨어 적용
│   ├── polls.ts             # 기존 + auth 미들웨어 적용
│   └── timeline.ts          # 기존 + auth 미들웨어 적용
└── migrate.ts               # password_hash, status 컬럼 추가 + refresh_tokens 테이블
```

### 프론트엔드 신규/변경

```
src/
├── store/
│   ├── useAuthStore.ts      # accessToken, currentUser, login/logout 액션
│   └── useUIStore.ts        # selectedProjectId만 (currentUserId 제거)
├── hooks/
│   └── useAuth.ts           # 앱 초기화 시 토큰 복원 + /api/auth/me 호출
├── lib/
│   └── api.ts               # axios: Authorization 헤더 + 401 시 자동 refresh
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx  # 비로그인 → /login, pending → 안내
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx    # 실제 API 연결 (기존 목업 교체)
│   │   └── RegisterPage.tsx # 신규: 이메일·이름·비밀번호 입력
│   └── admin/
│       └── AdminPage.tsx    # 신규: 유저 목록 테이블 + 승인/거절/역할 변경
└── App.tsx                  # ProtectedRoute 적용, /register·/admin 라우트 추가
```

---

## 프론트엔드 상세

### useAuthStore

```typescript
interface AuthState {
  accessToken: string | null;
  currentUser: { id: string; name: string; email: string; role: GlobalRole; status: string } | null;
  setAuth: (token: string, user: AuthState['currentUser']) => void;
  clearAuth: () => void;
}
```

### useAuth 훅 (앱 초기화)

앱 시작 시 localStorage의 refreshToken으로 `/api/auth/refresh` 호출 → 성공하면 accessToken + currentUser 복원. 실패하면 `/login` 리다이렉트.

### axios interceptor

```typescript
// Request: Authorization: Bearer <accessToken> 자동 삽입
// Response: 401 수신 시
//   1. /api/auth/refresh 호출
//   2. 성공 → 새 accessToken 저장 + 원래 요청 재시도
//   3. 실패 → clearAuth() + /login 리다이렉트
```

### ProtectedRoute

```typescript
// 비로그인 → /login
// status='pending' → "승인 대기 중" 안내 페이지
// adminOnly=true + role이 member/viewer → /dashboard 리다이렉트
```

### usePermission 훅

```typescript
// 컴포넌트에서 권한 확인용
const { canCreateProject, canEditTask, isProjectAdmin } = usePermission(projectId?)
```

### AdminPage

- 탭: 전체 / 승인 대기 / 활성 / 거절됨
- 각 유저 행: 이름, 이메일, 역할, 상태, 승인·거절·역할 변경 버튼
- owner/admin만 접근 가능

---

## 시드 데이터 변경

기존 `server/src/seed-db.ts`에 아래 내용 추가:

```sql
-- 기존 유저에 password_hash, status 추가
UPDATE users SET
  password_hash = '<bcrypt hash of cmworld1234!>',
  status = 'active'
WHERE id IN ('u1','u2','u3','u4','u5');
```

개발 환경 로그인 계정:
| 이메일 | 비밀번호 | 역할 |
|--------|----------|------|
| yoohwanihn@cmworld.co.kr | cmworld1234! | owner |
| minjun.kim@cmworld.co.kr | cmworld1234! | admin |
| seoyeon.lee@cmworld.co.kr | cmworld1234! | member |
| jiho.park@cmworld.co.kr | cmworld1234! | member |
| sua.choi@cmworld.co.kr | cmworld1234! | viewer |

---

## 범위 외 (이번 구현 제외)

- 이메일 발송 (회원가입 인증 메일, 비밀번호 찾기)
- 소셜 로그인 (Google, Kakao 등)
- 2FA
- 비밀번호 변경 페이지
