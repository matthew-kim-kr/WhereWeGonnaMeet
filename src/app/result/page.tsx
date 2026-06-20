"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Station, SearchResult, RoutePoint } from "@/types";
import { STATIONS } from "@/data/stations";
import { findBestStations } from "@/lib/algorithm";
import SubwayMap from "@/components/SubwayMap";
import StationDetailPanel from "@/components/StationDetailPanel";

export const PERSON_ROUTE_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#EF4444", "#84CC16",
];

const RANK_META = [
  { label: "1위", bg: "#EF4444", light: "#FEF2F2", border: "#FECACA" },
  { label: "2위", bg: "#F97316", light: "#FFF7ED", border: "#FED7AA" },
  { label: "3위", bg: "#EAB308", light: "#FEFCE8", border: "#FEF08A" },
];

export interface RouteSegment { points: RoutePoint[]; color: string; lineNum: number; }
export interface PersonRoute { segments: RouteSegment[]; totalPoints: RoutePoint[]; personColor: string; }

// useSearchParams는 Suspense 필요 → 내부 컴포넌트로 분리
export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [departures, setDepartures] = useState<Station[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);
  const [routes, setRoutes] = useState<PersonRoute[][]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "shared">("idle");

  // URL → 공유 URL 생성
  function buildShareUrl(stations: Station[], names: string[]): string {
    const url = new URL(window.location.href);
    url.searchParams.set("s", stations.map((s) => s.id).join(","));
    const validNames = names.filter(Boolean);
    if (validNames.length > 0) url.searchParams.set("n", names.join(","));
    else url.searchParams.delete("n");
    return url.toString();
  }

  // URL 파라미터에서 역·이름 복원
  function resolveFromParams(): { stations: Station[]; names: string[] } | null {
    const sParam = searchParams.get("s");
    if (!sParam) return null;
    const ids = sParam.split(",").map((id) => id.trim());
    const stations = ids.map((id) => STATIONS.find((s) => s.id === id)).filter(Boolean) as Station[];
    if (stations.length === 0) return null;
    const nParam = searchParams.get("n");
    const rawNames = nParam ? nParam.split(",") : [];
    // 역 수와 이름 수를 맞춤 (단축 URL 등으로 짧을 경우 빈 문자열로 패딩)
    const names = stations.map((_, i) => rawNames[i] ?? "");
    return { stations, names };
  }

  const fetchRoutes = useCallback(async (foundResults: SearchResult[], stations: Station[]) => {
    setRoutesLoading(true);
    try {
      const pairs = foundResults.flatMap((result) =>
        stations.map((dep) => ({
          fromLat: dep.lat, fromLng: dep.lng,
          toLat: result.station.lat, toLng: result.station.lng,
        }))
      );
      const res = await fetch("/api/route-geometry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairs }),
      });
      if (res.ok) {
        const data = await res.json();
        const nDep = stations.length;
        setRoutes(
          foundResults.map((_, ri) =>
            stations.map((_, di) => ({
              segments: data.routes[ri * nDep + di]?.segments ?? [],
              totalPoints: data.routes[ri * nDep + di]?.totalPoints ?? [],
              personColor: PERSON_ROUTE_COLORS[di % PERSON_ROUTE_COLORS.length],
            }))
          )
        );
      }
    } catch { /* 경로는 선택 기능 */ }
    finally { setRoutesLoading(false); }
  }, []);

  useEffect(() => {
    // 1) URL 파라미터 우선 → 없으면 sessionStorage
    const fromParams = resolveFromParams();
    const fromSession = (() => {
      try {
        const raw = sessionStorage.getItem("selectedStations");
        if (!raw) return null;
        const stations: Station[] = JSON.parse(raw);
        const namesRaw = sessionStorage.getItem("personNames");
        const names: string[] = namesRaw ? JSON.parse(namesRaw) : stations.map(() => "");
        return { stations, names };
      } catch { return null; }
    })();

    const source = fromParams ?? fromSession;
    if (!source) { router.push("/setup"); return; }

    const { stations, names } = source;
    setDepartures(stations);

    // 2) URL에 파라미터 반영 (history 오염 없이)
    window.history.replaceState({}, "", buildShareUrl(stations, names));

    findBestStations(stations, names)
      .then(async (foundResults) => {
        setResults(foundResults);
        setLoading(false);
        if (foundResults.length > 0) fetchRoutes(foundResults, stations);
      })
      .catch(() => { setError("경로를 계산하는 중 오류가 발생했습니다."); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 공유하기
  async function handleShare() {
    const url = window.location.href;
    const shareData = {
      title: "우리 어디서 만날까?",
      text: `중간 지점을 찾아봤어요! 확인해봐 🗺️`,
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        setShareState("shared");
        setTimeout(() => setShareState("idle"), 2000);
      } catch { /* 사용자가 취소 */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2000);
      } catch {
        // clipboard API 미지원 환경 — 수동 복사 안내
        prompt("아래 링크를 복사해주세요", url);
      }
    }
  }

  function handleCardClick(result: SearchResult, idx: number) {
    setSelected(result); setSelectedResultIdx(idx);
  }
  function handleMapClick(result: SearchResult) {
    setSelected(result);
    const idx = results.findIndex((r) => r.station.id === result.station.id);
    if (idx >= 0) setSelectedResultIdx(idx);
  }

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-5 px-6">
        <div className="text-5xl">😕</div>
        <div className="text-center">
          <p className="text-gray-800 font-bold text-lg mb-1">계산에 실패했어요</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
        <button onClick={() => router.push("/search")}
          className="bg-blue-500 text-white font-semibold px-8 py-3 rounded-2xl">
          다시 시도
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center gap-3 px-4 pt-14 pb-4 shadow-sm">
        <button onClick={() => router.push("/search")}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-extrabold text-gray-900 text-base flex-1">추천 만남의 장소</h1>

        {/* 공유 버튼 */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{
            backgroundColor: shareState !== "idle" ? "#DCFCE7" : "#EFF6FF",
            color: shareState !== "idle" ? "#15803D" : "#2563EB",
          }}
        >
          {shareState === "copied" ? (
            <><CheckIcon />링크 복사됨</>
          ) : shareState === "shared" ? (
            <><CheckIcon />공유 완료</>
          ) : (
            <><ShareIcon />공유하기</>
          )}
        </button>
      </header>

      <div className="flex-1 flex flex-col">
        {/* 지도 */}
        <SubwayMap
          results={results}
          departures={departures}
          onStationClick={handleMapClick}
          routes={routes}
          selectedResultIdx={selectedResultIdx}
        />

        {/* 경로 범례 */}
        <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex gap-4 overflow-x-auto scrollbar-hide">
          <LegendDot color="#3B82F6" label="출발역" circle />
          <LegendDot color="#EF4444" label="추천 역" circle />
          {departures.map((dep, i) => (
            <LegendDot key={i} color={PERSON_ROUTE_COLORS[i % PERSON_ROUTE_COLORS.length]} label={dep.name} />
          ))}
          {routesLoading && <span className="text-xs text-gray-400 flex-shrink-0 self-center">경로 불러오는 중...</span>}
        </div>

        {/* 결과 카드 */}
        <div className="flex-1 px-4 pt-4 pb-8 space-y-3">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-gray-500 font-medium">추천 역을 찾을 수 없습니다</p>
              <p className="text-gray-400 text-sm">입력한 역들이 너무 멀리 있을 수 있어요</p>
            </div>
          ) : (
            results.map((result, i) => (
              <ResultCard
                key={result.station.id}
                result={result}
                meta={RANK_META[i]}
                departures={departures}
                isActive={selectedResultIdx === i}
                onClick={() => handleCardClick(result, i)}
              />
            ))
          )}
        </div>
      </div>

      {selected && (
        <StationDetailPanel result={selected} departures={departures} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}

// ── 로딩 화면 ──
function LoadingScreen() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">🗺️</span>
      </div>
      <div className="text-center">
        <p className="text-gray-800 font-bold text-lg">최적 역 계산 중...</p>
        <p className="text-gray-400 text-sm mt-1">지하철 경로를 분석하고 있어요</p>
      </div>
      <div className="w-full max-w-sm space-y-3 mt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" style={{ opacity: 1 - i * 0.25 }} />
        ))}
      </div>
    </main>
  );
}

