# 기운 한 스푼 개편 — 기술 구현 가능성 분석

**방향**: A+B 하이브리드 — "기운 도감 + 마스코트 육성"
**일자**: 2026-02-10

---

## 1. 코드 재사용 분석

### 그대로 재사용 가능 (변경 없음)

| 파일 | 이유 |
|------|------|
| `data/aura-types.ts` | 20종 기운 데이터 (id, name, energy, themeColor, keywords, personality, quote 등) — 그대로 사용 |
| `data/daily-quotes.ts` | 24개 일일 명언 — 홈 화면에 그대로 사용 |
| `data/evolution-stages.ts` | 5단계 진화 정보 (이미지 경로, 파티클 수, 글로우 등) — 그대로 사용 |
| `hooks/useInterstitialAd.ts` | GoogleAdMob 전면광고 훅 — 그대로 사용 |
| `components/DeviceViewport.tsx` | iOS safe-area 처리 — 그대로 사용 |
| `components/BrandIcons.tsx` | SparkleIcon, ShareIcon, RefreshIcon SVG — 그대로 사용 |
| `granite.config.ts` | 앱 설정 — 변경 불필요 |

### 부분 수정 필요

| 파일 | 수정 내용 |
|------|----------|
| `types.ts` | Screen 타입 확장 (`'home' \| 'reveal' \| 'result' \| 'collection' \| 'aura-detail' \| 'diary'`), 새 인터페이스 추가 |
| `utils/aura-engine.ts` | `getAuraForName`, `getEnergyPartner`, `getDailyQuote` 모두 재사용. 대표 마스코트 결정 함수 1개만 추가 |
| `utils/storage.ts` | 기존 함수 유지 + 새 스토리지 함수 추가 (먹이기 로그, 마스코트 상태, 확장 컬렉션 등) |
| `components/RevealScreen.tsx` | 99% 재사용. 먹이기 연출 모드 prop 1개 추가 가능 |
| `components/HomeScreen.tsx` | 대폭 개편 필요 — 대표 마스코트 중심 UI로 변경, 하단 탭 분리 |
| `components/ResultScreen.tsx` | 결과 후 "기운이에게 먹이기" 버튼 추가, 나머지 재사용 |

### 새로 작성 필요

| 파일 | 설명 |
|------|------|
| `App.tsx` | 탭 네비게이션 + 전역 상태 관리 재설계 |

### 재사용률 요약

- **데이터/유틸**: ~90% 재사용 (aura-types, evolution-stages, daily-quotes, aura-engine 핵심 로직)
- **훅/인프라**: 100% 재사용 (useInterstitialAd, DeviceViewport, BrandIcons)
- **화면 컴포넌트**: ~40% 재사용 (RevealScreen 거의 그대로, ResultScreen 부분 수정, HomeScreen 대폭 변경)
- **App.tsx**: 0% — 전면 재설계

---

## 2. 새 데이터 모델 설계

```typescript
// ── 대표 마스코트 ──
interface Mascot {
  auraId: number;          // 대표 기운 타입 ID (1~20)
  mood: MascotMood;        // 현재 기분
  lastFedDate: string;     // 마지막 먹이기 날짜 (YYYY-MM-DD)
  totalFeedings: number;   // 총 먹이기 횟수
  exp: number;             // 누적 경험치
}

type MascotMood = 'happy' | 'neutral' | 'sleepy';
// happy: 오늘 먹이기 완료
// neutral: 어제까지 먹이기 (1일 빠짐)
// sleepy: 2일 이상 미먹이기

// ── 확장 컬렉션 ──
interface CollectionEntry {
  auraId: number;
  discoveredDate: string;       // 최초 발견일 (YYYY-MM-DD)
  discoveredCount: number;      // 총 발견 횟수
  highestEvolutionViewed: EvolutionLevel; // 열람한 최고 진화 단계
}

interface ExtendedCollection {
  entries: CollectionEntry[];
}

// ── 일일 먹이기 로그 ──
interface FeedingLog {
  date: string;           // YYYY-MM-DD
  name: string;           // 입력한 이름
  auraId: number;         // 결과 기운 ID
  fedToMascot: boolean;   // 마스코트에게 먹였는지
}

// ── 유저 프로필/진행도 ──
interface UserProfile {
  streak: StreakData;                // 기존 스트릭 데이터
  mascot: Mascot;                   // 대표 마스코트
  collection: ExtendedCollection;   // 확장 컬렉션
  feedingHistory: FeedingLog[];     // 최근 30일 먹이기 로그
  firstVisitDate: string;           // 최초 방문일
  evolutionLevel: EvolutionLevel;   // 현재 진화 레벨
}

// ── 화면 타입 확장 ──
type Screen = 'home' | 'reveal' | 'result' | 'collection' | 'aura-detail' | 'diary';

// ── 탭 타입 ──
type TabId = 'home' | 'collection' | 'diary';
```

