import type { User, Project, Task, WikiPage, TimelineEvent, FileItem, Announcement } from '../types';

// ── Users ──────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 'u1', name: '유환인', email: 'yoohwanihn@cmworld.co.kr', role: 'owner',  avatar: '' },
  { id: 'u2', name: '김민준', email: 'minjun.kim@cmworld.co.kr', role: 'admin',  avatar: '' },
  { id: 'u3', name: '이서연', email: 'seoyeon.lee@cmworld.co.kr', role: 'member', avatar: '' },
  { id: 'u4', name: '박지호', email: 'jiho.park@cmworld.co.kr',  role: 'member', avatar: '' },
  { id: 'u5', name: '최수아', email: 'sua.choi@cmworld.co.kr',   role: 'viewer', avatar: '' },
];

export const CURRENT_USER = MOCK_USERS[0];

// ── Projects ───────────────────────────────────────────────────
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: '차세대 프로젝트 허브',
    description: '전사 업무 통합 협업 플랫폼 구축',
    color: '#3b82f6',
    progress: 42,
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    members: MOCK_USERS.slice(0, 4),
    taskCounts: { todo: 12, in_progress: 7, review: 3, done: 18 },
    updatedAt: '2026-04-13T09:00:00',
  },
  {
    id: 'p2',
    name: '모바일 앱 리뉴얼',
    description: 'iOS / Android 앱 UI/UX 전면 개편',
    color: '#8b5cf6',
    progress: 67,
    startDate: '2026-02-01',
    endDate: '2026-04-30',
    members: MOCK_USERS.slice(1, 5),
    taskCounts: { todo: 4, in_progress: 5, review: 2, done: 31 },
    updatedAt: '2026-04-12T17:30:00',
  },
  {
    id: 'p3',
    name: 'API 게이트웨이 고도화',
    description: '마이크로서비스 간 API 통합 및 성능 개선',
    color: '#10b981',
    progress: 18,
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    members: MOCK_USERS.slice(0, 3),
    taskCounts: { todo: 22, in_progress: 3, review: 0, done: 5 },
    updatedAt: '2026-04-10T14:00:00',
  },
  {
    id: 'p4',
    name: '데이터 분석 대시보드',
    description: 'BI 대시보드 신규 구축 및 리포트 자동화',
    color: '#f59e0b',
    progress: 89,
    startDate: '2026-01-15',
    endDate: '2026-04-15',
    members: MOCK_USERS,
    taskCounts: { todo: 1, in_progress: 2, review: 1, done: 47 },
    updatedAt: '2026-04-13T11:20:00',
  },
];

