import type {
  User, Project, Task, WikiPage, Announcement, TimelineEvent, FileItem, WorkLog, Poll,
} from '../types';
import { DEFAULT_WORKFLOW } from '../types';

// ── Users ──────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 'u1', name: '유환인',  email: 'yoohwanihn@cmworld.co.kr',  role: 'owner' },
  { id: 'u2', name: '김민준',  email: 'minjun.kim@cmworld.co.kr',  role: 'admin' },
  { id: 'u3', name: '이서연',  email: 'seoyeon.lee@cmworld.co.kr', role: 'member' },
  { id: 'u4', name: '박지호',  email: 'jiho.park@cmworld.co.kr',   role: 'member' },
  { id: 'u5', name: '최수아',  email: 'sua.choi@cmworld.co.kr',    role: 'viewer' },
];

// ── Projects ───────────────────────────────────────────────────
export const MOCK_PROJECTS_RAW: Project[] = [
  {
    id: 'p1',
    name: '차세대 프로젝트 허브',
    description: '전사 업무 통합 협업 플랫폼 구축',
    color: '#3b82f6',
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    members: [
      { ...MOCK_USERS[0], role: 'owner' },
      { ...MOCK_USERS[1], role: 'admin' },
      { ...MOCK_USERS[2], role: 'member' },
      { ...MOCK_USERS[3], role: 'member' },
    ],
    workflow: [...DEFAULT_WORKFLOW],
    tags: [
      { id: 'tag-be',     name: '백엔드',      color: '#10b981' },
      { id: 'tag-fe',     name: '프론트엔드',  color: '#ef4444' },
      { id: 'tag-design', name: '디자인',      color: '#f59e0b' },
      { id: 'tag-plan',   name: '기획',        color: '#8b5cf6' },
      { id: 'tag-infra',  name: '인프라',      color: '#64748b' },
    ],
    createdAt: '2026-03-01T09:00:00',
    updatedAt: '2026-04-13T09:00:00',
  },
  {
    id: 'p2',
    name: '모바일 앱 리뉴얼',
    description: 'iOS / Android 앱 UI/UX 전면 개편',
    color: '#8b5cf6',
    startDate: '2026-02-01',
    endDate: '2026-04-30',
    members: [
      { ...MOCK_USERS[1], role: 'owner' },
      { ...MOCK_USERS[2], role: 'member' },
      { ...MOCK_USERS[3], role: 'member' },
      { ...MOCK_USERS[4], role: 'viewer' },
    ],
    workflow: [...DEFAULT_WORKFLOW],
    tags: [
      { id: 'p2-tag-ios',     name: 'iOS',     color: '#6366f1' },
      { id: 'p2-tag-android', name: 'Android', color: '#22c55e' },
      { id: 'p2-tag-ux',      name: 'UX',      color: '#f59e0b' },
    ],
    createdAt: '2026-02-01T09:00:00',
    updatedAt: '2026-04-12T17:30:00',
  },
  {
    id: 'p3',
    name: 'API 게이트웨이 고도화',
    description: '마이크로서비스 간 API 통합 및 성능 개선',
    color: '#10b981',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    members: [
      { ...MOCK_USERS[0], role: 'owner' },
      { ...MOCK_USERS[1], role: 'admin' },
      { ...MOCK_USERS[2], role: 'member' },
    ],
    workflow: [...DEFAULT_WORKFLOW],
    tags: [
      { id: 'p3-tag-api',  name: 'API',    color: '#3b82f6' },
      { id: 'p3-tag-perf', name: '성능',   color: '#f43f5e' },
    ],
    createdAt: '2026-04-01T09:00:00',
    updatedAt: '2026-04-10T14:00:00',
  },
  {
    id: 'p4',
    name: '데이터 분석 대시보드',
    description: 'BI 대시보드 신규 구축 및 리포트 자동화',
    color: '#f59e0b',
    startDate: '2026-01-15',
    endDate: '2026-04-15',
    members: MOCK_USERS.map((u) => ({ ...u })),
    workflow: [...DEFAULT_WORKFLOW],
    tags: [
      { id: 'p4-tag-bi',  name: 'BI',    color: '#f59e0b' },
      { id: 'p4-tag-sql', name: 'SQL',   color: '#06b6d4' },
    ],
    createdAt: '2026-01-15T09:00:00',
    updatedAt: '2026-04-13T11:20:00',
  },
];