### 설계 근거

- `Mascot`은 별도 선택 화면 없이 가장 많이 받은 기운 타입 ID를 자동 결정 (feedingHistory에서 집계)
- `MascotMood`는 3단계로 단순화 — 복잡한 감정 시스템 대비 구현 비용 최소화
- `FeedingLog`는 최근 30일만 유지 — Storage 용량 고려
- `ExtendedCollection`은 기존 `CollectionData.discovered: number[]`의 상위 호환

---

## 3. 상태 관리 분석

### 현재 구조

```
App.tsx
├── screen: Screen (useState)
├── result: AuraResult | null (useState)
├── streak: number (useState)
├── collectionCount: number (useState)
├── dailyQuote: string (useState)
├── isReady: boolean (useState)
└── evolutionLevel: number (useMemo)
```

총 6개 useState + 1개 useMemo. 단일 화면 흐름이라 상태 간 의존이 단순.

### 개편 후 예상 상태

```
App.tsx (또는 AppProvider)
├── activeTab: TabId
├── screen: Screen
├── result: AuraResult | null
├── userProfile: UserProfile (streak, mascot, collection, feedingHistory, evolutionLevel)
├── dailyQuote: string
├── isReady: boolean
├── selectedAuraId: number | null (도감 상세용)
└── diaryMonth: string (일기 월 탐색용)
```

### 권장: useReducer + Context

**이유**:
1. `userProfile` 안에 mascot, collection, feedingHistory가 중첩 — 단순 setState로는 불변성 관리가 번거로움
2. "기운 먹이기" 액션 하나에 result, mascot.mood, mascot.exp, mascot.totalFeedings, collection, feedingHistory 6곳이 동시 갱신 필요
3. 여러 화면(홈, 결과, 도감, 일기)이 같은 userProfile을 참조

**구조**:

```typescript
// 전역 상태는 1개 Context + 1개 useReducer
type AppAction =
  | { type: 'INIT'; payload: UserProfile }
  | { type: 'SUBMIT_NAME'; payload: { name: string; auraResult: AuraResult } }
  | { type: 'FEED_MASCOT' }
  | { type: 'NAVIGATE'; payload: { screen: Screen; tab?: TabId } }
  | { type: 'SELECT_AURA'; payload: number }
  | { type: 'SET_DIARY_MONTH'; payload: string };

const AppContext = React.createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>(/* ... */);
```

**외부 라이브러리 불필요** — React 18 내장 useReducer + Context만으로 충분. Zustand나 Jotai 같은 라이브러리는 과도함 (상태 수가 적고, 서버 동기화 없음).

---

## 4. 네비게이션 설계

### 현 구조

- `screen` useState로 조건부 렌더링 (`home → reveal → result`)
- 단방향 선형 흐름

### 개편 구조: 탭 + 스택

React Router 없이, 2-레이어 내비게이션으로 구현:

```
Layer 1: Bottom Tab Bar (항상 표시)
├── Tab "홈"        → HomeTab
├── Tab "도감"      → CollectionTab
└── Tab "일기"      → DiaryTab

Layer 2: Stack (탭 위에 모달/풀스크린 오버레이)
├── RevealScreen    (이름 제출 후 리빌 애니메이션)
├── ResultScreen    (기운 결과)
└── AuraDetailModal (도감에서 기운 상세)
```

**구현 방법**:

