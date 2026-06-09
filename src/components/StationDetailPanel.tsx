"use client";

import { useEffect, useState } from "react";
import { SearchResult, Place, Station } from "@/types";
import { PERSON_ROUTE_COLORS } from "@/app/result/page";

interface StationDetailPanelProps {
  result: SearchResult;
  departures?: Station[];
  onClose: () => void;
}

const TYPE_META: Record<string, { label: string; emoji: string }> = {
  restaurant:         { label: "음식점",   emoji: "🍽️" },
  cafe:               { label: "카페",     emoji: "☕" },
  bar:                { label: "바·주점",  emoji: "🍻" },
  bakery:             { label: "베이커리", emoji: "🥐" },
  tourist_attraction: { label: "관광명소", emoji: "🏛️" },
  food:               { label: "음식점",   emoji: "🍽️" },
};

function getPlaceMeta(types: string[]) {
  for (const t of types) {
    if (TYPE_META[t]) return TYPE_META[t];
  }
  return { label: "장소", emoji: "📍" };
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className="w-3 h-3"
            viewBox="0 0 20 20"
            fill={star <= full ? "#F59E0B" : star === full + 1 && half ? "url(#half)" : "#E5E7EB"}
          >
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-500 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function StationDetailPanel({ result, departures = [], onClose }: StationDetailPanelProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "restaurant" | "cafe">("all");

  useEffect(() => {
    setLoading(true);
    setPlaces([]);
    fetch(`/api/places?lat=${result.station.lat}&lng=${result.station.lng}`)
      .then((r) => r.json())
      .then((data) => setPlaces(data.places || []))
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, [result.station.id, result.station.lat, result.station.lng]);

  const filtered = places.filter((p) => {
    if (filter === "all") return true;
    return p.types.includes(filter);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/50"
      onClick={onClose}
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div
        className="bg-white w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="pt-3 pb-0">
          <div className="drag-handle" />
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 scrollbar-hide">
          {/* 역 정보 헤더 */}
          <div className="px-5 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{result.station.name}</h2>
              <div className="flex gap-1 mt-1 flex-wrap">
                {result.station.lines.map((line) => (
                  <LineChip key={line} line={line} />
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors mt-0.5"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 평균 시간 배너 */}
          <div className="mx-5 mb-4 bg-blue-50 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-700">평균 소요 시간</p>
              <p className="text-2xl font-extrabold text-blue-600">{result.avgMinutes}분</p>
            </div>
            <div className="space-y-2">
              {result.individualMinutes.map((min, i) => {
                const name = result.personNames?.[i] || `${i + 1}번`;
                const dep = departures[i]?.name ?? "";
                const color = PERSON_ROUTE_COLORS[i % PERSON_ROUTE_COLORS.length];
                const unreachable = min >= 9999;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {name}{dep ? <span className="text-gray-400 text-xs ml-1">({dep})</span> : null}
                    </span>
                    <span className="text-sm font-bold" style={{ color: unreachable ? "#D1D5DB" : color }}>
                      {unreachable ? "경로 없음" : `${min}분`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 주변 장소 */}
          <div className="px-5 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-gray-900 text-base">주변 장소</h3>
              {/* 필터 탭 */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-0.5">
                {(["all", "restaurant", "cafe"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: filter === f ? "white" : "transparent",
                      color: filter === f ? "#1D4ED8" : "#6B7280",
                      boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.1)" : undefined,
                    }}
                  >
                    {f === "all" ? "전체" : f === "restaurant" ? "🍽️ 식당" : "☕ 카페"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-gray-400 text-sm">주변 장소 정보를 불러올 수 없어요</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((place, i) => {
                  const meta = getPlaceMeta(place.types);
                  return (
                    <div key={i} className="bg-gray-50 rounded-2xl p-3.5 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-gray-800 text-sm leading-snug flex-1 min-w-0 line-clamp-2">
                          {place.name}
                        </p>
                        <span className="text-lg flex-shrink-0 leading-none">{meta.emoji}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-snug line-clamp-2">{place.vicinity}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-lg">
                          {meta.label}
                        </span>
                        {place.rating ? (
                          <StarRating rating={place.rating} />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pb-safe" />
        </div>
      </div>
    </div>
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
    <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>
      {line}
    </span>
  );
}
