"use client";

import { useEffect, useState } from "react";
import { SearchResult, Place } from "@/types";

interface StationDetailPanelProps {
  result: SearchResult;
  onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  restaurant: "음식점",
  cafe: "카페",
  tourist_attraction: "관광명소",
  bar: "바",
  bakery: "베이커리",
};

function getPlaceLabel(types: string[]): string {
  for (const t of types) {
    if (TYPE_LABEL[t]) return TYPE_LABEL[t];
  }
  return "장소";
}

export default function StationDetailPanel({ result, onClose }: StationDetailPanelProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/places?lat=${result.station.lat}&lng=${result.station.lng}`)
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
      })
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, [result.station.id, result.station.lat, result.station.lng]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{result.station.name}</h2>
            <p className="text-sm text-gray-500">{result.station.lines.join(", ")}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-600 font-medium mb-2">평균 소요 시간: <span className="text-lg font-bold">{result.avgMinutes}분</span></p>
          <div className="flex flex-wrap gap-2">
            {result.individualMinutes.map((min, i) => (
              <span key={i} className="text-xs bg-white border border-blue-200 rounded-full px-3 py-1 text-blue-700">
                {i + 1}번째: {min >= 9999 ? "경로 없음" : `${min}분`}
              </span>
            ))}
          </div>
        </div>

        <h3 className="font-semibold text-gray-700 mb-3">주변 장소</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : places.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">주변 장소 정보를 불러올 수 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {places.map((place, i) => (
              <li key={i} className="flex items-start gap-3 border-b border-gray-100 pb-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{place.name}</p>
                  <p className="text-xs text-gray-500">{place.vicinity}</p>
                  <p className="text-xs text-gray-400 mt-1">{getPlaceLabel(place.types)}</p>
                </div>
                {place.rating && (
                  <div className="flex items-center gap-1 text-yellow-500 text-xs font-medium shrink-0">
                    ⭐ {place.rating}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