```typescript
// App.tsx
const [activeTab, setActiveTab] = useState<TabId>('home');
const [overlayScreen, setOverlayScreen] = useState<OverlayScreen | null>(null);

return (
  <>
    {/* 탭 콘텐츠 */}
    {activeTab === 'home' && <HomeTab />}
    {activeTab === 'collection' && <CollectionTab />}
    {activeTab === 'diary' && <DiaryTab />}

    {/* 오버레이 (탭 위에 렌더) */}
    {overlayScreen === 'reveal' && <RevealScreen />}
    {overlayScreen === 'result' && <ResultScreen />}
    {overlayScreen === 'aura-detail' && <AuraDetailModal />}

    {/* 하단 탭바 (오버레이 시 숨김) */}
    {!overlayScreen && <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />}
  </>
);
```

**장점**:
- React Router 의존성 없음
- Granite 환경과 완벽 호환
- 기존 `screen` 패턴의 자연스러운 확장
- 탭 전환 시 상태 유지 (언마운트 안 함 — display:none 또는 조건부 visibility)

**주의**: 탭 콘텐츠를 매번 언마운트하면 도감 스크롤 위치가 리셋됨. `display: none`으로 숨기되 DOM에 유지하거나, 스크롤 위치를 state에 저장.

---

## 5. 이미지 로딩 전략

### 현재 에셋 규모

| 카테고리 | 수량 | 경로 패턴 | 예상 크기 |
|---------|------|----------|----------|
| 기운이 이미지 | 100장 | `/auras/{id}/lv{level}.png` (20종 x 5레벨) | 50~250KB 각 |
| 진화 마스코트 | 5장 | `/evolution/lv{level}.png` | ~100KB 각 |
| **합계** | **105장** | | **~12MB** |

### 전략: 3단계 계층적 로딩

**Tier 1 — 즉시 로드 (앱 초기화 시)**
```
/evolution/lv{현재레벨}.png     → 홈 화면 대표 마스코트 (1장)
/auras/{대표기운ID}/lv{레벨}.png → 홈 화면 대표 기운이 (1장)
```
총 2장. `<link rel="preload">` 또는 `new Image()` 프리페칭.

**Tier 2 — 화면 진입 시 로드**
```
/auras/{결과기운ID}/lv{레벨}.png → 결과 화면 진입 시
도감 그리드 썸네일 (lv0 이미지 20장)  → 도감 탭 최초 진입 시
```
총 ~21장. Intersection Observer로 뷰포트 진입 시 lazy load.

**Tier 3 — 사용자 요청 시 로드**
```
기운 상세의 진화 단계 이미지     → 상세 팝업에서 스와이프 시
기운이의 상위 레벨 이미지         → 해당 레벨 도달 후
```
나머지 ~80장. 사용자가 직접 요청할 때만 로드.

**구현**:

```typescript
// 경량 이미지 프리로드 유틸
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// 도감 그리드용 Lazy Image 컴포넌트
function LazyAuraImage({ auraId, level }: { auraId: number; level: EvolutionLevel }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setLoaded(true); },
      { rootMargin: '200px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {loaded && !error && (
        <img src={`/auras/${auraId}/lv${level}.png`} onError={() => setError(true)} />
      )}
      {(!loaded || error) && <SilhouettePlaceholder />}
    </div>
  );
}
```

**fallback 전략**: 모든 `<img>`에 onError → 실루엣/이모지 표시 (현재 코드에 이미 패턴 있음).

---

## 6. 스토리지 스키마 설계

### 현재 키 구조

| 키 | 값 | 비고 |
|----|---|------|
| `aura-spoon-today` | `TodayRecord` (JSON) | 오늘 결과만 |
| `aura-spoon-collection` | `CollectionData` (JSON) | `{ discovered: number[] }` |
| `aura-spoon-streak` | `StreakData` (JSON) | `{ currentStreak, lastDate }` |

### 개편 스키마

| 키 | 타입 | 설명 | 예상 크기 |
|----|------|------|----------|
| `aura-spoon-today` | `TodayRecord` | 오늘의 기운 결과 (기존 유지) | ~100B |
| `aura-spoon-streak` | `StreakData` | 연속 스트릭 (기존 유지) | ~60B |
| `aura-spoon-collection-v2` | `ExtendedCollection` | 확장 컬렉션 (발견일, 횟수, 열람 레벨) | ~2KB |
| `aura-spoon-mascot` | `Mascot` | 대표 마스코트 상태 | ~150B |
| `aura-spoon-feeding-log` | `FeedingLog[]` | 최근 30일 먹이기 기록 | ~3KB |
| `aura-spoon-profile` | `{ firstVisitDate, version }` | 메타 정보 + 스키마 버전 | ~80B |