// ── 결과 카드 ──
function ResultCard({
  result, meta, departures, isActive, onClick,
}: {
  result: SearchResult;
  meta: { label: string; bg: string; light: string; border: string };
  departures: Station[];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98]"
      style={{
        border: `2px solid ${isActive ? meta.border : "#F3F4F6"}`,
        boxShadow: isActive ? `0 4px 16px ${meta.bg}22` : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
          style={{ backgroundColor: meta.bg }}>
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-gray-900 text-lg leading-tight truncate">{result.station.name}</p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {result.station.lines.map((line) => <LineChip key={line} line={line} />)}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-extrabold text-2xl leading-none" style={{ color: meta.bg }}>{result.avgMinutes}</p>
          <p className="text-xs text-gray-400 mt-0.5">분 평균</p>
        </div>
      </div>

      <div className="mx-4 border-t border-gray-100" />

      <div className="px-4 py-3 space-y-2">
        {result.individualMinutes.map((min, j) => {
          const name = result.personNames?.[j] || `${j + 1}번`;
          const depName = departures[j]?.name ?? "";
          const color = PERSON_ROUTE_COLORS[j % PERSON_ROUTE_COLORS.length];
          const unreachable = min >= 9999;
          return (
            <div key={j} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-sm font-semibold text-gray-700 truncate">{name}</span>
                  {depName && <span className="text-xs text-gray-400">({depName})</span>}
                </div>
                {!unreachable && (
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min((min / 60) * 100, 100)}%`,
                      backgroundColor: color, opacity: 0.6,
                    }} />
                  </div>
                )}
              </div>
              <span className="text-sm font-bold flex-shrink-0 ml-1"
                style={{ color: unreachable ? "#D1D5DB" : color }}>
                {unreachable ? "—" : `${min}분`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1 py-2.5 text-xs font-medium"
        style={{ backgroundColor: meta.light, color: meta.bg }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        주변 음식점·카페 보기
      </div>
    </div>
  );
}

// ── 유틸 컴포넌트 ──
function LegendDot({ color, label, circle }: { color: string; label: string; circle?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {circle
        ? <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        : <span className="w-5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      }
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

const LINE_STYLE: Record<string, { bg: string; text: string }> = {
  "1호선": { bg: "#0052A4", text: "#fff" }, "2호선": { bg: "#009246", text: "#fff" },
  "3호선": { bg: "#EF7C1C", text: "#fff" }, "4호선": { bg: "#00A5DE", text: "#fff" },
  "5호선": { bg: "#996CAC", text: "#fff" }, "6호선": { bg: "#CD7C2F", text: "#fff" },
  "7호선": { bg: "#747F00", text: "#fff" }, "8호선": { bg: "#E6186C", text: "#fff" },
  "9호선": { bg: "#BDB092", text: "#fff" }, "경의중앙선": { bg: "#77C4A3", text: "#fff" },
  "분당선": { bg: "#F5A200", text: "#fff" }, "신분당선": { bg: "#D4003B", text: "#fff" },
};

function LineChip({ line }: { line: string }) {
  const s = LINE_STYLE[line] ?? { bg: "#9CA3AF", text: "#fff" };
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
      {line}
    </span>
  );
}
