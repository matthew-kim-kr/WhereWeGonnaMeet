"use client";

import { useCallback, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { Station, SearchResult } from "@/types";

interface SubwayMapProps {
  results: SearchResult[];
  departures: Station[];
  onStationClick: (result: SearchResult) => void;
}

const MAP_CENTER = { lat: 37.5326, lng: 127.0246 }; // 서울 중심

const MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 12,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: true,
  styles: [
    // 지하철 노선을 잘 보이도록 기본 스타일 유지, 불필요 POI 제거
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit.station", elementType: "labels", stylers: [{ visibility: "on" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ visibility: "on" }] },
  ],
};

const RANK_COLORS = ["#EF4444", "#F97316", "#EAB308"];

export default function SubwayMap({ results, departures, onStationClick }: SubwayMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [hoveredResult, setHoveredResult] = useState<SearchResult | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // 모든 마커가 보이도록 bounds 조정
    if (departures.length > 0 || results.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      departures.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
      results.forEach((r) => bounds.extend({ lat: r.station.lat, lng: r.station.lng }));
      map.fitBounds(bounds, { top: 80, right: 60, bottom: 60, left: 60 });
    }
  }, [departures, results]);

  if (loadError) {
    return (
      <div className="w-full h-[420px] flex items-center justify-center bg-gray-100 rounded-2xl">
        <p className="text-gray-500 text-sm">지도를 불러올 수 없습니다.<br />Maps JavaScript API 활성화 여부를 확인해주세요.</p>
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

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "420px" }}
        center={MAP_CENTER}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
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

        {/* 추천 역 마커 — 컬러 핀 */}
        {results.map((result, i) => (
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
              scale: 18,
              fillColor: RANK_COLORS[i] ?? "#6B7280",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2.5,
            }}
            title={`${result.station.name} (평균 ${result.avgMinutes}분)`}
            zIndex={20 + i}
            onClick={() => {
              setHoveredResult(result);
              onStationClick(result);
            }}
            onMouseOver={() => setHoveredResult(result)}
            onMouseOut={() => setHoveredResult(null)}
          />
        ))}

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
            <div style={{ fontFamily: "sans-serif", minWidth: 120 }}>
              <p style={{ fontWeight: "bold", marginBottom: 4, fontSize: 14 }}>
                {hoveredResult.station.name}
              </p>
              <p style={{ color: "#2563EB", fontWeight: "bold", fontSize: 16 }}>
                평균 {hoveredResult.avgMinutes}분
              </p>
              <p style={{ color: "#888", fontSize: 11, marginTop: 4 }}>
                탭하여 주변 장소 보기
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
