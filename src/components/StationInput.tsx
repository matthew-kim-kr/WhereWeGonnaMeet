"use client";

import { useState, useRef, useEffect } from "react";
import { Station } from "@/types";
import { useStationSearch } from "@/lib/useStationSearch";

interface StationInputProps {
  index: number;
  onSelect: (station: Station) => void;
  onClear?: () => void;
  selected: Station | null;
  personColor?: string; // hex
}

export default function StationInput({
  onSelect,
  onClear,
  selected,
  personColor = "#3B82F6",
}: StationInputProps) {
  const [query, setQuery] = useState(selected ? selected.name : "");
  const [open, setOpen] = useState(false);
  const results = useStationSearch(query);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected) setQuery(selected.name);
  }, [selected]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 선택 완료 상태
  if (selected && !open) {
    return (
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
        {/* 역 이름 + 노선 */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: personColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{selected.name}</p>
          <p className="text-xs text-gray-400 truncate">{selected.lines.join(" · ")}</p>
        </div>
        {/* 변경 버튼 */}
        <button
          onClick={() => {
            setQuery("");
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
            if (onClear) onClear();
          }}
          className="text-xs text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
        >
          변경
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="역 이름 검색 (예: 강남, ㄱㄴ)"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ "--tw-ring-color": personColor } as React.CSSProperties}
          autoFocus={!selected}
        />
        {query.length > 0 && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
          </button>
        )}
      </div>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute z-[100] w-full bg-white border border-gray-200 rounded-2xl shadow-2xl mt-2 overflow-hidden">
          {results.length > 0 ? (
            <ul className="max-h-56 overflow-y-auto scrollbar-hide py-1">
              {results.map((station, i) => (
                <li
                  key={station.id}
                  onMouseDown={() => {
                    onSelect(station);
                    setQuery(station.name);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${i > 0 ? "border-t border-gray-50" : ""}`}
                >
                  <span className="text-lg">🚉</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 text-sm">{station.name}</span>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {station.lines.map((line) => (
                        <LineChip key={line} line={line} />
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.length >= 1 ? (
            <div className="px-4 py-5 text-center text-gray-400 text-sm">
              <p className="text-xl mb-1">🔍</p>
              <p>"{query}" 검색 결과가 없어요</p>
              <p className="text-xs mt-1">역 이름이나 초성으로 검색해보세요</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// 노선 색상 매핑
const LINE_STYLE: Record<string, { bg: string; text: string }> = {
  "1호선": { bg: "#0052A4", text: "#fff" },
  "2호선": { bg: "#009246", text: "#fff" },
  "3호선": { bg: "#EF7C1C", text: "#fff" },
  "4호선": { bg: "#00A5DE", text: "#fff" },
  "5호선": { bg: "#996CAC", text: "#fff" },
  "6호선": { bg: "#CD7C2F", text: "#fff" },
  "7호선": { bg: "#747F00", text: "#fff" },
  "8호선": { bg: "#E6186C", text: "#fff" },
  "9호선": { bg: "#BDB092", text: "#fff" },
  "경의중앙선": { bg: "#77C4A3", text: "#fff" },
  "분당선": { bg: "#F5A200", text: "#fff" },
  "신분당선": { bg: "#D4003B", text: "#fff" },
};

function LineChip({ line }: { line: string }) {
  const style = LINE_STYLE[line] ?? { bg: "#9CA3AF", text: "#fff" };
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {line}
    </span>
  );
}