**총 예상 사용량**: ~6KB (Storage API 한도 내 충분)

### 키 설계 원칙

1. **기존 키 유지** — `aura-spoon-today`, `aura-spoon-streak`은 변경 없이 마이그레이션 호환
2. **v2 접미사** — collection만 스키마가 변경되므로 `aura-spoon-collection-v2`로 분리, 마이그레이션 시 old → new 변환
3. **단일 키 = 단일 관심사** — profile에 모든 걸 넣지 않고 mascot, feeding-log 분리 (부분 업데이트 효율)
4. **30일 롤링** — feeding-log는 저장 시 30일 초과분 자동 삭제

---

## 7. 새 컴포넌트 목록

### 탭/네비게이션

| 컴포넌트 | 복잡도 | 설명 |
|---------|--------|------|
| `BottomTabBar` | 낮음 | 3탭 (홈/도감/일기) 하단 바, 아이콘+라벨, activeTab 하이라이트 |

### 홈 탭 (마스코트 육성)

| 컴포넌트 | 복잡도 | 설명 |
|---------|--------|------|
| `HomeTab` | 높음 | 대표 마스코트 + 기분 표시 + 진화 게이지 + 이름 입력 CTA. 현재 HomeScreen 대폭 개편 |
| `MascotDisplay` | 중간 | 대형 마스코트 이미지 + 무드 표시 + 터치 반응 (CSS 흔들림). 기존 evolution-mascot 섹션 확장 |
| `MoodIndicator` | 낮음 | 말풍선 형태로 현재 기분 텍스트 표시 ("오늘도 기운 줘서 고마워!", "배고파요...") |
| `FeedingAnimation` | 중간 | 기운 오브가 마스코트에게 흡수되는 파티클 애니메이션 (CSS keyframes) |

### 도감 탭

| 컴포넌트 | 복잡도 | 설명 |
|---------|--------|------|
| `CollectionTab` | 중간 | 4x5 그리드 + 진행률 헤더 + 마스터 배지 |
| `AuraCard` | 낮음 | 도감 그리드 단일 카드 (발견: 컬러이미지 + 이름 / 미발견: 회색 실루엣 + ?) |
| `AuraDetailModal` | 중간 | 풀스크린 모달. 기운 정보 + 진화 단계 스와이프 + 호환 기운. 현재 ResultScreen 일부 재활용 |
| `EvolutionSwiper` | 중간 | lv0~4 이미지 좌우 스와이프. 잠금 레벨은 자물쇠 오버레이 |

### 일기 탭

| 컴포넌트 | 복잡도 | 설명 |
|---------|--------|------|
| `DiaryTab` | 중간 | 월별 캘린더 뷰 + 일별 기운 아이콘 |
| `CalendarGrid` | 중간 | 7열 캘린더. 기운 먹인 날은 기운 색상 도트, 빈 날은 회색 |
| `DayDetail` | 낮음 | 특정 날짜 탭 시 하단 시트로 해당 일 기운 결과 표시 |

### 공통

| 컴포넌트 | 복잡도 | 설명 |
|---------|--------|------|
| `LevelUpOverlay` | 중간 | 진화 시 풀스크린 축하 연출 (플래시 + 새 모습 공개 + 메시지) |
| `Silhouette` | 낮음 | 미발견 기운이용 회색 실루엣 SVG (20종 공통 1개 또는 기운별 윤곽) |

### 복잡도별 집계

- **높음**: 1개 (HomeTab)
- **중간**: 7개 (MascotDisplay, FeedingAnimation, CollectionTab, AuraDetailModal, EvolutionSwiper, DiaryTab, CalendarGrid, LevelUpOverlay)
- **낮음**: 5개 (BottomTabBar, MoodIndicator, AuraCard, DayDetail, Silhouette)
- **합계**: 13개 신규 컴포넌트

---

## 8. 성능 우려 사항

