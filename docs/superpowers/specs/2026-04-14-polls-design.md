# 투표(Poll) 기능 설계 스펙

**날짜**: 2026-04-14  
**OP**: OP-10  
**브랜치**: `feature/OP-10-polls`  
**상태**: 승인됨

---

## 개요

CLAUDE.md P2 항목인 "공지사항 / 투표" 중 **투표** 기능을 독립 페이지(`/polls`)로 구현한다.  
프로젝트 멤버가 투표를 생성하고, 참여하고, 결과를 확인할 수 있다.

---

## 데이터 타입

### `PollOption`
```ts
interface PollOption {
  id: string;
  label: string;
  voterIds: string[];   // 이 선택지에 투표한 userId 목록
}
```

### `Poll`
```ts
type PollStatus = 'active' | 'closed';

interface Poll {
  id: string;
  projectId: string;
  title: string;
  description: string;
  options: PollOption[];               // 최소 2개, 최대 10개
  isMultiple: boolean;                 // 복수 선택 여부
  showResultsBeforeClose: boolean;     // 진행 중 결과 공개 여부
  status: PollStatus;
  dueDate?: string;                    // YYYY-MM-DD, 없으면 수동 종료
  authorId: string;
  createdAt: string;
}
```

### AppState 추가
```ts
polls: Record<string, Poll>;
```

---

## 스토어 액션

| 액션 | 설명 |
|---|---|
| `createPoll(data)` | Poll 생성. id/createdAt 자동 부여 |
| `updatePoll(id, patch)` | 제목·설명 수정 (진행 중인 투표만) |
| `deletePoll(id)` | Poll 삭제 |
| `castVote(pollId, optionId, userId)` | 투표. 단일 선택이면 기존 표 자동 취소 후 새 선택지에 추가 |
| `retractVote(pollId, optionId, userId)` | 복수 선택 시 특정 선택지 표 취소 |
| `closePoll(id)` | status를 'closed'로 변경 |

### 시드 데이터
- 3~4건의 샘플 투표 (진행 중 2건, 종료 1~2건, 프로젝트 p1·p2 혼합)

---

## UI 구조

### 페이지 레이아웃 (`/polls`)

```
┌─ Header ──────────────────────────────────────────────────────┐
│  투표              [프로젝트 셀렉터]          [+ 투표 만들기]    │
├───────────────────────────────────────────────────────────────┤
│  [진행 중 (N)]  [종료된 투표 (N)]                               │
│                                                               │
│  PollCard × N                                                 │
└───────────────────────────────────────────────────────────────┘
```

### PollCard

- 제목, 설명(1줄 truncate)
- 배지: 마감일 D-day / 종료 표시, 단일/복수 선택 표시, 총 투표수
- 결과 표시 규칙:
  - `showResultsBeforeClose = true` + 진행 중 → 실시간 결과 바 표시
  - `showResultsBeforeClose = false` + 진행 중 + 미투표 → "투표 후 결과를 확인할 수 있습니다" 안내
  - `showResultsBeforeClose = false` + 진행 중 + 투표 완료 → 결과 바 표시
  - 종료된 투표 → 항상 결과 바 표시
- 현재 유저가 투표한 선택지: 파란색(`primary`) 강조
- 액션 버튼:
  - 진행 중 + 작성자: [수동 마감] [삭제]
  - 진행 중 + 일반: [투표하기] (미투표 시) / [투표 취소] (복수 선택 시 선택지별)
  - 종료: 결과만 표시

### PollCreateModal

필드:
- 제목 (필수)
- 설명 (선택)
- 선택지 목록 (최소 2개, 최대 10개, 동적 추가/삭제)
- 선택 방식: 단일 / 복수 토글
- 실시간 결과 공개 여부 토글
- 마감일 (선택, date input)

유효성:
- 제목 비어있으면 제출 불가
- 선택지 2개 미만이면 제출 불가
- 빈 선택지 텍스트 있으면 제출 불가

---

## 파일 구조

```
src/pages/polls/
  PollsPage.tsx          — 메인 페이지 (탭, 목록, 프로젝트 필터)
  PollCard.tsx           — 개별 투표 카드
  PollCreateModal.tsx    — 투표 생성 모달
```

수정 파일:
- `src/types/index.ts` — Poll, PollOption, PollStatus 타입 추가
- `src/data/seed.ts` — MOCK_POLLS_RAW 시드 데이터 추가
- `src/store/useAppStore.ts` — polls 상태 + 액션 추가
- `src/App.tsx` — `/polls` 라우트 추가
- `src/components/layout/Sidebar.tsx` — 투표 메뉴 추가 (Vote 아이콘)

---

## 결과 바 계산

```ts
const totalVotes = poll.options.reduce((sum, o) => sum + o.voterIds.length, 0);
const pct = totalVotes === 0 ? 0 : Math.round((option.voterIds.length / totalVotes) * 100);
```

---

## 범위 제외

- 익명 투표 (voterIds 항상 기록)
- 투표 수정 (생성 후 선택지 변경 불가)
- 댓글/리액션
- 알림 연동
