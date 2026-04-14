import type {
  User, Project, Task, WikiPage, Announcement, TimelineEvent, FileItem,
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

// ── Files ──────────────────────────────────────────────────────
export const MOCK_FILES_RAW: FileItem[] = [
  { id: 'f1', projectId: 'p1', name: 'UI_스토리보드_v2.pdf',            size: 4_820_000, mimeType: 'application/pdf', uploaderId: 'u4', createdAt: '2026-04-13T09:40:00' },
  { id: 'f2', projectId: 'p1', name: 'ERD_설계서_최종.png',              size: 1_240_000, mimeType: 'image/png', uploaderId: 'u3', createdAt: '2026-03-14T17:00:00' },
  { id: 'f3', projectId: 'p1', name: 'API_명세서_v1.3.xlsx',             size: 320_000, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploaderId: 'u1', createdAt: '2026-04-05T11:30:00' },
  { id: 'f4', projectId: 'p1', name: 'RFP_프로젝트관리시스템.docx',      size: 890_000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploaderId: 'u1', createdAt: '2026-03-01T09:00:00' },
  { id: 'f5', projectId: 'p1', name: '스프린트1_완료보고.pptx',           size: 6_500_000, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', uploaderId: 'u2', createdAt: '2026-03-31T18:00:00' },
];
