"use client";

import { useState, useMemo } from "react";
import { Station } from "@/types";
import { STATIONS } from "@/data/stations";

// ── 초성 추출 ──────────────────────────────────────────────
const CHOSUNG = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function getChosung(str: string): string {
  return str
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHOSUNG[Math.floor(code / 588)];
    })
    .join("");
}

// 순수 초성(ㄱ~ㅎ)으로만 이루어진 쿼리인지 판별
function isPureChosung(q: string): boolean {
  return q.length > 0 && [...q].every((ch) => CHOSUNG.includes(ch));
}

// ── 검색 점수 (낮을수록 먼저 표시) ────────────────────────
// 0: 이름 완전 일치
// 1: 이름 앞부분 일치
// 2: 이름 중간 포함
// 3: 초성 앞부분 일치
// 4: 초성 중간 포함
// 9999: 불일치
function scoreStation(station: Station, q: string): number {
  const name = station.name.toLowerCase();
  const chosung = getChosung(station.name);
  const query = q.trim().toLowerCase();

  if (!query) return 9999;

  // 한글 이름 매칭 (순수 초성이 아닐 때)
  if (!isPureChosung(query)) {
    if (name === query) return 0;
    if (name.startsWith(query)) return 1;
    if (name.includes(query)) return 2;
  }

  // 초성 매칭
  if (chosung.startsWith(query)) return isPureChosung(query) ? 1 : 3;
  if (chosung.includes(query)) return isPureChosung(query) ? 2 : 4;

  return 9999;
}

// ── 훅 ───────────────────────────────────────────────────
export function useStationSearch(query: string): Station[] {
  return useMemo(() => {
    const q = query.trim();
    if (q.length === 0) return [];

    return STATIONS
      .map((s) => ({ station: s, sc: scoreStation(s, q) }))
      .filter(({ sc }) => sc < 9999)
      .sort((a, b) =>
        a.sc !== b.sc
          ? a.sc - b.sc
          : a.station.name.localeCompare(b.station.name, "ko")
      )
      .slice(0, 10)
      .map(({ station }) => station);
  }, [query]);
}

export function useStationSearchState() {
  const [query, setQuery] = useState("");
  const results = useStationSearch(query);
  return { query, setQuery, results };
}
