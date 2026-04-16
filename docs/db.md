# project_hub 데이터베이스 스키마

> PostgreSQL 192.168.0.199:5432 / database: `project_hub`

---

## 테이블 목록

### users
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 사용자 ID |
| name | TEXT NOT NULL | 이름 |
| email | TEXT NOT NULL UNIQUE | 이메일 |
| avatar | TEXT | 아바타 URL |
| role | TEXT NOT NULL | 역할 (owner/admin/member/viewer) |

---

### projects
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 프로젝트 ID |
| name | TEXT NOT NULL | 프로젝트명 |
| description | TEXT | 설명 |
| color | TEXT NOT NULL | 색상 hex |
| start_date | DATE | 시작일 |
| end_date | DATE | 종료일 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

### project_members
| 컬럼 | 타입 | 설명 |
|------|------|------|
| project_id | TEXT FK → projects | 프로젝트 |
| user_id | TEXT FK → users | 사용자 |
| role | TEXT NOT NULL | 역할 |
| PRIMARY KEY | (project_id, user_id) | |

### workflow_statuses
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 상태 ID |
| project_id | TEXT FK → projects | 프로젝트 |
| label | TEXT NOT NULL | 표시명 |
| color | TEXT NOT NULL | 색상 hex |
| order | INT NOT NULL | 정렬 순서 |

### tags
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 태그 ID |
| project_id | TEXT FK → projects | 프로젝트 |
| name | TEXT NOT NULL | 태그명 |
| color | TEXT NOT NULL | 색상 hex |

---

### tasks
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 업무 ID |
| project_id | TEXT FK → projects | 프로젝트 |
| title | TEXT NOT NULL | 제목 |
| description | TEXT | 설명 |
| status_id | TEXT NOT NULL | 워크플로우 상태 ID |
| priority | TEXT NOT NULL | 우선순위 (low/medium/high/urgent) |
| assignee_ids | TEXT[] | 담당자 ID 목록 |
| tag_ids | TEXT[] | 태그 ID 목록 |
| blocked_by | TEXT[] | 선행 업무 ID 목록 |
| start_date | DATE | 시작일 |
| due_date | DATE | 마감일 |
| estimated_hours | NUMERIC(6,2) | 예상 시간 |
| logged_hours | NUMERIC(6,2) | 기록된 시간 |
| order | INT NOT NULL | 컬럼 내 정렬 순서 |
| parent_id | TEXT | 부모 업무 ID (서브태스크) |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

---

### wiki_pages
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 페이지 ID |
| project_id | TEXT FK → projects | 프로젝트 |
| title | TEXT NOT NULL | 제목 |
| content | TEXT | 내용 (마크다운) |
| version | INT NOT NULL DEFAULT 1 | 버전 |
| author_id | TEXT FK → users | 작성자 |
| updated_at | TIMESTAMPTZ | 수정일 |

---

### announcements
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 공지 ID |
| project_id | TEXT FK → projects | 프로젝트 |
| title | TEXT NOT NULL | 제목 |
| content | TEXT | 내용 |
| author_id | TEXT FK → users | 작성자 |
| is_pinned | BOOL NOT NULL DEFAULT false | 고정 여부 |
| created_at | TIMESTAMPTZ | 생성일 |

---

### timeline_events
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 이벤트 ID |
| type | TEXT NOT NULL | 이벤트 타입 |
| actor_id | TEXT FK → users | 행위자 |
| payload | JSONB | 추가 데이터 |
| project_id | TEXT FK → projects | 프로젝트 |
| created_at | TIMESTAMPTZ | 발생일 |

---

### work_logs
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 로그 ID |
| task_id | TEXT FK → tasks | 업무 |
| user_id | TEXT FK → users | 사용자 |
| hours | NUMERIC(4,2) NOT NULL | 작업 시간 (0.5 단위) |
| note | TEXT | 메모 |
| date | DATE NOT NULL | 작업일 |
| created_at | TIMESTAMPTZ | 생성일 |

---

### files
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 파일 ID |
| project_id | TEXT FK → projects | 프로젝트 |
| name | TEXT NOT NULL | 파일명 |
| size | BIGINT NOT NULL | 파일 크기 (bytes) |
| mime_type | TEXT NOT NULL | MIME 타입 |
| uploader_id | TEXT FK → users | 업로더 |
| created_at | TIMESTAMPTZ | 업로드일 |

---

### polls
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 투표 ID |
| project_id | TEXT FK → projects | 프로젝트 |
| title | TEXT NOT NULL | 제목 |
| description | TEXT | 설명 |
| is_multiple | BOOL NOT NULL DEFAULT false | 복수 선택 여부 |
| show_results_before_close | BOOL NOT NULL DEFAULT true | 마감 전 결과 공개 |
| status | TEXT NOT NULL DEFAULT 'active' | 상태 (active/closed) |
| due_date | DATE | 마감일 |
| author_id | TEXT FK → users | 작성자 |
| created_at | TIMESTAMPTZ | 생성일 |

### poll_options
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | 선택지 ID |
| poll_id | TEXT FK → polls | 투표 |
| label | TEXT NOT NULL | 선택지 텍스트 |
| order | INT NOT NULL | 정렬 순서 |

### poll_votes
| 컬럼 | 타입 | 설명 |
|------|------|------|
| poll_id | TEXT FK → polls | 투표 |
| option_id | TEXT FK → poll_options | 선택지 |
| user_id | TEXT FK → users | 투표자 |
| PRIMARY KEY | (poll_id, option_id, user_id) | 중복 투표 방지 |

---

## ER 다이어그램 (요약)

```
users ──< project_members >── projects ──< workflow_statuses
                                       ──< tags
                                       ──< tasks
                                       ──< wiki_pages
                                       ──< announcements
                                       ──< timeline_events
                                       ──< files
                                       ──< polls ──< poll_options
                                                 ──< poll_votes
tasks ──< work_logs
```
