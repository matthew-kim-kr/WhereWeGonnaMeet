"use client";

import { Station, SearchResult } from "@/types";
import { STATIONS } from "@/data/stations";

interface SubwayMapProps {
  results: SearchResult[];
  departures: Station[];
  onStationClick: (result: SearchResult) => void;
}

const LINE_COLORS: Record<string, string> = {
  "1호선": "#0052A4",
  "2호선": "#00A84D",
  "3호선": "#EF7C1C",
  "4호선": "#00A5DE",
  "5호선": "#996CAC",
  "6호선": "#CD7C2F",
  "7호선": "#747F00",
  "8호선": "#E6186C",
  "9호선": "#BDB092",
  "신분당선": "#D4003B",
  "경의중앙선": "#77C4A3",
  "분당선": "#F5A200",
};

// 수도권 범위
const LAT_MIN = 37.28;
const LAT_MAX = 37.70;
const LNG_MIN = 126.78;
const LNG_MAX = 127.22;

const SVG_W = 800;
const SVG_H = 560;
const PAD = 48;

function project(lat: number, lng: number): [number, number] {
  const x = PAD + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (SVG_W - PAD * 2);
  const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (SVG_H - PAD * 2);
  return [x, y];
}

// 대표 노선색 (역이 여러 노선에 속하면 첫 번째 노선 색)
function stationColor(station: Station): string {
  return LINE_COLORS[station.lines[0]] ?? "#aaa";
}

export default function SubwayMap({ results, departures, onStationClick }: SubwayMapProps) {
  const resultIds = new Set(results.map((r) => r.station.id));
  const departureIds = new Set(departures.map((d) => d.id));

  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ minWidth: 320, maxHeight: 480 }}
      >
        {/* 배경 */}
        <rect width={SVG_W} height={SVG_H} fill="#f8fafc" />

        {/* 일반 역 — 작은 점 */}
        {STATIONS.map((station) => {
          if (resultIds.has(station.id) || departureIds.has(station.id)) return null;
          const [x, y] = project(station.lat, station.lng);
          const color = stationColor(station);
          return (
            <circle
              key={station.id}
              cx={x}
              cy={y}
              r={3}
              fill={color}
              opacity={0.35}
            />
          );
        })}

        {/* 출발역 마커 — 파란 원 + 번호 */}
        {departures.map((station, i) => {
          const [x, y] = project(station.lat, station.lng);
          return (
            <g key={`dep-${i}`}>
              <circle cx={x} cy={y} r={13} fill="#3B82F6" />
              <circle cx={x} cy={y} r={11} fill="#3B82F6" stroke="white" strokeWidth={2} />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="white" fontWeight="bold">
                {i + 1}
              </text>
              {/* 역 이름 레이블 */}
              <text x={x} y={y - 18} textAnchor="middle" fontSize={9} fill="#1d4ed8" fontWeight="bold">
                {station.name}
              </text>
            </g>
          );
        })}

        {/* 추천 역 핀 */}
        {results.map((result, i) => {
          const [x, y] = project(result.station.lat, result.station.lng);
          const colors = ["#EF4444", "#F97316", "#EAB308"];
          const bgColor = colors[i] ?? "#6B7280";
          return (
            <g
              key={`result-${result.station.id}`}
              onClick={() => onStationClick(result)}
              style={{ cursor: "pointer" }}
            >
              {/* 그림자 효과 */}
              <circle cx={x + 1} cy={y + 2} r={18} fill="rgba(0,0,0,0.15)" />
              {/* 핀 원 */}
              <circle cx={x} cy={y} r={18} fill={bgColor} />
              <circle cx={x} cy={y} r={16} fill={bgColor} stroke="white" strokeWidth={2.5} />
              {/* 순위 숫자 */}
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="white" fontWeight="bold">
                {i + 1}
              </text>
              {/* 역 이름 */}
              <text x={x} y={y - 26} textAnchor="middle" fontSize={10} fill={bgColor} fontWeight="bold">
                {result.station.name}
              </text>
              {/* 평균 소요시간 */}
              <text x={x} y={y + 32} textAnchor="middle" fontSize={9} fill="#555">
                평균 {result.avgMinutes}분
              </text>
            </g>
          );
        })}

        {/* 범례 */}
        <g>
          <rect x={12} y={SVG_H - 52} width={160} height={42} rx={8} fill="white" opacity={0.9} />
          <circle cx={30} cy={SVG_H - 36} r={7} fill="#3B82F6" />
          <text x={42} y={SVG_H - 32} fontSize={9} fill="#444">출발역</text>
          <circle cx={30} cy={SVG_H - 20} r={7} fill="#EF4444" />
          <text x={42} y={SVG_H - 16} fontSize={9} fill="#444">추천 역 (탭하면 주변 장소 보기)</text>
        </g>
      </svg>
    </div>
  );
}
