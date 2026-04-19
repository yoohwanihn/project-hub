import bcrypt from 'bcryptjs';
import { db } from './db';

async function seed() {
  console.log('Seeding...');

  const hash = await bcrypt.hash('12345678', 10);

  // ── users ─────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO users (id, name, email, role, password_hash, status) VALUES
      ('u1','유환인','yoohwanihn@cmworld.co.kr','owner',$1,'active'),
      ('u2','김민준','minjun.kim@cmworld.co.kr','admin',$1,'active'),
      ('u3','이서연','seoyeon.lee@cmworld.co.kr','member',$1,'active'),
      ('u4','박지호','jiho.park@cmworld.co.kr','member',$1,'active'),
      ('u5','최수아','sua.choi@cmworld.co.kr','viewer',$1,'active')
    ON CONFLICT (id) DO UPDATE SET password_hash=$1, status='active'
  `, [hash]);

  // ── projects ──────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO projects (id,name,description,color,start_date,end_date,created_at,updated_at) VALUES
      ('p1','차세대 프로젝트 허브','전사 업무 통합 협업 플랫폼 구축','#3b82f6','2026-03-01','2026-05-31','2026-03-01T09:00:00Z','2026-04-13T09:00:00Z'),
      ('p2','모바일 앱 리뉴얼','iOS / Android 앱 UI/UX 전면 개편','#8b5cf6','2026-02-01','2026-04-30','2026-02-01T09:00:00Z','2026-04-12T17:30:00Z'),
      ('p3','API 게이트웨이 고도화','마이크로서비스 간 API 통합 및 성능 개선','#10b981','2026-04-01','2026-06-30','2026-04-01T09:00:00Z','2026-04-10T14:00:00Z'),
      ('p4','데이터 분석 대시보드','BI 대시보드 신규 구축 및 리포트 자동화','#f59e0b','2026-01-15','2026-04-15','2026-01-15T09:00:00Z','2026-04-13T11:20:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── project_members ───────────────────────────────────────────────
  await db.query(`
    INSERT INTO project_members (project_id,user_id,role) VALUES
      ('p1','u1','owner'),('p1','u2','admin'),('p1','u3','member'),('p1','u4','member'),
      ('p2','u2','owner'),('p2','u3','member'),('p2','u4','member'),('p2','u5','viewer'),
      ('p3','u1','owner'),('p3','u2','admin'),('p3','u3','member'),
      ('p4','u1','owner'),('p4','u2','admin'),('p4','u3','member'),('p4','u4','member'),('p4','u5','viewer')
    ON CONFLICT DO NOTHING
  `);

  // ── workflow_statuses ─────────────────────────────────────────────
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

  // ── tags ──────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO tags (id,project_id,name,color) VALUES
      ('tag-be','p1','백엔드','#10b981'),('tag-fe','p1','프론트엔드','#ef4444'),
      ('tag-design','p1','디자인','#f59e0b'),('tag-plan','p1','기획','#8b5cf6'),
      ('tag-infra','p1','인프라','#64748b'),
      ('p2-tag-ios','p2','iOS','#6366f1'),('p2-tag-android','p2','Android','#22c55e'),
      ('p2-tag-ux','p2','UX/기획','#f59e0b'),('p2-tag-qa','p2','QA','#ef4444'),
      ('p3-tag-api','p3','API','#3b82f6'),('p3-tag-perf','p3','성능','#f43f5e'),
      ('p3-tag-auth','p3','인증','#8b5cf6'),('p3-tag-infra','p3','인프라','#64748b'),
      ('p4-tag-bi','p4','BI','#f59e0b'),('p4-tag-sql','p4','SQL','#06b6d4'),
      ('p4-tag-viz','p4','시각화','#ec4899'),('p4-tag-etl','p4','ETL','#10b981')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── tasks p1 ──────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO tasks (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,blocked_by,start_date,due_date,estimated_hours,logged_hours,"order",created_at,updated_at) VALUES
      ('t1','p1','요구사항 정의서 작성','기능·비기능 요구사항 문서화','p1-done','high','{"u2"}','{"tag-plan"}','{}','2026-03-01','2026-03-07',16,18,0,'2026-03-01T09:00:00Z','2026-03-07T18:00:00Z'),
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

  // ── tasks p1 추가 (u1 담당 — 내 업무 테스트용) ─────────────────────
  await db.query(`
    INSERT INTO tasks (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,blocked_by,start_date,due_date,estimated_hours,logged_hours,"order",created_at,updated_at) VALUES
      ('t11','p1','알림 시스템 서버 구현','웹소켓 기반 실시간 알림 서버 구축','p1-in_progress','urgent','{u1}','{tag-be}','{}','2026-04-10','2026-04-16',24,18,4,'2026-04-10T09:00:00Z','2026-04-15T17:00:00Z'),
      ('t12','p1','대시보드 위젯 컴포넌트 개발','드래그 가능한 커스터마이즈 위젯 그리드 구현','p1-in_progress','high','{u1}','{tag-fe}','{}','2026-04-15','2026-04-18',32,10,5,'2026-04-15T09:00:00Z','2026-04-17T16:00:00Z'),
      ('t13','p1','전체 검색 기능 구현','Elasticsearch 연동 전문 검색','p1-todo','high','{u1,u2}','{tag-be,tag-fe}','{}','2026-04-19','2026-04-25',40,0,4,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('t14','p1','E2E 테스트 작성','Playwright 기반 핵심 플로우 자동화 테스트','p1-todo','medium','{u1}','{tag-infra}','{}','2026-04-21','2026-04-28',24,0,5,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('t15','p1','Docker 컨테이너화 및 CI/CD','GitHub Actions + Docker Compose 배포 자동화','p1-todo','high','{u1}','{tag-infra}','{}','2026-05-01','2026-05-08',32,0,6,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── tasks p3 추가 ─────────────────────────────────────────────────
  await db.query(`
    INSERT INTO tasks (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,blocked_by,start_date,due_date,estimated_hours,logged_hours,"order",created_at,updated_at) VALUES
      ('p3t11','p3','게이트웨이 로그 중앙화','ELK Stack 연동, 요청·응답 로그 수집','p3-in_progress','medium','{u1}','{p3-tag-infra}','{}','2026-04-14','2026-04-18',24,12,2,'2026-04-14T09:00:00Z','2026-04-16T16:00:00Z'),
      ('p3t12','p3','API 키 관리 기능 구현','개발자 포털용 API 키 발급·갱신·폐기 API','p3-todo','high','{u1}','{p3-tag-auth,p3-tag-api}','{}','2026-04-19','2026-04-26',32,0,3,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('p3t13','p3','WebSocket 프록시 지원','Kong WebSocket 업그레이드 플러그인 설정','p3-todo','medium','{u1}','{p3-tag-api}','{}','2026-04-28','2026-05-06',20,0,4,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── tasks p2 (모바일 앱 리뉴얼) ───────────────────────────────────
  await db.query(`
    INSERT INTO tasks (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,blocked_by,start_date,due_date,estimated_hours,logged_hours,"order",created_at,updated_at) VALUES
      ('p2t1','p2','사용자 리서치 및 UX 감사','현행 앱 사용성 문제점 도출, 인터뷰 15명 진행','p2-done','high','{"u3"}','{"p2-tag-ux"}','{}','2026-02-01','2026-02-14',40,44,0,'2026-02-01T09:00:00Z','2026-02-14T18:00:00Z'),
      ('p2t2','p2','신규 디자인 시스템 정의','컬러, 타이포그래피, 컴포넌트 가이드라인 수립','p2-done','high','{"u4"}','{"p2-tag-ux","p2-tag-ios"}','{"p2t1"}','2026-02-15','2026-02-28',56,60,1,'2026-02-15T09:00:00Z','2026-02-28T18:00:00Z'),
      ('p2t3','p2','iOS 메인 홈 화면 리디자인','피그마 기반 iOS 14+ 홈 화면 UI 구현','p2-done','high','{"u3"}','{"p2-tag-ios"}','{"p2t2"}','2026-03-01','2026-03-14',48,50,0,'2026-03-01T09:00:00Z','2026-03-14T18:00:00Z'),
      ('p2t4','p2','Android 메인 홈 화면 리디자인','Material Design 3 기반 Android 홈 화면 구현','p2-done','high','{"u4"}','{"p2-tag-android"}','{"p2t2"}','2026-03-01','2026-03-14',48,46,1,'2026-03-01T09:00:00Z','2026-03-14T18:00:00Z'),
      ('p2t5','p2','온보딩 플로우 재설계','신규 사용자 첫 경험 개선, 5단계 튜토리얼','p2-review','high','{"u3","u4"}','{"p2-tag-ux","p2-tag-ios"}','{"p2t3","p2t4"}','2026-03-15','2026-03-28',32,30,0,'2026-03-15T09:00:00Z','2026-03-27T16:00:00Z'),
      ('p2t6','p2','알림 센터 UI 개선','읽음/미읽음 상태, 카테고리별 필터링 구현','p2-in_progress','medium','{"u3"}','{"p2-tag-ios","p2-tag-android"}','{"p2t5"}','2026-04-01','2026-04-15',24,10,0,'2026-04-01T09:00:00Z','2026-04-12T16:00:00Z'),
      ('p2t7','p2','다크모드 전체 적용','iOS/Android 전 화면 다크모드 팔레트 적용','p2-in_progress','medium','{"u4"}','{"p2-tag-ios","p2-tag-android"}','{"p2t2"}','2026-04-05','2026-04-20',40,16,1,'2026-04-05T09:00:00Z','2026-04-12T15:00:00Z'),
      ('p2t8','p2','접근성 개선 (A11Y)','WCAG AA 기준 색상 대비, 스크린리더 지원','p2-todo','medium','{"u3","u4"}','{"p2-tag-ux"}','{"p2t7"}','2026-04-18','2026-04-28',24,0,0,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('p2t9','p2','QA 전체 회귀 테스트','iOS 15~17, Android 11~14 기기별 검증','p2-todo','urgent','{"u5"}','{"p2-tag-qa"}','{"p2t8"}','2026-04-25','2026-04-30',40,0,0,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('p2t10','p2','앱스토어/플레이스토어 배포','스크린샷, 릴리즈 노트, 심사 제출','p2-todo','urgent','{"u2"}','{"p2-tag-ios","p2-tag-android"}','{"p2t9"}','2026-04-29','2026-04-30',16,0,1,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── tasks p3 (API 게이트웨이 고도화) ──────────────────────────────
  await db.query(`
    INSERT INTO tasks (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,blocked_by,start_date,due_date,estimated_hours,logged_hours,"order",created_at,updated_at) VALUES
      ('p3t1','p3','현행 API 인벤토리 파악','서비스별 API 엔드포인트 목록화 및 의존성 맵 작성','p3-done','high','{"u2"}','{"p3-tag-api"}','{}','2026-04-01','2026-04-05',24,26,0,'2026-04-01T09:00:00Z','2026-04-05T18:00:00Z'),
      ('p3t2','p3','Kong Gateway 설치 및 PoC','스테이징 환경에 Kong OSS 설치, 기본 라우팅 검증','p3-done','high','{"u1"}','{"p3-tag-infra","p3-tag-api"}','{"p3t1"}','2026-04-03','2026-04-08',32,30,1,'2026-04-03T09:00:00Z','2026-04-08T18:00:00Z'),
      ('p3t3','p3','JWT 인증 플러그인 적용','서비스 공통 JWT 검증 미들웨어 게이트웨이 레벨 적용','p3-review','urgent','{"u1","u2"}','{"p3-tag-auth","p3-tag-api"}','{"p3t2"}','2026-04-07','2026-04-14',40,36,0,'2026-04-07T09:00:00Z','2026-04-12T17:00:00Z'),
      ('p3t4','p3','Rate Limiting 정책 설계','서비스별 요청 제한 정책 수립 및 Kong 플러그인 설정','p3-in_progress','high','{"u2"}','{"p3-tag-api","p3-tag-perf"}','{"p3t2"}','2026-04-10','2026-04-18',32,14,0,'2026-04-10T09:00:00Z','2026-04-12T16:00:00Z'),
      ('p3t5','p3','API 응답 캐싱 레이어 구축','Redis 기반 게이트웨이 캐싱, TTL 전략 정의','p3-in_progress','high','{"u1"}','{"p3-tag-perf","p3-tag-infra"}','{"p3t3"}','2026-04-12','2026-04-22',48,18,1,'2026-04-12T09:00:00Z','2026-04-12T18:00:00Z'),
      ('p3t6','p3','API 모니터링 대시보드','Prometheus + Grafana 연동, 레이턴시·에러율 시각화','p3-todo','medium','{"u3"}','{"p3-tag-infra","p3-tag-perf"}','{"p3t4"}','2026-04-20','2026-05-02',40,0,0,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('p3t7','p3','서킷브레이커 패턴 구현','Resilience4j 적용, 장애 전파 차단 테스트','p3-todo','high','{"u1"}','{"p3-tag-api","p3-tag-infra"}','{"p3t5"}','2026-04-28','2026-05-09',32,0,1,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('p3t8','p3','API 문서 자동화 (OpenAPI)','Kong → OpenAPI 3.0 스펙 자동 생성, Swagger UI 배포','p3-todo','medium','{"u2","u3"}','{"p3-tag-api"}','{"p3t7"}','2026-05-10','2026-05-20',24,0,0,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('p3t9','p3','성능 부하 테스트','k6 기반 10,000 RPS 부하 테스트 및 병목 분석','p3-todo','urgent','{"u1","u2"}','{"p3-tag-perf"}','{"p3t6","p3t7"}','2026-05-22','2026-06-05',40,0,0,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('p3t10','p3','프로덕션 롤아웃 계획','블루/그린 배포 전략 수립, 롤백 플레이북 작성','p3-todo','urgent','{"u1"}','{"p3-tag-infra"}','{"p3t9"}','2026-06-08','2026-06-20',24,0,1,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── tasks p4 (데이터 분석 대시보드) ──────────────────────────────
  await db.query(`
    INSERT INTO tasks (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,blocked_by,start_date,due_date,estimated_hours,logged_hours,"order",created_at,updated_at) VALUES
      ('p4t1','p4','데이터 소스 인벤토리 정의','ERP·CRM·물류 시스템 데이터 소스 목록 및 접근 권한 확인','p4-done','high','{"u1"}','{"p4-tag-etl"}','{}','2026-01-15','2026-01-22',16,18,0,'2026-01-15T09:00:00Z','2026-01-22T18:00:00Z'),
      ('p4t2','p4','KPI 지표 정의 워크숍','경영진·팀장 대상 핵심 지표 30개 선정 워크숍','p4-done','high','{"u2","u3"}','{"p4-tag-bi"}','{"p4t1"}','2026-01-20','2026-01-31',24,28,1,'2026-01-20T09:00:00Z','2026-01-31T18:00:00Z'),
      ('p4t3','p4','DW 스키마 설계 (Star Schema)','팩트·디멘전 테이블 설계, ETL 파이프라인 설계','p4-done','high','{"u3"}','{"p4-tag-sql","p4-tag-etl"}','{"p4t2"}','2026-02-01','2026-02-15',48,52,0,'2026-02-01T09:00:00Z','2026-02-15T18:00:00Z'),
      ('p4t4','p4','ETL 파이프라인 구축','Apache Airflow DAG 작성, 일/주/월 배치 처리','p4-done','high','{"u1","u3"}','{"p4-tag-etl","p4-tag-sql"}','{"p4t3"}','2026-02-16','2026-03-07',80,84,1,'2026-02-16T09:00:00Z','2026-03-07T18:00:00Z'),
      ('p4t5','p4','대시보드 레이아웃 설계','와이어프레임·목업 제작, 경영진 피드백 반영','p4-done','medium','{"u4"}','{"p4-tag-bi","p4-tag-viz"}','{"p4t2"}','2026-02-15','2026-02-28',24,20,0,'2026-02-15T09:00:00Z','2026-02-28T18:00:00Z'),
      ('p4t6','p4','매출 현황 차트 구현','월별·제품별·지역별 매출 바/라인 차트 구현','p4-review','high','{"u4"}','{"p4-tag-viz","p4-tag-sql"}','{"p4t4","p4t5"}','2026-03-10','2026-03-28',40,42,0,'2026-03-10T09:00:00Z','2026-03-28T18:00:00Z'),
      ('p4t7','p4','재고·물류 현황 차트 구현','창고별 재고 히트맵, 배송 현황 지도 시각화','p4-in_progress','high','{"u3"}','{"p4-tag-viz"}','{"p4t4"}','2026-03-25','2026-04-10',40,32,1,'2026-03-25T09:00:00Z','2026-04-12T16:00:00Z'),
      ('p4t8','p4','자동 리포트 이메일 발송','주간·월간 요약 PDF 생성 및 이메일 자동 발송','p4-in_progress','medium','{"u1"}','{"p4-tag-bi","p4-tag-etl"}','{"p4t6"}','2026-04-07','2026-04-15',32,20,0,'2026-04-07T09:00:00Z','2026-04-12T15:00:00Z'),
      ('p4t9','p4','접근 권한 관리 기능','팀·역할별 대시보드 접근 제어, 감사 로그','p4-todo','medium','{"u2"}','{"p4-tag-bi"}','{}','2026-04-14','2026-04-20',24,0,0,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z'),
      ('p4t10','p4','전체 UAT 및 오픈','경영진 대상 사용자 수용 테스트, 이슈 수정','p4-todo','urgent','{"u1","u2","u3","u4"}','{"p4-tag-bi"}','{"p4t8","p4t9"}','2026-04-21','2026-04-30',32,0,1,'2026-04-01T09:00:00Z','2026-04-01T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── wiki_pages ────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO wiki_pages (id,project_id,title,content,version,author_id,updated_at) VALUES
      ('w1','p1','프로젝트 개요 및 목표',$1,3,'u1','2026-04-10T10:00:00Z'),
      ('w2','p1','개발 환경 설정 가이드',$2,5,'u2','2026-04-12T14:30:00Z'),
      ('w3','p1','코딩 컨벤션',$3,2,'u3','2026-04-08T09:00:00Z'),
      ('w4','p1','API 명세 요약',$4,7,'u1','2026-04-13T08:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `, [
    '# 프로젝트 개요\n\n차세대 스마트 프로젝트 협업 관리 시스템은 전사 업무를 한 플랫폼에서 관리합니다.\n\n## 목표\n- 프로젝트 투명성 확보\n- 협업 효율 30% 향상\n- 레거시 툴 단일화',
    '# 개발 환경 설정\n\n## 사전 요구사항\n- Node.js 20+\n- PostgreSQL 15+\n- pnpm 8+\n\n## 로컬 실행\n```bash\npnpm install\npnpm dev\n```',
    '# 코딩 컨벤션\n\n## TypeScript\n- 타입 명시 필수\n- any 사용 금지\n- interface 우선, type은 유니언·인터섹션만\n\n## 네이밍\n- 컴포넌트: PascalCase\n- 훅: camelCase (use 접두사)',
    '# API 명세\n\n## 인증\n- POST /api/auth/login\n- POST /api/auth/refresh\n- POST /api/auth/logout\n\n## 프로젝트\n- GET /api/projects\n- POST /api/projects\n- GET /api/projects/:id/tasks'
  ]);

  await db.query(`
    INSERT INTO wiki_pages (id,project_id,title,content,version,author_id,updated_at) VALUES
      ('w5','p2','모바일 디자인 시스템',$1,4,'u4','2026-04-11T10:00:00Z'),
      ('w6','p2','컴포넌트 라이브러리 가이드',$2,3,'u3','2026-04-09T14:00:00Z'),
      ('w7','p2','QA 체크리스트',$3,6,'u5','2026-04-13T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `, [
    '# 디자인 시스템\n\n## 컬러 팔레트\n- Primary: #7C3AED\n- Secondary: #A78BFA\n- Surface: #F5F3FF\n\n## 타이포그래피\n- Heading: Pretendard Bold 24/20/16px\n- Body: Pretendard Regular 14px',
    '# 컴포넌트 라이브러리\n\n## 기본 컴포넌트\n- Button (Primary / Secondary / Ghost)\n- Input (Default / Error / Disabled)\n- Card\n- BottomSheet\n\n## 사용법\n```tsx\nimport { Button } from \'@/components\';\n```',
    '# QA 체크리스트\n\n## iOS\n- [ ] iPhone 13/14/15 Pro 해상도\n- [ ] 다크모드 전환\n- [ ] VoiceOver 스크린리더\n\n## Android\n- [ ] Galaxy S23 / Pixel 7\n- [ ] TalkBack 스크린리더\n- [ ] 폴더블 화면 분할'
  ]);

  await db.query(`
    INSERT INTO wiki_pages (id,project_id,title,content,version,author_id,updated_at) VALUES
      ('w8','p3','API 게이트웨이 아키텍처',$1,5,'u1','2026-04-12T09:00:00Z'),
      ('w9','p3','Kong 플러그인 설정 가이드',$2,3,'u2','2026-04-10T14:00:00Z'),
      ('w10','p3','장애 대응 플레이북',$3,2,'u1','2026-04-08T16:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `, [
    '# API 게이트웨이 아키텍처\n\n## 개요\n Kong OSS를 API 진입점으로 사용하며 모든 마이크로서비스 트래픽을 라우팅합니다.\n\n## 서비스 목록\n- auth-service :3001\n- user-service :3002\n- order-service :3003\n- notification-service :3004',
    '# Kong 플러그인 설정\n\n## JWT 인증\n```yaml\nplugins:\n  - name: jwt\n    config:\n      secret_is_base64: false\n      claims_to_verify:\n        - exp\n```\n\n## Rate Limiting\n```yaml\n  - name: rate-limiting\n    config:\n      minute: 100\n      policy: local\n```',
    '# 장애 대응 플레이북\n\n## 게이트웨이 다운\n1. health check: `curl /status`\n2. 로그 확인: `docker logs kong`\n3. 재시작: `docker restart kong`\n\n## 특정 서비스 503\n1. 서킷브레이커 상태 확인\n2. 업스트림 헬스체크 점검'
  ]);

  await db.query(`
    INSERT INTO wiki_pages (id,project_id,title,content,version,author_id,updated_at) VALUES
      ('w11','p4','KPI 지표 정의서',$1,8,'u2','2026-04-13T10:00:00Z'),
      ('w12','p4','DW 스키마 명세',$2,4,'u3','2026-04-10T15:00:00Z'),
      ('w13','p4','ETL 파이프라인 가이드',$3,3,'u1','2026-04-09T11:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `, [
    '# KPI 지표 정의서\n\n## 매출 지표\n- 월매출: 당월 1일~말일 확정 매출 합산\n- YoY 성장률: (당월매출 - 전년동월) / 전년동월 × 100\n\n## 물류 지표\n- 적기배송률: 약속일 이내 배송 건수 / 전체 배송 건수\n- 재고회전율: 매출원가 / 평균재고금액',
    '# DW 스키마 명세\n\n## 팩트 테이블\n- fact_sales (sale_id, date_id, product_id, region_id, amount, qty)\n- fact_shipping (ship_id, date_id, warehouse_id, order_id, status)\n\n## 디멘전 테이블\n- dim_date, dim_product, dim_region, dim_warehouse',
    '# ETL 파이프라인 가이드\n\n## DAG 목록\n- `daily_sales_etl` — 매일 02:00 실행\n- `weekly_inventory_etl` — 매주 월요일 03:00\n- `monthly_report_gen` — 매월 1일 06:00\n\n## 실패 시 재실행\n```bash\nairflow dags trigger --exec-date 2026-04-13 daily_sales_etl\n```'
  ]);

  // ── announcements ─────────────────────────────────────────────────
  await db.query(`
    INSERT INTO announcements (id,project_id,title,content,author_id,is_pinned,created_at) VALUES
      ('a1','p1','4월 스프린트 계획 공유','이번 스프린트는 칸반 보드와 간트차트 핵심 기능 완성에 집중합니다.','u1',true,'2026-04-01T09:00:00Z'),
      ('a2','p1','코드 리뷰 일정 변경 안내','매주 수요일 오후 3시로 코드 리뷰 시간이 변경되었습니다.','u2',false,'2026-04-08T11:00:00Z'),
      ('a3','p2','앱 출시 D-13 최종 점검 안내','QA 완료 후 4월 29일 스토어 심사 제출 예정입니다. 크리티컬 이슈 우선 처리 부탁드립니다.','u2',true,'2026-04-17T09:00:00Z'),
      ('a4','p2','디자인 시스템 v2.0 배포','신규 컴포넌트 라이브러리가 npm에 배포되었습니다. pnpm update @cmworld/ui로 업데이트해 주세요.','u4',false,'2026-04-10T14:00:00Z'),
      ('a5','p2','다크모드 피드백 수집','다크모드 구현 완료! 내부 테스트 피드백을 이번 주 금요일까지 슬랙 #p2-feedback 채널에 남겨주세요.','u3',false,'2026-04-12T10:30:00Z'),
      ('a6','p3','스테이징 게이트웨이 배포 완료','Kong OSS 1.3.0이 스테이징 환경에 배포되었습니다. JWT 플러그인 검증 후 피드백 요청드립니다.','u1',true,'2026-04-09T10:00:00Z'),
      ('a7','p3','Rate Limiting 임시 완화 안내','배치 업무 시간대(02:00~04:00) Rate Limiting이 일시적으로 완화됩니다.','u2',false,'2026-04-13T15:00:00Z'),
      ('a8','p4','대시보드 오픈 D-14 일정 확정','4월 30일 경영진 대상 대시보드 오픈 행사가 확정되었습니다. UAT는 4월 21일부터 진행합니다.','u1',true,'2026-04-16T09:00:00Z'),
      ('a9','p4','매출 현황 차트 1차 검토 결과','경영진 1차 리뷰 완료. YoY 비교 그래프 추가 및 드릴다운 기능 요청이 접수되었습니다.','u2',false,'2026-04-01T11:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── files ─────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO files (id,project_id,name,size,mime_type,uploader_id,created_at) VALUES
      ('f1','p1','UI_스토리보드_v2.pdf',4820000,'application/pdf','u4','2026-04-13T09:40:00Z'),
      ('f2','p1','ERD_설계서_최종.png',1240000,'image/png','u3','2026-03-14T17:00:00Z'),
      ('f3','p1','기능요구사항서_v1.3.docx',320000,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','u2','2026-03-07T18:00:00Z'),
      ('f4','p2','디자인시스템_v2.0.fig',8500000,'application/octet-stream','u4','2026-04-11T10:30:00Z'),
      ('f5','p2','온보딩_프로토타입.mp4',24000000,'video/mp4','u3','2026-03-28T14:00:00Z'),
      ('f6','p2','QA_테스트케이스.xlsx',560000,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','u5','2026-04-13T11:00:00Z'),
      ('f7','p2','앱아이콘_후보안.png',1800000,'image/png','u4','2026-04-10T09:00:00Z'),
      ('f8','p3','Kong_아키텍처_다이어그램.png',2300000,'image/png','u1','2026-04-08T16:00:00Z'),
      ('f9','p3','API_인벤토리_v1.xlsx',430000,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','u2','2026-04-05T18:00:00Z'),
      ('f10','p3','부하테스트_k6_스크립트.js',45000,'application/javascript','u1','2026-04-12T14:00:00Z'),
      ('f11','p4','KPI정의서_최종승인.pdf',2100000,'application/pdf','u2','2026-02-01T09:00:00Z'),
      ('f12','p4','DW_스키마_ERD.png',1650000,'image/png','u3','2026-02-15T18:00:00Z'),
      ('f13','p4','대시보드_목업_v3.pdf',5200000,'application/pdf','u4','2026-03-01T10:00:00Z'),
      ('f14','p4','매출현황_샘플데이터.csv',980000,'text/csv','u1','2026-03-10T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  // ── timeline_events ───────────────────────────────────────────────
  const events: [string,string,string,string,string,string][] = [
    // p1
    ['e1','task_completed','u1','p1','{"taskTitle":"로그인/인증 API 구현"}','2026-04-14T11:30:00Z'],
    ['e2','task_updated','u3','p1','{"taskTitle":"간트차트 인터랙션 구현","field":"status","from":"todo","to":"in_progress"}','2026-04-14T10:15:00Z'],
    ['e3','file_uploaded','u4','p1','{"fileName":"UI_스토리보드_v2.pdf"}','2026-04-14T09:40:00Z'],
    ['e4','task_completed','u2','p1','{"taskTitle":"ERD 설계 및 DB 스키마 확정"}','2026-04-13T17:20:00Z'],
    ['e5','announcement_created','u1','p1','{"title":"4월 스프린트 계획 공유"}','2026-04-01T09:00:00Z'],
    ['e6','wiki_created','u2','p1','{"title":"API 명세 요약"}','2026-04-13T08:00:00Z'],
    // p2
    ['e7','task_completed','u3','p2','{"taskTitle":"iOS 메인 홈 화면 리디자인"}','2026-04-12T17:00:00Z'],
    ['e8','task_updated','u4','p2','{"taskTitle":"다크모드 전체 적용","field":"status","from":"todo","to":"in_progress"}','2026-04-12T11:30:00Z'],
    ['e9','file_uploaded','u4','p2','{"fileName":"디자인시스템_v2.0.fig"}','2026-04-11T10:30:00Z'],
    ['e10','announcement_created','u2','p2','{"title":"앱 출시 D-13 최종 점검 안내"}','2026-04-17T09:00:00Z'],
    ['e11','task_completed','u3','p2','{"taskTitle":"온보딩 플로우 재설계"}','2026-04-01T16:00:00Z'],
    ['e12','file_uploaded','u5','p2','{"fileName":"QA_테스트케이스.xlsx"}','2026-04-13T11:00:00Z'],
    // p3
    ['e13','task_completed','u1','p3','{"taskTitle":"Kong Gateway 설치 및 PoC"}','2026-04-09T18:00:00Z'],
    ['e14','task_updated','u2','p3','{"taskTitle":"Rate Limiting 정책 설계","field":"status","from":"todo","to":"in_progress"}','2026-04-10T09:00:00Z'],
    ['e15','announcement_created','u1','p3','{"title":"스테이징 게이트웨이 배포 완료"}','2026-04-09T10:00:00Z'],
    ['e16','file_uploaded','u1','p3','{"fileName":"Kong_아키텍처_다이어그램.png"}','2026-04-08T16:00:00Z'],
    ['e17','wiki_created','u2','p3','{"title":"Kong 플러그인 설정 가이드"}','2026-04-10T14:00:00Z'],
    // p4
    ['e18','task_completed','u1','p4','{"taskTitle":"ETL 파이프라인 구축"}','2026-04-07T18:00:00Z'],
    ['e19','task_updated','u3','p4','{"taskTitle":"재고·물류 현황 차트 구현","field":"status","from":"todo","to":"in_progress"}','2026-04-08T10:00:00Z'],
    ['e20','file_uploaded','u4','p4','{"fileName":"대시보드_목업_v3.pdf"}','2026-03-01T10:00:00Z'],
    ['e21','announcement_created','u1','p4','{"title":"대시보드 오픈 D-14 일정 확정"}','2026-04-16T09:00:00Z'],
    ['e22','task_completed','u4','p4','{"taskTitle":"대시보드 레이아웃 설계"}','2026-03-01T18:00:00Z'],
    ['e23','member_joined','u5','p4','{}','2026-01-16T10:00:00Z'],
  ];
  for (const [id,type,actor,proj,payload,created] of events) {
    await db.query(
      `INSERT INTO timeline_events (id,type,actor_id,project_id,payload,created_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6) ON CONFLICT DO NOTHING`,
      [id,type,actor,proj,payload,created]
    );
  }

  // ── polls ─────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO polls (id,project_id,title,description,is_multiple,show_results_before_close,status,due_date,author_id,created_at) VALUES
      ('poll1','p1','스프린트 회고 방식 선택','이번 스프린트부터 적용할 회고 방식을 선택해 주세요.',false,true,'active','2026-04-20','u1','2026-04-10T10:00:00Z'),
      ('poll2','p1','다음 스프린트 우선 구현 기능 (복수 선택)','다음 스프린트에 집중할 기능을 모두 선택해 주세요.',true,false,'active',NULL,'u1','2026-04-12T09:30:00Z'),
      ('poll3','p2','앱 아이콘 최종 선택','3가지 후보 중 최종 앱 아이콘을 선택해 주세요.',false,true,'active','2026-04-19','u2','2026-04-10T09:00:00Z'),
      ('poll4','p2','출시 후 첫 업데이트 우선순위 (복수 선택)','v1.1 업데이트에서 먼저 처리할 이슈를 선택해 주세요.',true,false,'active',NULL,'u2','2026-04-14T10:00:00Z'),
      ('poll5','p3','API 버전 관리 전략 선택','게이트웨이에서 적용할 API 버전 관리 방식을 결정해 주세요.',false,true,'closed','2026-04-10','u1','2026-04-06T09:00:00Z'),
      ('poll6','p4','대시보드 기본 화면 선택','최초 로그인 시 보여줄 기본 대시보드를 선택해 주세요.',false,true,'active','2026-04-22','u1','2026-04-14T09:00:00Z')
    ON CONFLICT (id) DO NOTHING
  `);

  await db.query(`
    INSERT INTO poll_options (id,poll_id,label,"order") VALUES
      ('poll1-o1','poll1','KPT (Keep / Problem / Try)',0),
      ('poll1-o2','poll1','Start / Stop / Continue',1),
      ('poll1-o3','poll1','4L (Liked / Learned / Lacked / Longed for)',2),
      ('poll2-o1','poll2','글로벌 검색 기능',0),
      ('poll2-o2','poll2','인앱 알림 센터',1),
      ('poll2-o3','poll2','모바일 반응형 지원',2),
      ('poll3-o1','poll3','안 A — 퍼플 그라데이션',0),
      ('poll3-o2','poll3','안 B — 미니멀 화이트',1),
      ('poll3-o3','poll3','안 C — 다크 볼드',2),
      ('poll4-o1','poll4','iOS 크래시 수정',0),
      ('poll4-o2','poll4','푸시 알림 딜레이 개선',1),
      ('poll4-o3','poll4','로그인 속도 개선',2),
      ('poll4-o4','poll4','위젯 지원',3),
      ('poll5-o1','poll5','URI 경로 버전 (/v1/resource)',0),
      ('poll5-o2','poll5','헤더 버전 (Accept: application/vnd.v1+json)',1),
      ('poll5-o3','poll5','쿼리 파라미터 (?version=1)',2),
      ('poll6-o1','poll6','매출 현황 대시보드',0),
      ('poll6-o2','poll6','재고·물류 대시보드',1),
      ('poll6-o3','poll6','KPI 요약 대시보드',2)
    ON CONFLICT (id) DO NOTHING
  `);

  await db.query(`
    INSERT INTO poll_votes (poll_id,option_id,user_id) VALUES
      ('poll1','poll1-o1','u2'),('poll1','poll1-o1','u3'),('poll1','poll1-o2','u4'),
      ('poll2','poll2-o1','u1'),('poll2','poll2-o2','u1'),('poll2','poll2-o2','u2'),
      ('poll3','poll3-o1','u3'),('poll3','poll3-o1','u4'),('poll3','poll3-o2','u5'),
      ('poll4','poll4-o1','u3'),('poll4','poll4-o2','u3'),('poll4','poll4-o2','u4'),('poll4','poll4-o3','u5'),
      ('poll5','poll5-o1','u1'),('poll5','poll5-o1','u2'),('poll5','poll5-o1','u3'),
      ('poll6','poll6-o3','u1'),('poll6','poll6-o1','u2'),('poll6','poll6-o3','u3'),('poll6','poll6-o2','u4')
    ON CONFLICT DO NOTHING
  `);

  console.log('Seed complete.');
  await db.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