// ── Tasks ──────────────────────────────────────────────────────
export const MOCK_TASKS_RAW: Task[] = [
  {
    id: 't1', projectId: 'p1', title: '요구사항 정의서 작성',
    description: '기능 요구사항 및 비기능 요구사항 문서화',
    statusId: 'done', priority: 'high', assigneeIds: ['u2'],
    tagIds: ['tag-plan'], startDate: '2026-03-01', dueDate: '2026-03-07',
    estimatedHours: 16, loggedHours: 18, order: 0, blockedBy: [],
    createdAt: '2026-03-01T09:00:00', updatedAt: '2026-03-07T18:00:00',
  },
  {
    id: 't2', projectId: 'p1', title: 'ERD 설계 및 DB 스키마 확정',
    description: '엔티티 관계도 작성 및 PostgreSQL 스키마 정의',
    statusId: 'done', priority: 'high', assigneeIds: ['u3'],
    tagIds: ['tag-be'], startDate: '2026-03-08', dueDate: '2026-03-14',
    estimatedHours: 24, loggedHours: 22, order: 1, blockedBy: ['t1'],
    createdAt: '2026-03-08T09:00:00', updatedAt: '2026-03-14T18:00:00',
  },
  {
    id: 't3', projectId: 'p1', title: 'UI/UX 스토리보드 작성',
    description: '주요 화면 와이어프레임 및 프로토타입 제작',
    statusId: 'review', priority: 'high', assigneeIds: ['u4'],
    tagIds: ['tag-design'], startDate: '2026-03-10', dueDate: '2026-03-21',
    estimatedHours: 40, loggedHours: 38, order: 0, blockedBy: ['t1'],
    createdAt: '2026-03-10T09:00:00', updatedAt: '2026-03-20T16:00:00',
  },
  {
    id: 't4', projectId: 'p1', title: '로그인/인증 API 구현',
    description: 'JWT 기반 토큰 인증, 소셜 로그인 연동',
    statusId: 'done', priority: 'urgent', assigneeIds: ['u1'],
    tagIds: ['tag-be'], startDate: '2026-03-15', dueDate: '2026-03-22',
    estimatedHours: 32, loggedHours: 28, order: 2, blockedBy: ['t2'],
    createdAt: '2026-03-15T09:00:00', updatedAt: '2026-03-22T18:00:00',
  },
  {
    id: 't5', projectId: 'p1', title: '칸반 보드 컴포넌트 개발',
    description: '드래그 앤 드롭 기능 포함한 칸반 UI 구현',
    statusId: 'in_progress', priority: 'high', assigneeIds: ['u1', 'u2'],
    tagIds: ['tag-fe'], startDate: '2026-04-01', dueDate: '2026-04-15',
    estimatedHours: 48, loggedHours: 24, order: 0, blockedBy: ['t3', 't4'],
    createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-12T18:00:00',
  },
  {
    id: 't6', projectId: 'p1', title: '간트차트 인터랙션 구현',
    description: '마우스 드래그로 일정 조정 및 선후행 관계 시각화',
    statusId: 'in_progress', priority: 'high', assigneeIds: ['u3'],
    tagIds: ['tag-fe'], startDate: '2026-04-08', dueDate: '2026-04-22',
    estimatedHours: 56, loggedHours: 20, order: 1, blockedBy: ['t3'],
    createdAt: '2026-04-08T09:00:00', updatedAt: '2026-04-12T16:00:00',
  },
  {
    id: 't7', projectId: 'p1', title: '프로젝트 위키 기능 개발',
    description: '마크다운 에디터, 버전 관리 기능 구현',
    statusId: 'todo', priority: 'medium', assigneeIds: ['u4'],
    tagIds: ['tag-fe'], startDate: '2026-04-20', dueDate: '2026-04-30',
    estimatedHours: 32, loggedHours: 0, order: 0, blockedBy: [],
    createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-01T09:00:00',
  },
  {
    id: 't8', projectId: 'p1', title: '파일 업로드/다운로드 기능',
    description: '프로젝트별 파일 저장소 및 미리보기 기능',
    statusId: 'todo', priority: 'medium', assigneeIds: ['u2'],
    tagIds: ['tag-be'], startDate: '2026-04-25', dueDate: '2026-05-05',
    estimatedHours: 24, loggedHours: 0, order: 1, blockedBy: [],
    createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-01T09:00:00',
  },
  {
    id: 't9', projectId: 'p1', title: '실시간 타임라인 피드',
    description: '업무 변경 이력을 뉴스피드 형식으로 표시',
    statusId: 'todo', priority: 'low', assigneeIds: [],
    tagIds: ['tag-fe'], startDate: '2026-05-01', dueDate: '2026-05-10',
    estimatedHours: 20, loggedHours: 0, order: 2, blockedBy: [],
    createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-01T09:00:00',
  },
  {
    id: 't10', projectId: 'p1', title: '성능 최적화 및 배포 준비',
    description: '페이징, 무한스크롤, 번들 최적화',
    statusId: 'todo', priority: 'high', assigneeIds: ['u1'],
    tagIds: ['tag-infra'], startDate: '2026-05-15', dueDate: '2026-05-30',
    estimatedHours: 40, loggedHours: 0, order: 3, blockedBy: [],
    createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-01T09:00:00',
  },
];