### 번들 사이즈

| 항목 | 예상 영향 |
|------|----------|
| 새 컴포넌트 13개 | +15~25KB (gzip) — React 컴포넌트는 경량 |
| 추가 npm 패키지 | 0개 예상 (섹션 9 참조) — 영향 없음 |
| 에피소드/스토리 텍스트 | A+B 방향은 스토리 텍스트 없으므로 무관 |
| Tailwind CSS | tree-shaking으로 사용 클래스만 포함 — 영향 미미 |

**현재 번들 기준**: Rsbuild + React 18 + Tailwind + aura-types 데이터 → 추정 ~80~120KB gzip.
**개편 후 예상**: +20KB 내외 → 총 ~100~140KB gzip. **문제없음.**

### 이미지 로딩

| 우려 | 대책 |
|------|------|
| 도감 그리드 20장 동시 로딩 | Intersection Observer lazy load + 200px rootMargin으로 부드러운 스크롤 |
| 진화 스와이프 5장 | 현재 보이는 이미지 + 좌우 1장만 프리로드 |
| 초기 로딩 느림 | Tier 1 (2장만) 프리로드 → 2초 이내 FCP 달성 가능 |
| 100장 총 ~12MB | 전체 로드 불필요. 유저가 앱 전 생애주기에 걸쳐 점진적으로 로드 |

### 애니메이션 성능

| 애니메이션 | 구현 | 성능 |
|-----------|------|------|
| 마스코트 터치 반응 | CSS `transform: rotate()` + `scale()` | GPU 가속, 문제없음 |
| 먹이기 파티클 | CSS `@keyframes` + `transform` + `opacity` | 파티클 8~12개 이하면 60fps 유지 |
| 진화 축하 연출 | CSS `backdrop-filter: blur()` + `scale` | blur는 비용 높지만 1회성이라 수용 가능 |
| 도감 그리드 스크롤 | 네이티브 overflow-y scroll | 문제없음 |
| 진화 스와이프 | CSS `transform: translateX()` + touch 이벤트 | GPU 가속 |

**핵심 원칙**: JS 기반 requestAnimationFrame 루프 대신 CSS transform/opacity 애니메이션만 사용 → 메인 스레드 블로킹 없음.

### 메모리

- 도감 탭을 `display: none`으로 숨길 경우, 20장의 `<img>` 요소가 메모리에 유지
- 최대 동시 메모리: 홈 마스코트(1장) + 도감 그리드(20장) + 진화 스와이프(3장) = ~24장 = ~6MB
- 모바일 웹뷰 기준 충분히 수용 가능

---

## 9. 외부 의존성

### 현재 dependencies

```json
{
  "@apps-in-toss/web-framework": "1.5.2",
  "@granite-js/native": "^0.1.0",
  "@swc/helpers": "^0.5.18",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "remixicon": "^4.6.0"
}
```

### 개편에 필요한 새 패키지: 없음

| 기능 | 기존 대안 | 새 패키지 불필요 이유 |
|------|----------|---------------------|
| 상태 관리 | `useReducer` + `Context` | 상태 수 적고 서버 동기화 없음 |
| 날짜 처리 | `date-fns` (이미 있음) | 캘린더 날짜 계산에 date-fns 충분 |
| 스와이프 | `onTouchStart/Move/End` 네이티브 | 외부 스와이프 라이브러리 과도 |
| 아이콘 | `remixicon` (이미 있음) + BrandIcons | 탭 아이콘 등 충분 |
| 캘린더 | 직접 구현 (7열 그리드) | react-calendar 등은 스타일 커스텀 비용 > 직접 구현 비용 |
| 라우팅 | 조건부 렌더링 | React Router는 과도 |
| 애니메이션 | CSS @keyframes | framer-motion 등은 번들 +30KB |

**결론**: `package.json` 변경 없음. 기존 의존성만으로 모든 기능 구현 가능.

---

## 10. 기존 사용자 데이터 마이그레이션

### 마이그레이션 대상

