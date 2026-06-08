"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Station, SearchResult } from "@/types";
import { findBestStations } from "@/lib/algorithm";
import SubwayMap from "@/components/SubwayMap";
import StationDetailPanel from "@/components/StationDetailPanel";

const RANK_COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500"];
const RANK_LABELS = ["1위", "2위", "3위"];

export default function ResultPage() {
  const router = useRouter();
  const [departures, setDepartures] = useState<Station[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("selectedStations");
      if (!raw) {
        router.push("/setup");
        return;
      }
      const stations: Station[] = JSON.parse(raw);
      setDepartures(stations);
      findBestStations(stations)
        .then(setResults)
        .catch(() => setError("경로를 계산하는 중 오류가 발생했습니다."))
        .finally(() => setLoading(false));
    } catch {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }, [router]);

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

        {/* Map */}
        <div className="mb-6">
          <SubwayMap
            results={results}
            departures={departures}
            onStationClick={setSelected}
          />
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 bg-blue-500 rounded-full" /> 출발역
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 bg-red-500 rounded-full" /> 추천 역
          </span>
        </div>

        {/* Result cards */}
        {results.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>추천 역을 찾을 수 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, i) => (
              <div
                key={result.station.id}
                onClick={() => setSelected(result)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
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

                <div className="mt-3 flex flex-wrap gap-2">
                  {result.individualMinutes.map((min, j) => (
                    <span key={j} className="text-xs bg-gray-100 rounded-full px-3 py-1 text-gray-600">
                      {j + 1}번: {min >= 9999 ? "경로 없음" : `${min}분`}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-blue-400 mt-3">탭하여 주변 장소 보기 →</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <StationDetailPanel result={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