// ── Wiki ───────────────────────────────────────────────────────
export const MOCK_WIKI_PAGES_RAW: WikiPage[] = [
  {
    id: 'w1', projectId: 'p1', title: '프로젝트 개요 및 목표',
    content: '# 프로젝트 개요\n\n차세대 스마트 프로젝트 협업 관리 시스템은...\n\n## 목표\n- 업무 투명성 확보\n- 실시간 협업 지원',
    version: 3, authorId: 'u1', updatedAt: '2026-04-10T10:00:00',
  },
  {
    id: 'w2', projectId: 'p1', title: '개발 환경 설정 가이드',
    content: '# 개발 환경 설정\n\n## 사전 요구사항\n- Node.js 20+\n- PostgreSQL 15+\n\n## 설치 방법\n```bash\nnpm install\n```',
    version: 5, authorId: 'u2', updatedAt: '2026-04-12T14:30:00',
  },
  {
    id: 'w3', projectId: 'p1', title: '코딩 컨벤션',
    content: '# 코딩 컨벤션\n\n## TypeScript\n- 타입 명시 필수\n- any 사용 금지\n\n## 컴포넌트\n- 함수형 컴포넌트 사용',
    version: 2, authorId: 'u3', updatedAt: '2026-04-08T09:00:00',
  },
  {
    id: 'w4', projectId: 'p1', title: 'API 명세 요약',
    content: '# API 명세\n\n## 인증\n`POST /api/auth/login`\n\n## 프로젝트\n`GET /api/projects`',
    version: 7, authorId: 'u1', updatedAt: '2026-04-13T08:00:00',
  },
];

// ── Announcements ─────────────────────────────────────────────
export const MOCK_ANNOUNCEMENTS_RAW: Announcement[] = [
  {
    id: 'a1', projectId: 'p1',
    title: '4월 스프린트 계획 공유',
    content: '이번 스프린트는 칸반 보드와 간트차트 핵심 기능 완성에 집중합니다.',
    authorId: 'u1', isPinned: true, createdAt: '2026-04-01T09:00:00',
  },
  {
    id: 'a2', projectId: 'p1',
    title: '코드 리뷰 일정 변경 안내',
    content: '매주 수요일 오후 3시로 코드 리뷰 시간이 변경되었습니다.',
    authorId: 'u2', isPinned: false, createdAt: '2026-04-08T11:00:00',
  },
];

