"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Station, SearchResult, RoutePoint } from "@/types";
import { findBestStations } from "@/lib/algorithm";
import SubwayMap from "@/components/SubwayMap";
import StationDetailPanel from "@/components/StationDetailPanel";

const RANK_COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500"];
const RANK_BORDER_COLORS = ["border-red-200", "border-orange-200", "border-yellow-200"];
const RANK_LABELS = ["1위", "2위", "3위"];

// 사람별 경로 색상 (파랑 계열 → 초록 → 보라 → 등)
const PERSON_ROUTE_COLORS = [
  "#3B82F6", // 파란색
  "#10B981", // 초록색
  "#8B5CF6", // 보라색
  "#F59E0B", // 황색
  "#EF4444", // 빨간색
  "#06B6D4", // 시안
];

export interface RouteSegment {
  points: RoutePoint[];
  color: string;
  lineNum: number;
}

export interface PersonRoute {
  segments: RouteSegment[];
  totalPoints: RoutePoint[];
  personColor: string; // 사람별 대표 색상
}

export default function ResultPage() {
  const router = useRouter();
  const [departures, setDepartures] = useState<Station[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);

  // routes[resultIdx][personIdx] = PersonRoute
  const [routes, setRoutes] = useState<PersonRoute[][]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("selectedStations");
      if (!raw) {
        router.push("/setup");
        return;
      }
      const stations: Station[] = JSON.parse(raw);
      const namesRaw = sessionStorage.getItem("personNames");
      const personNames: string[] = namesRaw ? JSON.parse(namesRaw) : [];
      setDepartures(stations);

      findBestStations(stations, personNames)
        .then(async (foundResults) => {
          setResults(foundResults);
          setLoading(false);

          if (foundResults.length === 0) return;

          // 경로 geometry 비동기 로드
          setRoutesLoading(true);
          try {
            const pairs = foundResults.flatMap((result) =>
              stations.map((dep) => ({
                fromLat: dep.lat,
                fromLng: dep.lng,
                toLat: result.station.lat,
                toLng: result.station.lng,
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
              const routesByResult: PersonRoute[][] = foundResults.map((_, ri) =>
                stations.map((_, di) => {
                  const raw = data.routes[ri * nDep + di];
                  return {
                    segments: raw?.segments ?? [],
                    totalPoints: raw?.totalPoints ?? [],
                    personColor: PERSON_ROUTE_COLORS[di % PERSON_ROUTE_COLORS.length],
                  };
                })
              );
              setRoutes(routesByResult);
            }
          } catch {
            // 경로 표시는 선택 기능이므로 에러 무시
          } finally {
            setRoutesLoading(false);
          }
        })
        .catch(() => {
          setError("경로를 계산하는 중 오류가 발생했습니다.");
          setLoading(false);
        });
    } catch {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }, [router]);

  function handleCardClick(result: SearchResult, idx: number) {
    setSelected(result);
    setSelectedResultIdx(idx);
  }

  function handleMapClick(result: SearchResult) {
    setSelected(result);
    const idx = results.findIndex((r) => r.station.id === result.station.id);
    if (idx >= 0) setSelectedResultIdx(idx);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">최적 역을 계산 중입니다...</p>
        <p className="text-gray-400 text-sm">잠시만 기다려주세요</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-4xl">😞</div>
        <p className="text-gray-700 font-medium text-center">{error}</p>
        <button
          onClick={() => router.push("/search")}
          className="bg-blue-500 text-white px-6 py-3 rounded-xl"
        >
          다시 시도
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">추천 만남의 장소</h1>
          <button
            onClick={() => router.push("/search")}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            다시 검색
          </button>
        </div>

        {/* 지도 */}
        <div className="mb-2">
          <SubwayMap
            results={results}
            departures={departures}
            onStationClick={handleMapClick}
            routes={routes}
            selectedResultIdx={selectedResultIdx}
          />
        </div>

        {/* 범례 */}
        <div className="flex flex-wrap gap-3 mb-5 text-xs text-gray-500 px-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full" /> 출발역
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full" /> 추천 역
          </span>
          {departures.map((dep, i) => (
            <span key={i} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-1.5 rounded-full"
                style={{ backgroundColor: PERSON_ROUTE_COLORS[i % PERSON_ROUTE_COLORS.length] }}
              />
              {dep.name} 경로
            </span>
          ))}
          {routesLoading && (
            <span className="text-gray-400">경로 불러오는 중...</span>
          )}
        </div>

        {/* 결과 카드 */}
        {results.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>추천 역을 찾을 수 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, i) => {
              const isActive = selectedResultIdx === i;
              return (
                <div
                  key={result.station.id}
                  onClick={() => handleCardClick(result, i)}
                  className={`bg-white rounded-2xl p-5 shadow-sm border-2 cursor-pointer transition-all ${
                    isActive
                      ? `${RANK_BORDER_COLORS[i]} shadow-md`
                      : "border-gray-100 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`${RANK_COLORS[i]} text-white text-xs font-bold px-2 py-1 rounded-lg`}>
                        {RANK_LABELS[i]}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{result.station.name}</h3>
                        <p className="text-xs text-gray-400">{result.station.lines.join(", ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-600 font-bold text-xl">{result.avgMinutes}분</p>
                      <p className="text-xs text-gray-400">평균 소요</p>
                    </div>
                  </div>

                  {/* 사람별 소요 시간 + 출발역 */}
                  <div className="mt-3 flex flex-col gap-1.5">
                    {result.individualMinutes.map((min, j) => {
                      const name = result.personNames?.[j] || `${j + 1}번`;
                      const depName = departures[j]?.name ?? "";
                      const personColor = PERSON_ROUTE_COLORS[j % PERSON_ROUTE_COLORS.length];
                      const unreachable = min >= 9999;
                      return (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: personColor }}
                          />
                          <span className="text-gray-700 font-medium">{name}</span>
                          {depName && (
                            <span className="text-gray-400 text-xs">({depName})</span>
                          )}
                          <span className="ml-auto font-semibold" style={{ color: unreachable ? "#9CA3AF" : "#2563EB" }}>
                            {unreachable ? "경로 없음" : `${min}분`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-blue-400 mt-3">탭하여 주변 장소 보기 →</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <StationDetailPanel result={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
