"use client";

import { useState, useRef, useEffect } from "react";
import { Station } from "@/types";
import { useStationSearch } from "@/lib/useStationSearch";

interface StationInputProps {
  index: number;
  onSelect: (station: Station) => void;
  selected: Station | null;
}

export default function StationInput({ index, onSelect, selected }: StationInputProps) {
  const [query, setQuery] = useState(selected ? selected.name : "");
  const [open, setOpen] = useState(false);
  const results = useStationSearch(query);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {index + 1}번째 출발역
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="역 이름 입력 (예: 강남)"
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {results.map((station) => (
            <li
              key={station.id}
              onMouseDown={() => {
                onSelect(station);
                setQuery(station.name);
                setOpen(false);
              }}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm"
            >
              <span className="font-medium">{station.name}</span>
              <span className="text-gray-400 ml-2 text-xs">{station.lines.join(", ")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