// ── Timeline ───────────────────────────────────────────────────
export const MOCK_TIMELINE_RAW: TimelineEvent[] = [
  // Apr 14
  { id: 'e1',  type: 'task_completed', actorId: 'u1', projectId: 'p1', payload: { taskTitle: '로그인/인증 API 구현' },          createdAt: '2026-04-14T11:30:00' },
  { id: 'e2',  type: 'task_updated',   actorId: 'u3', projectId: 'p1', payload: { taskTitle: '간트차트 인터랙션 구현', field: 'status', from: 'todo', to: 'in_progress' }, createdAt: '2026-04-14T10:15:00' },
  { id: 'e3',  type: 'file_uploaded',  actorId: 'u4', projectId: 'p1', payload: { fileName: 'UI_스토리보드_v2.pdf' },           createdAt: '2026-04-14T09:40:00' },
  // Apr 13
  { id: 'e4',  type: 'task_completed', actorId: 'u2', projectId: 'p1', payload: { taskTitle: '칸반 보드 수영레인 구현' },        createdAt: '2026-04-13T17:20:00' },
  { id: 'e5',  type: 'task_completed', actorId: 'u1', projectId: 'p1', payload: { taskTitle: '업무 의존성(선후행) 관리' },       createdAt: '2026-04-13T15:00:00' },
  { id: 'e6',  type: 'comment_added',  actorId: 'u2', projectId: 'p1', payload: { taskTitle: 'UI/UX 스토리보드 작성', comment: '전체적인 흐름은 좋은데 모바일 레이아웃 재검토가 필요합니다.' }, createdAt: '2026-04-13T12:20:00' },
  // Apr 12
  { id: 'e7',  type: 'task_completed', actorId: 'u3', projectId: 'p1', payload: { taskTitle: '프로젝트 워크플로우 커스터마이징' }, createdAt: '2026-04-12T18:00:00' },
  { id: 'e8',  type: 'task_created',   actorId: 'u1', projectId: 'p1', payload: { taskTitle: '성능 최적화 및 배포 준비' },       createdAt: '2026-04-12T14:00:00' },
  // Apr 11
  { id: 'e9',  type: 'task_completed', actorId: 'u4', projectId: 'p1', payload: { taskTitle: 'UI/UX 스토리보드 작성' },          createdAt: '2026-04-11T17:30:00' },
  { id: 'e10', type: 'task_completed', actorId: 'u1', projectId: 'p1', payload: { taskTitle: '태그 시스템 구현' },               createdAt: '2026-04-11T14:00:00' },
  { id: 'e11', type: 'member_joined',  actorId: 'u5', projectId: 'p1', payload: {},                                              createdAt: '2026-04-11T09:00:00' },
  // Apr 10
  { id: 'e12', type: 'task_completed', actorId: 'u2', projectId: 'p1', payload: { taskTitle: '칸반 보드 컴포넌트 개발' },        createdAt: '2026-04-10T17:00:00' },
  { id: 'e13', type: 'task_updated',   actorId: 'u2', projectId: 'p1', payload: { taskTitle: '칸반 보드 컴포넌트 개발', field: 'priority', from: 'medium', to: 'high' }, createdAt: '2026-04-10T16:30:00' },
  // Apr 9
  { id: 'e14', type: 'task_completed', actorId: 'u3', projectId: 'p1', payload: { taskTitle: 'ERD 설계 및 DB 스키마 확정' },     createdAt: '2026-04-09T18:00:00' },
  { id: 'e15', type: 'task_completed', actorId: 'u5', projectId: 'p1', payload: { taskTitle: '프로젝트 멤버 역할 관리' },        createdAt: '2026-04-09T15:00:00' },
  // Apr 8
  { id: 'e16', type: 'task_completed', actorId: 'u1', projectId: 'p1', payload: { taskTitle: '대시보드 기본 레이아웃' },         createdAt: '2026-04-08T16:30:00' },
  // Apr 7
  { id: 'e17', type: 'task_completed', actorId: 'u2', projectId: 'p1', payload: { taskTitle: 'REST API 기본 라우트 설계' },      createdAt: '2026-04-07T17:00:00' },
  { id: 'e18', type: 'task_completed', actorId: 'u4', projectId: 'p1', payload: { taskTitle: '컴포넌트 디자인 시스템 구축' },    createdAt: '2026-04-07T14:00:00' },
  // Apr 5
  { id: 'e19', type: 'task_completed', actorId: 'u3', projectId: 'p1', payload: { taskTitle: 'Docker 환경 구성' },               createdAt: '2026-04-05T16:00:00' },
  // Apr 3
  { id: 'e20', type: 'project_created', actorId: 'u1', projectId: 'p1', payload: { projectName: '프로젝트 관리 시스템' },        createdAt: '2026-04-03T09:00:00' },
];

