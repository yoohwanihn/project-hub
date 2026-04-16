import bcrypt from 'bcrypt';
import { db } from './db';

async function seed() {
  console.log('Seeding...');

  const hash = await bcrypt.hash('12345678', 10);

  // users — status='active', password_hash 포함
  await db.query(`
    INSERT INTO users (id, name, email, role, password_hash, status) VALUES
      ('u1','유환인','yoohwanihn@cmworld.co.kr','owner',$1,'active'),
      ('u2','김민준','minjun.kim@cmworld.co.kr','admin',$1,'active'),
      ('u3','이서연','seoyeon.lee@cmworld.co.kr','member',$1,'active'),
      ('u4','박지호','jiho.park@cmworld.co.kr','member',$1,'active'),
      ('u5','최수아','sua.choi@cmworld.co.kr','viewer',$1,'active')
    ON CONFLICT (id) DO UPDATE SET password_hash=$1, status='active'
  `, [hash]);

  // projects
  await db.query(`
    INSERT INTO projects (id,name,description,color,start_date,end_date,created_at,updated_at) VALUES
      ('p1','차세대 프로젝트 허브','전사 업무 통합 협업 플랫폼 구축','#3b82f6','2026-03-01','2026-05-31','2026-03-01T09:00:00Z','2026-04-13T09:00:00Z'),
      ('p2','모바일 앱 리뉴얼','iOS / Android 앱 UI/UX 전면 개편','#8b5cf6','2026-02-01','2026-04-30','2026-02-01T09:00:00Z','2026-04-12T17:30:00Z'),
      ('p3','API 게이트웨이 고도화','마이크로서비스 간 API 통합 및 성능 개선','#10b981','2026-04-01','2026-06-30','2026-04-01T09:00:00Z','2026-04-10T14:00:00Z'),
      ('p4','데이터 분석 대시보드','BI 대시보드 신규 구축 및 리포트 자동화','#f59e0b','2026-01-15','2026-04-15','2026-01-15T09:00:00Z','2026-04-13T11:20:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // project_members
  await db.query(`
    INSERT INTO project_members (project_id,user_id,role) VALUES
      ('p1','u1','owner'),('p1','u2','admin'),('p1','u3','member'),('p1','u4','member'),
      ('p2','u2','owner'),('p2','u3','member'),('p2','u4','member'),('p2','u5','viewer'),
      ('p3','u1','owner'),('p3','u2','admin'),('p3','u3','member'),
      ('p4','u1','owner'),('p4','u2','admin'),('p4','u3','member'),('p4','u4','member'),('p4','u5','viewer')
    ON CONFLICT DO NOTHING
  `);

  // workflow_statuses
  const wfBase = [
    { id: 'todo',        label: '진행 전', color: '#94a3b8', order: 0 },
    { id: 'in_progress', label: '진행 중', color: '#3b82f6', order: 1 },
    { id: 'review',      label: '검토 중', color: '#f59e0b', order: 2 },
    { id: 'done',        label: '완료',    color: '#10b981', order: 3 },
  ];
  for (const pid of ['p1','p2','p3','p4']) {
    for (const w of wfBase) {
      await db.query(
        `INSERT INTO workflow_statuses (id,project_id,label,color,"order") VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [`${pid}-${w.id}`, pid, w.label, w.color, w.order]
      );
    }
  }

  // tags
  await db.query(`
    INSERT INTO tags (id,project_id,name,color) VALUES
      ('tag-be','p1','백엔드','#10b981'),('tag-fe','p1','프론트엔드','#ef4444'),
      ('tag-design','p1','디자인','#f59e0b'),('tag-plan','p1','기획','#8b5cf6'),
      ('tag-infra','p1','인프라','#64748b'),
      ('p2-tag-ios','p2','iOS','#6366f1'),('p2-tag-android','p2','Android','#22c55e'),('p2-tag-ux','p2','UX','#f59e0b'),
      ('p3-tag-api','p3','API','#3b82f6'),('p3-tag-perf','p3','성능','#f43f5e'),
      ('p4-tag-bi','p4','BI','#f59e0b'),('p4-tag-sql','p4','SQL','#06b6d4')
    ON CONFLICT (id) DO NOTHING
  `);

  // tasks (p1)
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
      ('w1','p1','프로젝트 개요 및 목표',$1,3,'u1','2026-04-10T10:00:00Z'),
      ('w2','p1','개발 환경 설정 가이드',$2,5,'u2','2026-04-12T14:30:00Z'),
      ('w3','p1','코딩 컨벤션',$3,2,'u3','2026-04-08T09:00:00Z'),
      ('w4','p1','API 명세 요약',$4,7,'u1','2026-04-13T08:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `, [
    '# 프로젝트 개요\n\n차세대 스마트 프로젝트 협업 관리 시스템은...',
    '# 개발 환경 설정\n\n## 사전 요구사항\n- Node.js 20+\n- PostgreSQL 15+',
    '# 코딩 컨벤션\n\n## TypeScript\n- 타입 명시 필수\n- any 사용 금지',
    '# API 명세\n\n## 인증\nPOST /api/auth/login\n\n## 프로젝트\nGET /api/projects'
  ]);

  // announcements
  await db.query(`
    INSERT INTO announcements (id,project_id,title,content,author_id,is_pinned,created_at) VALUES
      ('a1','p1','4월 스프린트 계획 공유','이번 스프린트는 칸반 보드와 간트차트 핵심 기능 완성에 집중합니다.','u1',true,'2026-04-01T09:00:00Z'),
      ('a2','p1','코드 리뷰 일정 변경 안내','매주 수요일 오후 3시로 코드 리뷰 시간이 변경되었습니다.','u2',false,'2026-04-08T11:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // timeline_events
  const events = [
    ['e1','task_completed','u1','p1','{"taskTitle":"로그인/인증 API 구현"}','2026-04-14T11:30:00Z'],
    ['e2','task_updated','u3','p1','{"taskTitle":"간트차트 인터랙션 구현","field":"status","from":"todo","to":"in_progress"}','2026-04-14T10:15:00Z'],
    ['e3','file_uploaded','u4','p1','{"fileName":"UI_스토리보드_v2.pdf"}','2026-04-14T09:40:00Z'],
    ['e4','task_completed','u2','p1','{"taskTitle":"칸반 보드 수영레인 구현"}','2026-04-13T17:20:00Z'],
    ['e5','project_created','u1','p1','{"projectName":"프로젝트 관리 시스템"}','2026-04-03T09:00:00Z'],
  ];
  for (const [id,type,actor,proj,payload,created] of events) {
    await db.query(
      `INSERT INTO timeline_events (id,type,actor_id,project_id,payload,created_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6) ON CONFLICT DO NOTHING`,
      [id,type,actor,proj,payload,created]
    );
  }

  // files
  await db.query(`
    INSERT INTO files (id,project_id,name,size,mime_type,uploader_id,created_at) VALUES
      ('f1','p1','UI_스토리보드_v2.pdf',4820000,'application/pdf','u4','2026-04-13T09:40:00Z'),
      ('f2','p1','ERD_설계서_최종.png',1240000,'image/png','u3','2026-03-14T17:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // polls
  await db.query(`
    INSERT INTO polls (id,project_id,title,description,is_multiple,show_results_before_close,status,due_date,author_id,created_at) VALUES
      ('poll1','p1','스프린트 회고 방식 선택','이번 스프린트부터 적용할 회고 방식을 선택해 주세요.',false,true,'active','2026-04-20','u1','2026-04-10T10:00:00Z'),
      ('poll2','p1','다음 스프린트 우선 구현 기능 (복수 선택)','다음 스프린트에 집중할 기능을 모두 선택해 주세요.',true,false,'active',NULL,'u1','2026-04-12T09:30:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  await db.query(`
    INSERT INTO poll_options (id,poll_id,label,"order") VALUES
      ('poll1-o1','poll1','KPT (Keep / Problem / Try)',0),
      ('poll1-o2','poll1','Start / Stop / Continue',1),
      ('poll1-o3','poll1','4L (Liked / Learned / Lacked / Longed for)',2),
      ('poll2-o1','poll2','글로벌 검색 기능',0),
      ('poll2-o2','poll2','인앱 알림 센터',1),
      ('poll2-o3','poll2','모바일 반응형 지원',2)
    ON CONFLICT (id) DO NOTHING
  `);

  await db.query(`
    INSERT INTO poll_votes (poll_id,option_id,user_id) VALUES
      ('poll1','poll1-o1','u2'),('poll1','poll1-o1','u3'),('poll1','poll1-o2','u4'),
      ('poll2','poll2-o1','u1'),('poll2','poll2-o2','u1'),('poll2','poll2-o2','u2')
    ON CONFLICT DO NOTHING
  `);

  console.log('Seed complete.');
  await db.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