// ── Tasks ──────────────────────────────────────────────────────
export const MOCK_TASKS: Task[] = [
  {
    id: 't1', projectId: 'p1', title: '요구사항 정의서 작성', description: '기능 요구사항 및 비기능 요구사항 문서화',
    status: 'done', priority: 'high', assignees: [MOCK_USERS[1]], tags: [{ id: 'tag1', name: '기획', color: '#8b5cf6' }],
    startDate: '2026-03-01', dueDate: '2026-03-07', estimatedHours: 16, loggedHours: 18,
    order: 0, createdAt: '2026-03-01T09:00:00', updatedAt: '2026-03-07T18:00:00',
  },
  {
    id: 't2', projectId: 'p1', title: 'ERD 설계 및 DB 스키마 확정', description: '엔티티 관계도 작성 및 PostgreSQL 스키마 정의',
    status: 'done', priority: 'high', assignees: [MOCK_USERS[2]], tags: [{ id: 'tag2', name: '설계', color: '#3b82f6' }],
    startDate: '2026-03-08', dueDate: '2026-03-14', estimatedHours: 24, loggedHours: 22,
    order: 1, createdAt: '2026-03-08T09:00:00', updatedAt: '2026-03-14T18:00:00',
  },
  {
    id: 't3', projectId: 'p1', title: 'UI/UX 스토리보드 작성', description: '주요 화면 와이어프레임 및 프로토타입 제작',
    status: 'review', priority: 'high', assignees: [MOCK_USERS[3]], tags: [{ id: 'tag3', name: '디자인', color: '#f59e0b' }],
    startDate: '2026-03-10', dueDate: '2026-03-21', estimatedHours: 40, loggedHours: 38,
    order: 2, createdAt: '2026-03-10T09:00:00', updatedAt: '2026-03-20T16:00:00',
  },
  {
    id: 't4', projectId: 'p1', title: '로그인/인증 API 구현', description: 'JWT 기반 토큰 인증, 소셜 로그인 연동',
    status: 'done', priority: 'urgent', assignees: [MOCK_USERS[0]], tags: [{ id: 'tag4', name: '백엔드', color: '#10b981' }],
    startDate: '2026-03-15', dueDate: '2026-03-22', estimatedHours: 32, loggedHours: 28,
    order: 3, createdAt: '2026-03-15T09:00:00', updatedAt: '2026-03-22T18:00:00',
  },
  {
    id: 't5', projectId: 'p1', title: '칸반 보드 컴포넌트 개발', description: '드래그 앤 드롭 기능 포함한 칸반 UI 구현',
    status: 'in_progress', priority: 'high', assignees: [MOCK_USERS[0], MOCK_USERS[1]], tags: [{ id: 'tag5', name: '프론트엔드', color: '#ef4444' }],
    startDate: '2026-04-01', dueDate: '2026-04-15', estimatedHours: 48, loggedHours: 24,
    order: 4, createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-12T18:00:00',
  },
  {
    id: 't6', projectId: 'p1', title: '간트차트 인터랙션 구현', description: '마우스 드래그로 일정 조정 및 선후행 관계 시각화',
    status: 'in_progress', priority: 'high', assignees: [MOCK_USERS[2]], tags: [{ id: 'tag5', name: '프론트엔드', color: '#ef4444' }],
    startDate: '2026-04-08', dueDate: '2026-04-22', estimatedHours: 56, loggedHours: 20,
    order: 5, createdAt: '2026-04-08T09:00:00', updatedAt: '2026-04-12T16:00:00',
  },
  {
    id: 't7', projectId: 'p1', title: '프로젝트 위키 기능 개발', description: '마크다운 에디터, 버전 관리 기능 구현',
    status: 'todo', priority: 'medium', assignees: [MOCK_USERS[3]], tags: [{ id: 'tag5', name: '프론트엔드', color: '#ef4444' }],
    startDate: '2026-04-20', dueDate: '2026-04-30', estimatedHours: 32, loggedHours: 0,
    order: 6, createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-01T09:00:00',
  },
  {
    id: 't8', projectId: 'p1', title: '파일 업로드/다운로드 기능', description: '프로젝트별 파일 저장소 및 미리보기 기능',
    status: 'todo', priority: 'medium', assignees: [MOCK_USERS[1]], tags: [{ id: 'tag4', name: '백엔드', color: '#10b981' }],
    startDate: '2026-04-25', dueDate: '2026-05-05', estimatedHours: 24, loggedHours: 0,
    order: 7, createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-01T09:00:00',
  },
  {
    id: 't9', projectId: 'p1', title: '실시간 타임라인 피드', description: '업무 변경 이력을 뉴스피드 형식으로 표시',
    status: 'todo', priority: 'low', assignees: [], tags: [{ id: 'tag5', name: '프론트엔드', color: '#ef4444' }],
    startDate: '2026-05-01', dueDate: '2026-05-10', estimatedHours: 20, loggedHours: 0,
    order: 8, createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-01T09:00:00',
  },
  {
    id: 't10', projectId: 'p1', title: '성능 최적화 및 배포 준비', description: '페이징, 무한스크롤, 번들 최적화',
    status: 'todo', priority: 'high', assignees: [MOCK_USERS[0]], tags: [{ id: 'tag6', name: '인프라', color: '#64748b' }],
    startDate: '2026-05-15', dueDate: '2026-05-30', estimatedHours: 40, loggedHours: 0,
    order: 9, createdAt: '2026-04-01T09:00:00', updatedAt: '2026-04-01T09:00:00',
  },
];

// ── Wiki ───────────────────────────────────────────────────────
export const MOCK_WIKI_PAGES: WikiPage[] = [
  {
    id: 'w1', projectId: 'p1', title: '프로젝트 개요 및 목표',
    content: '# 프로젝트 개요\n\n차세대 스마트 프로젝트 협업 관리 시스템은...\n\n## 목표\n- 업무 투명성 확보\n- 실시간 협업 지원',
    version: 3, author: MOCK_USERS[0], updatedAt: '2026-04-10T10:00:00',
  },
  {
    id: 'w2', projectId: 'p1', title: '개발 환경 설정 가이드',
    content: '# 개발 환경 설정\n\n## 사전 요구사항\n- Node.js 20+\n- PostgreSQL 15+\n\n## 설치 방법\n```bash\nnpm install\n```',
    version: 5, author: MOCK_USERS[1], updatedAt: '2026-04-12T14:30:00',
  },
  {
    id: 'w3', projectId: 'p1', title: '코딩 컨벤션',
    content: '# 코딩 컨벤션\n\n## TypeScript\n- 타입 명시 필수\n- any 사용 금지\n\n## 컴포넌트\n- 함수형 컴포넌트 사용',
    version: 2, author: MOCK_USERS[2], updatedAt: '2026-04-08T09:00:00',
  },
  {
    id: 'w4', projectId: 'p1', title: 'API 명세 요약',
    content: '# API 명세\n\n## 인증\n`POST /api/auth/login`\n\n## 프로젝트\n`GET /api/projects`',
    version: 7, author: MOCK_USERS[0], updatedAt: '2026-04-13T08:00:00',
  },
];