| 기존 키 | 기존 형태 | 마이그레이션 |
|---------|----------|------------|
| `aura-spoon-today` | `{ date, name, auraId }` | 변경 없음 — 그대로 사용 |
| `aura-spoon-streak` | `{ currentStreak, lastDate }` | 변경 없음 — 그대로 사용 |
| `aura-spoon-collection` | `{ discovered: [1, 5, 12, ...] }` | → `aura-spoon-collection-v2`로 변환 |

### 마이그레이션 전략: 앱 초기화 시 자동 변환

```typescript
async function migrateIfNeeded(): Promise<void> {
  const version = await Storage.getItem('aura-spoon-profile');

  // 이미 마이그레이션 완료
  if (version) return;

  // 1. 기존 collection → collection-v2 변환
  const oldCollection = await Storage.getItem('aura-spoon-collection');
  if (oldCollection) {
    const { discovered }: { discovered: number[] } = JSON.parse(oldCollection);
    const today = getTodayString();

    const entries: CollectionEntry[] = discovered.map(auraId => ({
      auraId,
      discoveredDate: today,  // 정확한 날짜 불명 → 마이그레이션 일자로
      discoveredCount: 1,     // 횟수 불명 → 1로 초기화
      highestEvolutionViewed: 0 as EvolutionLevel,
    }));

    await Storage.setItem('aura-spoon-collection-v2', JSON.stringify({ entries }));
  }

  // 2. mascot 초기화 — 기존 컬렉션에서 가장 ID가 작은 기운을 대표로
  const collection = await getExtendedCollection();
  const defaultAuraId = collection.entries.length > 0
    ? collection.entries[0].auraId
    : 1;  // 수집 이력 없으면 불꽃기운(ID 1)

  const streak = await getStreak();
  const mascot: Mascot = {
    auraId: defaultAuraId,
    mood: streak.lastDate === getTodayString() ? 'happy' : 'neutral',
    lastFedDate: streak.lastDate || '',
    totalFeedings: collection.entries.reduce((sum, e) => sum + e.discoveredCount, 0),
    exp: 0,
  };
  await Storage.setItem('aura-spoon-mascot', JSON.stringify(mascot));

  // 3. profile 메타 저장 (마이그레이션 완료 마커)
  await Storage.setItem('aura-spoon-profile', JSON.stringify({
    firstVisitDate: streak.lastDate || getTodayString(),
    version: 2,
  }));
}
```

### 마이그레이션 주의사항

1. **비파괴적** — 기존 `aura-spoon-collection` 키는 삭제하지 않음 (롤백 안전망)
2. **한 번만 실행** — `aura-spoon-profile` 존재 여부로 판단
3. **데이터 손실 최소화** — discoveredDate가 정확하지 않은 건 "마이그레이션 일자"로 표시 (사용자에게 영향 거의 없음)
4. **신규 사용자** — profile이 없고 collection도 없으면 바로 v2 스키마로 초기화

---

## 부록: 구현 우선순위 제안

### Phase 1 (핵심 골격)
1. types.ts 확장 + storage.ts v2 함수 + 마이그레이션
2. useReducer + Context 기반 AppProvider
3. BottomTabBar + 탭 네비게이션
4. HomeTab (마스코트 표시 + 기존 이름 입력)

### Phase 2 (도감)
5. CollectionTab + AuraCard (4x5 그리드)
6. AuraDetailModal + EvolutionSwiper

### Phase 3 (육성)
7. MascotDisplay + MoodIndicator
8. FeedingAnimation
9. LevelUpOverlay

### Phase 4 (일기 + 마감)
10. DiaryTab + CalendarGrid + DayDetail
11. 이미지 lazy loading 최적화
12. 전체 통합 테스트 + 성능 검증

---

## 결론

A+B 하이브리드 방향은 **기술적으로 완전히 실현 가능**합니다.

- 기존 코드의 데이터/유틸/인프라 레이어는 ~90% 재사용
- 외부 의존성 추가 없이 React 18 내장 기능만으로 구현
- 이미지 100장은 계층적 lazy loading으로 성능 문제 없음
- Storage 사용량 ~6KB로 한도 내 충분
- 마이그레이션은 앱 초기화 시 1회 자동 실행, 비파괴적
- 신규 컴포넌트 13개 중 "높음" 복잡도는 1개(HomeTab)뿐
- 번들 사이즈 증가 ~20KB — 2초 이내 로딩 기준 충족
