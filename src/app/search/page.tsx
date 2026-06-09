"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Station } from "@/types";
import StationInput from "@/components/StationInput";

// 사람별 색상 팔레트
const PERSON_PALETTE = [
  { name: "파랑",  hex: "#3B82F6", light: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", label: "bg-blue-500"   },
  { name: "초록",  hex: "#10B981", light: "#ECFDF5", border: "#A7F3D0", text: "#047857", label: "bg-emerald-500"},
  { name: "보라",  hex: "#8B5CF6", light: "#F5F3FF", border: "#DDD6FE", text: "#6D28D9", label: "bg-violet-500" },
  { name: "주황",  hex: "#F59E0B", light: "#FFFBEB", border: "#FDE68A", text: "#B45309", label: "bg-amber-500"  },
  { name: "분홍",  hex: "#EC4899", light: "#FDF2F8", border: "#FBCFE8", text: "#BE185D", label: "bg-pink-500"   },
  { name: "시안",  hex: "#06B6D4", light: "#ECFEFF", border: "#A5F3FC", text: "#0E7490", label: "bg-cyan-500"   },
  { name: "빨강",  hex: "#EF4444", light: "#FEF2F2", border: "#FECACA", text: "#B91C1C", label: "bg-red-500"    },
  { name: "라임",  hex: "#84CC16", light: "#F7FEE7", border: "#D9F99D", text: "#4D7C0F", label: "bg-lime-500"   },
];

const ORDINALS = ["첫 번째", "두 번째", "세 번째", "네 번째", "다섯 번째", "여섯 번째", "일곱 번째", "여덟 번째", "아홉 번째"];

export default function SearchPage() {
  const router = useRouter();
  const [personCount, setPersonCount] = useState(2);
  const [selected, setSelected] = useState<(Station | null)[]>([]);
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    const count = parseInt(sessionStorage.getItem("personCount") || "2", 10);
    setPersonCount(count);
    setSelected(Array(count).fill(null));
    setNames(Array(count).fill(""));
  }, []);

  function handleSelect(index: number, station: Station) {
    setSelected((prev) => { const n = [...prev]; n[index] = station; return n; });
  }
  function handleClear(index: number) {
    setSelected((prev) => { const n = [...prev]; n[index] = null; return n; });
  }
  function handleNameChange(index: number, value: string) {
    setNames((prev) => { const n = [...prev]; n[index] = value; return n; });
  }

  const filledCount = selected.filter(Boolean).length;
  const allSelected = filledCount === personCount;

  function handleSearch() {
    if (!allSelected) return;
    sessionStorage.setItem("selectedStations", JSON.stringify(selected));
    sessionStorage.setItem("personNames", JSON.stringify(names));
    router.push("/result");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center px-4 pt-14 pb-4 shadow-sm">
        <Link
          href="/setup"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        {/* 스텝 인디케이터 */}
        <div className="flex gap-1.5 mx-auto">
          <span className="w-6 h-1.5 rounded-full bg-gray-200" />
          <span className="w-6 h-1.5 rounded-full bg-blue-500" />
        </div>
        <div className="w-9" />
      </header>

      {/* 타이틀 */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-extrabold text-gray-900">이름과 출발역을 입력해주세요</h1>
        <p className="text-sm text-gray-400 mt-1">
          {personCount}명 중 <span className="text-blue-600 font-semibold">{filledCount}명</span> 입력 완료
        </p>
      </div>

      {/* 입력 카드 목록 */}
      <div className="flex-1 px-4 pb-36 space-y-3">
        {Array.from({ length: personCount }, (_, i) => {
          const palette = PERSON_PALETTE[i % PERSON_PALETTE.length];
          const isDone = !!selected[i];
          return (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden border transition-shadow"
              style={{
                borderColor: isDone ? palette.border : "#E5E7EB",
                boxShadow: isDone ? `0 0 0 1px ${palette.border}` : undefined,
              }}
            >
              {/* 카드 헤더 */}
              <div
                className="flex items-center gap-2.5 px-4 py-3"
                style={{ backgroundColor: isDone ? palette.light : "#F9FAFB" }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: palette.hex }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: isDone ? palette.text : "#6B7280" }}
                >
                  {ORDINALS[i]} 모임원
                </span>
                {isDone && (
                  <span className="ml-auto">
                    <svg className="w-4 h-4" style={{ color: palette.hex }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </span>
                )}
              </div>

              {/* 인풋 영역 */}
              <div className="px-4 pb-4 pt-3 space-y-3">
                {/* 이름 */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    이름 (선택)
                  </label>
                  <input
                    type="text"
                    value={names[i] || ""}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    placeholder={`예: 김도균`}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": palette.hex } as React.CSSProperties}
                  />
                </div>

                {/* 출발역 */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    출발역
                  </label>
                  <StationInput
                    index={i}
                    selected={selected[i] || null}
                    onSelect={(station) => handleSelect(i, station)}
                    onClear={() => handleClear(i)}
                    personColor={palette.hex}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 pt-4 pb-safe shadow-lg">
        <button
          onClick={handleSearch}
          disabled={!allSelected}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
          style={{
            background: allSelected
              ? "linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)"
              : undefined,
            backgroundColor: allSelected ? undefined : "#E5E7EB",
            color: allSelected ? "white" : "#9CA3AF",
            boxShadow: allSelected ? "0 4px 14px rgba(99,102,241,0.4)" : undefined,
          }}
        >
          {allSelected ? "최적의 장소 찾기 →" : `출발역을 ${personCount - filledCount}개 더 입력해주세요`}
        </button>
      </div>
    </main>
  );
}