// ── WorkLogs ───────────────────────────────────────────────────
// 태스크 ID는 seed의 t1~t12 기준
export const MOCK_WORK_LOGS_RAW: WorkLog[] = [
  // t1: 로그인/인증 API (완료, estimatedHours:8)
  { id: 'wl1',  taskId: 't1',  userId: 'u1', hours: 3,   note: '기본 JWT 구조 설계',          date: '2026-04-08', createdAt: '2026-04-08T18:00:00' },
  { id: 'wl2',  taskId: 't1',  userId: 'u1', hours: 2.5, note: '토큰 갱신 로직 구현',          date: '2026-04-09', createdAt: '2026-04-09T17:30:00' },
  { id: 'wl3',  taskId: 't1',  userId: 'u1', hours: 2,   note: '단위 테스트 작성 및 수정',     date: '2026-04-10', createdAt: '2026-04-10T16:00:00' },
  // t2: 칸반 보드 컴포넌트 (완료, estimatedHours:12)
  { id: 'wl4',  taskId: 't2',  userId: 'u2', hours: 4,   note: 'DndKit 드래그 구현',           date: '2026-04-08', createdAt: '2026-04-08T19:00:00' },
  { id: 'wl5',  taskId: 't2',  userId: 'u2', hours: 4,   note: '수영레인 뷰 구현',             date: '2026-04-09', createdAt: '2026-04-09T18:30:00' },
  { id: 'wl6',  taskId: 't2',  userId: 'u2', hours: 3.5, note: '업무 로드 패널 추가',          date: '2026-04-10', createdAt: '2026-04-10T17:00:00' },
  // t3: 간트차트 인터랙션 (진행 중, estimatedHours:16)
  { id: 'wl7',  taskId: 't3',  userId: 'u3', hours: 4,   note: '바 드래그 기본 구현',          date: '2026-04-11', createdAt: '2026-04-11T18:00:00' },
  { id: 'wl8',  taskId: 't3',  userId: 'u3', hours: 3,   note: '선후행 SVG 화살표',            date: '2026-04-12', createdAt: '2026-04-12T17:00:00' },
  // t4: ERD 설계 (완료, estimatedHours:6)
  { id: 'wl9',  taskId: 't4',  userId: 'u3', hours: 2.5, note: '초기 ERD 작성',               date: '2026-04-06', createdAt: '2026-04-06T16:00:00' },
  { id: 'wl10', taskId: 't4',  userId: 'u3', hours: 2,   note: '팀 리뷰 반영 수정',            date: '2026-04-07', createdAt: '2026-04-07T15:00:00' },
  // t5: UI/UX 스토리보드 (완료, estimatedHours:8)
  { id: 'wl11', taskId: 't5',  userId: 'u4', hours: 3,   note: '와이어프레임 초안',            date: '2026-04-07', createdAt: '2026-04-07T17:00:00' },
  { id: 'wl12', taskId: 't5',  userId: 'u4', hours: 4,   note: '피그마 목업 완성',             date: '2026-04-08', createdAt: '2026-04-08T18:30:00' },
  // t6: 대시보드 차트 (진행 중, estimatedHours:10)
  { id: 'wl13', taskId: 't6',  userId: 'u1', hours: 3,   note: 'SVG 도넛 차트 구현',          date: '2026-04-12', createdAt: '2026-04-12T17:00:00' },
  { id: 'wl14', taskId: 't6',  userId: 'u1', hours: 2.5, note: '번다운 라인 차트',             date: '2026-04-13', createdAt: '2026-04-13T16:30:00' },
  // t7: REST API 라우트 (완료, estimatedHours:8)
  { id: 'wl15', taskId: 't7',  userId: 'u2', hours: 4,   note: '기본 CRUD 엔드포인트',        date: '2026-04-05', createdAt: '2026-04-05T17:00:00' },
  { id: 'wl16', taskId: 't7',  userId: 'u2', hours: 3.5, note: '인증 미들웨어 연동',           date: '2026-04-06', createdAt: '2026-04-06T18:00:00' },
  // t8: Docker 환경 구성 (완료, estimatedHours:4)
  { id: 'wl17', taskId: 't8',  userId: 'u3', hours: 2,   note: 'Dockerfile 작성',             date: '2026-04-04', createdAt: '2026-04-04T15:00:00' },
  { id: 'wl18', taskId: 't8',  userId: 'u3', hours: 1.5, note: 'docker-compose 설정',         date: '2026-04-05', createdAt: '2026-04-05T14:00:00' },
];

