"use client";

import { useState, useMemo } from "react";
import { Station } from "@/types";
import { STATIONS } from "@/data/stations";

// 초성 매핑
const CHOSUNG = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function getChosung(str: string): string {
  return str.split("").map((ch) => {
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return ch;
    return CHOSUNG[Math.floor(code / 588)];
  }).join("");
}

function matchesQuery(station: Station, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (station.name.includes(q)) return true;
  // 초성 검색
  const chosung = getChosung(station.name);
  if (chosung.includes(q)) return true;
  return false;
}

export function useStationSearch(query: string): Station[] {
  return useMemo(() => {
    if (!query.trim()) return [];
    return STATIONS.filter((s) => matchesQuery(s, query)).slice(0, 10);
  }, [query]);
}

export function useStationSearchState() {
  const [query, setQuery] = useState("");
  const results = useStationSearch(query);
  return { query, setQuery, results };
}