// ── Announcements ─────────────────────────────────────────────
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1', projectId: 'p1',
    title: '4월 스프린트 계획 공유',
    content: '이번 스프린트는 칸반 보드와 간트차트 핵심 기능 완성에 집중합니다. 각자 담당 업무 확인 부탁드립니다.',
    author: MOCK_USERS[0], isPinned: true, createdAt: '2026-04-01T09:00:00',
  },
  {
    id: 'a2', projectId: 'p1',
    title: '코드 리뷰 일정 변경 안내',
    content: '매주 수요일 오후 3시로 코드 리뷰 시간이 변경되었습니다.',
    author: MOCK_USERS[1], isPinned: false, createdAt: '2026-04-08T11:00:00',
  },
];

// ── Timeline Events ────────────────────────────────────────────
export const MOCK_TIMELINE: TimelineEvent[] = [
  { id: 'e1', type: 'task_completed', actor: MOCK_USERS[0], projectId: 'p1', payload: { taskTitle: '로그인/인증 API 구현' }, createdAt: '2026-04-13T11:30:00' },
  { id: 'e2', type: 'task_updated', actor: MOCK_USERS[2], projectId: 'p1', payload: { taskTitle: '간트차트 인터랙션 구현', field: 'status', from: 'todo', to: 'in_progress' }, createdAt: '2026-04-13T10:15:00' },
  { id: 'e3', type: 'file_uploaded', actor: MOCK_USERS[3], projectId: 'p1', payload: { fileName: 'UI_스토리보드_v2.pdf' }, createdAt: '2026-04-13T09:40:00' },
  { id: 'e4', type: 'comment_added', actor: MOCK_USERS[1], projectId: 'p1', payload: { taskTitle: 'UI/UX 스토리보드 작성', comment: '전체적인 흐름은 좋은데 모바일 레이아웃 재검토가 필요합니다.' }, createdAt: '2026-04-12T17:20:00' },
  { id: 'e5', type: 'task_created', actor: MOCK_USERS[0], projectId: 'p1', payload: { taskTitle: '성능 최적화 및 배포 준비' }, createdAt: '2026-04-12T14:00:00' },
  { id: 'e6', type: 'member_joined', actor: MOCK_USERS[4], projectId: 'p1', payload: {}, createdAt: '2026-04-11T09:00:00' },
  { id: 'e7', type: 'task_updated', actor: MOCK_USERS[1], projectId: 'p1', payload: { taskTitle: '칸반 보드 컴포넌트 개발', field: 'priority', from: 'medium', to: 'high' }, createdAt: '2026-04-10T16:30:00' },
  { id: 'e8', type: 'task_completed', actor: MOCK_USERS[2], projectId: 'p1', payload: { taskTitle: 'ERD 설계 및 DB 스키마 확정' }, createdAt: '2026-04-09T18:00:00' },
];

// ── Files ──────────────────────────────────────────────────────
export const MOCK_FILES: FileItem[] = [
  { id: 'f1', projectId: 'p1', name: 'UI_스토리보드_v2.pdf', size: 4_820_000, mimeType: 'application/pdf', uploadedBy: MOCK_USERS[3], createdAt: '2026-04-13T09:40:00' },
  { id: 'f2', projectId: 'p1', name: 'ERD_설계서_최종.png', size: 1_240_000, mimeType: 'image/png', uploadedBy: MOCK_USERS[2], createdAt: '2026-03-14T17:00:00' },
  { id: 'f3', projectId: 'p1', name: 'API_명세서_v1.3.xlsx', size: 320_000, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploadedBy: MOCK_USERS[0], createdAt: '2026-04-05T11:30:00' },
  { id: 'f4', projectId: 'p1', name: 'RFP_프로젝트관리시스템.docx', size: 890_000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadedBy: MOCK_USERS[0], createdAt: '2026-03-01T09:00:00' },
  { id: 'f5', projectId: 'p1', name: '스프린트1_완료보고.pptx', size: 6_500_000, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', uploadedBy: MOCK_USERS[1], createdAt: '2026-03-31T18:00:00' },
];
