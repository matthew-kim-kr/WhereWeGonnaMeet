"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline,
} from "@react-google-maps/api";
import { Station, SearchResult } from "@/types";
import type { PersonRoute } from "@/app/result/page";

interface SubwayMapProps {
  results: SearchResult[];
  departures: Station[];
  onStationClick: (result: SearchResult) => void;
  routes?: PersonRoute[][]; // routes[resultIdx][personIdx]
  selectedResultIdx?: number;
}

const MAP_CENTER = { lat: 37.5326, lng: 127.0246 };

const MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 12,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: true,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit.station", elementType: "labels", stylers: [{ visibility: "on" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ visibility: "on" }] },
  ],
};

const RANK_COLORS = ["#EF4444", "#F97316", "#EAB308"];

export default function SubwayMap({
  results,
  departures,
  onStationClick,
  routes = [],
  selectedResultIdx = 0,
}: SubwayMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [hoveredResult, setHoveredResult] = useState<SearchResult | null>(null);
  const prevBoundsKey = useRef<string>("");

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fitAll(map);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function fitAll(map: google.maps.Map) {
    if (departures.length === 0 && results.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    departures.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    results.forEach((r) => bounds.extend({ lat: r.station.lat, lng: r.station.lng }));
    map.fitBounds(bounds, { top: 80, right: 60, bottom: 60, left: 60 });
  }

  // 결과가 새로 로드되면 bounds 재조정
  useEffect(() => {
    if (!mapRef.current || results.length === 0) return;
    const key = results.map((r) => r.station.id).join(",");
    if (key === prevBoundsKey.current) return;
    prevBoundsKey.current = key;
    fitAll(mapRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  if (loadError) {
    return (
      <div className="w-full h-[420px] flex items-center justify-center bg-gray-100 rounded-2xl">
        <p className="text-gray-500 text-sm text-center">
          지도를 불러올 수 없습니다.
          <br />
          Maps JavaScript API 활성화 여부를 확인해주세요.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[420px] flex items-center justify-center bg-gray-100 rounded-2xl animate-pulse">
        <p className="text-gray-400 text-sm">지도 불러오는 중...</p>
      </div>
    );
  }

  // 선택된 결과의 경로들 (personIdx 배열)
  const currentPersonRoutes = routes[selectedResultIdx] ?? [];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "460px" }}
        center={MAP_CENTER}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {/* 경로 폴리라인 — 선택된 결과의 각 사람 경로 */}
        {currentPersonRoutes.map((personRoute, personIdx) =>
          personRoute.segments.map((seg, segIdx) =>
            seg.points.length > 1 ? (
              <Polyline
                key={`route-${selectedResultIdx}-${personIdx}-${segIdx}`}
                path={seg.points}
                options={{
                  strokeColor: personRoute.personColor,
                  strokeOpacity: 0.85,
                  strokeWeight: 4,
                  zIndex: 5,
                }}
              />
            ) : null
          )
        )}

        {/* 출발역 마커 — 파란 원 번호 */}
        {departures.map((station, i) => (
          <Marker
            key={`dep-${station.id}-${i}`}
            position={{ lat: station.lat, lng: station.lng }}
            label={{
              text: `${i + 1}`,
              color: "white",
              fontWeight: "bold",
              fontSize: "12px",
            }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: "#3B82F6",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
            title={station.name}
            zIndex={10}
          />
        ))}

        {/* 추천 역 마커 */}
        {results.map((result, i) => {
          const isSelected = selectedResultIdx === i;
          return (
            <Marker
              key={`result-${result.station.id}`}
              position={{ lat: result.station.lat, lng: result.station.lng }}
              label={{
                text: `${i + 1}위`,
                color: "white",
                fontWeight: "bold",
                fontSize: "11px",
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: isSelected ? 22 : 18,
                fillColor: RANK_COLORS[i] ?? "#6B7280",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: isSelected ? 3 : 2,
              }}
              title={`${result.station.name} (평균 ${result.avgMinutes}분)`}
              zIndex={isSelected ? 30 : 20 + i}
              onClick={() => {
                setHoveredResult(result);
                onStationClick(result);
              }}
              onMouseOver={() => setHoveredResult(result)}
              onMouseOut={() => setHoveredResult(null)}
            />
          );
        })}

        {/* 호버 InfoWindow */}
        {hoveredResult && (
          <InfoWindow
            position={{
              lat: hoveredResult.station.lat,
              lng: hoveredResult.station.lng,
            }}
            onCloseClick={() => setHoveredResult(null)}
            options={{ disableAutoPan: true }}
          >
            <div style={{ fontFamily: "sans-serif", minWidth: 140 }}>
              <p style={{ fontWeight: "bold", marginBottom: 4, fontSize: 14 }}>
                {hoveredResult.station.name}
              </p>
              <p style={{ color: "#2563EB", fontWeight: "bold", fontSize: 16 }}>
                평균 {hoveredResult.avgMinutes}분
              </p>
              {hoveredResult.individualMinutes.map((min, j) => {
                const name = hoveredResult.personNames?.[j] || `${j + 1}번`;
                return (
                  <p key={j} style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
                    {name}: {min >= 9999 ? "경로 없음" : `${min}분`}
                  </p>
                );
              })}
              <p style={{ color: "#888", fontSize: 11, marginTop: 6 }}>
                탭하여 주변 장소 보기
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