// ── Files ──────────────────────────────────────────────────────
export const MOCK_FILES_RAW: FileItem[] = [
  { id: 'f1', projectId: 'p1', name: 'UI_스토리보드_v2.pdf',            size: 4_820_000, mimeType: 'application/pdf', uploaderId: 'u4', createdAt: '2026-04-13T09:40:00' },
  { id: 'f2', projectId: 'p1', name: 'ERD_설계서_최종.png',              size: 1_240_000, mimeType: 'image/png', uploaderId: 'u3', createdAt: '2026-03-14T17:00:00' },
  { id: 'f3', projectId: 'p1', name: 'API_명세서_v1.3.xlsx',             size: 320_000, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploaderId: 'u1', createdAt: '2026-04-05T11:30:00' },
  { id: 'f4', projectId: 'p1', name: 'RFP_프로젝트관리시스템.docx',      size: 890_000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploaderId: 'u1', createdAt: '2026-03-01T09:00:00' },
  { id: 'f5', projectId: 'p1', name: '스프린트1_완료보고.pptx',           size: 6_500_000, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', uploaderId: 'u2', createdAt: '2026-03-31T18:00:00' },
];

// ── Polls ──────────────────────────────────────────────────────
export const MOCK_POLLS_RAW: Poll[] = [
  {
    id: 'poll1',
    projectId: 'p1',
    title: '스프린트 회고 방식 선택',
    description: '이번 스프린트부터 적용할 회고 방식을 선택해 주세요.',
    options: [
      { id: 'poll1-o1', label: 'KPT (Keep / Problem / Try)', voterIds: ['u2', 'u3'] },
      { id: 'poll1-o2', label: 'Start / Stop / Continue',    voterIds: ['u4'] },
      { id: 'poll1-o3', label: '4L (Liked / Learned / Lacked / Longed for)', voterIds: [] },
    ],
    isMultiple: false,
    showResultsBeforeClose: true,
    status: 'active',
    dueDate: '2026-04-20',
    authorId: 'u1',
    createdAt: '2026-04-10T10:00:00',
  },
  {
    id: 'poll2',
    projectId: 'p1',
    title: '다음 스프린트 우선 구현 기능 (복수 선택)',
    description: '다음 스프린트에 집중할 기능을 모두 선택해 주세요. 상위 2개를 우선 진행합니다.',
    options: [
      { id: 'poll2-o1', label: '글로벌 검색 기능',    voterIds: ['u1', 'u3'] },
      { id: 'poll2-o2', label: '인앱 알림 센터',      voterIds: ['u1', 'u2', 'u3'] },
      { id: 'poll2-o3', label: '모바일 반응형 지원',  voterIds: ['u2'] },
      { id: 'poll2-o4', label: '다크 모드',           voterIds: ['u3', 'u4'] },
    ],
    isMultiple: true,
    showResultsBeforeClose: false,
    status: 'active',
    dueDate: undefined,
    authorId: 'u1',
    createdAt: '2026-04-12T09:30:00',
  },
  {
    id: 'poll3',
    projectId: 'p2',
    title: '앱 아이콘 디자인 최종 선택',
    description: '디자인 팀이 제안한 3가지 안 중 최종 아이콘을 선택해 주세요.',
    options: [
      { id: 'poll3-o1', label: '안 A — 미니멀 라인 스타일', voterIds: ['u1', 'u3'] },
      { id: 'poll3-o2', label: '안 B — 그라디언트 입체형',  voterIds: ['u2', 'u4', 'u5'] },
      { id: 'poll3-o3', label: '안 C — 플랫 컬러 블록',     voterIds: [] },
    ],
    isMultiple: false,
    showResultsBeforeClose: true,
    status: 'closed',
    dueDate: '2026-04-07',
    authorId: 'u2',
    createdAt: '2026-04-01T14:00:00',
  },
  {
    id: 'poll4',
    projectId: 'p2',
    title: '모바일 앱 출시 일정 조율',
    description: '팀 상황을 고려해 현실적인 출시 일정을 선택해 주세요.',
    options: [
      { id: 'poll4-o1', label: '4월 말 (4/28)',   voterIds: [] },
      { id: 'poll4-o2', label: '5월 초 (5/7)',    voterIds: [] },
      { id: 'poll4-o3', label: '5월 중순 (5/14)', voterIds: [] },
    ],
    isMultiple: false,
    showResultsBeforeClose: false,
    status: 'active',
    dueDate: '2026-04-18',
    authorId: 'u2',
    createdAt: '2026-04-13T11:00:00',
  },
];
