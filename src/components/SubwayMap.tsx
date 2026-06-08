"use client";

import { Station, SearchResult } from "@/types";
import { STATIONS } from "@/data/stations";

interface SubwayMapProps {
  results: SearchResult[];
  departures: Station[];
  onStationClick: (result: SearchResult) => void;
}

// Line colors
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

// Map bounds
const LAT_MIN = 37.26;
const LAT_MAX = 37.62;
const LNG_MIN = 126.78;
const LNG_MAX = 127.16;

const SVG_W = 800;
const SVG_H = 600;
const PAD = 40;

function project(lat: number, lng: number): [number, number] {
  const x = PAD + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (SVG_W - PAD * 2);
  const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (SVG_H - PAD * 2);
  return [x, y];
}

// Group stations by line
function getLineSegments() {
  const lineMap: Record<string, Station[]> = {};
  for (const station of STATIONS) {
    for (const line of station.lines) {
      if (!lineMap[line]) lineMap[line] = [];
      lineMap[line].push(station);
    }
  }
  return lineMap;
}

export default function SubwayMap({ results, departures, onStationClick }: SubwayMapProps) {
  const lineMap = getLineSegments();

  return (
    <div className="w-full overflow-x-auto bg-gray-50 rounded-xl border border-gray-200">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ minWidth: 320, maxHeight: 500 }}
      >
        {/* Lines */}
        {Object.entries(lineMap).map(([line, stations]) => {
          const color = LINE_COLORS[line] || "#aaa";
          const sorted = [...stations].sort((a, b) => a.lng - b.lng);
          const points = sorted.map((s) => project(s.lat, s.lng).join(",")).join(" ");
          return (
            <polyline
              key={line}
              points={points}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeOpacity={0.5}
            />
          );
        })}

        {/* All stations */}
        {STATIONS.map((station) => {
          const [x, y] = project(station.lat, station.lng);
          return (
            <circle key={station.id} cx={x} cy={y} r={2.5} fill="#ccc" />
          );
        })}

        {/* Departure markers */}
        {departures.map((station, i) => {
          const [x, y] = project(station.lat, station.lng);
          return (
            <g key={`dep-${i}`}>
              <circle cx={x} cy={y} r={8} fill="#3B82F6" opacity={0.9} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold">
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Result pins */}
        {results.map((result, i) => {
          const [x, y] = project(result.station.lat, result.station.lng);
          const rankColors = ["#EF4444", "#F97316", "#EAB308"];
          const color = rankColors[i] || "#6B7280";
          return (
            <g
              key={`result-${result.station.id}`}
              onClick={() => onStationClick(result)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={x} cy={y} r={14} fill={color} opacity={0.9} />
              <text x={x} y={y - 18} textAnchor="middle" fontSize={18}>
                📍
              </text>
              <text x={x} y={y + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
                {result.station.name}
              </text>
              <text x={x} y={y + 26} textAnchor="middle" fontSize={9} fill={color} fontWeight="bold">
                {result.avgMinutes}분
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g>
          <rect x={SVG_W - 160} y={10} width={150} height={Object.keys(LINE_COLORS).length * 14 + 10} rx={6} fill="white" opacity={0.85} />
          {Object.entries(LINE_COLORS).map(([line, color], i) => (
            <g key={line}>
              <rect x={SVG_W - 150} y={16 + i * 14} width={16} height={8} fill={color} rx={2} />
              <text x={SVG_W - 128} y={23 + i * 14} fontSize={8} fill="#444">{line}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
