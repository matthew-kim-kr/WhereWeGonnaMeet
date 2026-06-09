"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Station } from "@/types";
import StationInput from "@/components/StationInput";

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
    setSelected((prev) => {
      const next = [...prev];
      next[index] = station;
      return next;
    });
  }

  function handleNameChange(index: number, value: string) {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const allSelected =
    selected.length === personCount && selected.every(Boolean);

  function handleSearch() {
    if (!allSelected) return;
    sessionStorage.setItem("selectedStations", JSON.stringify(selected));
    sessionStorage.setItem("personNames", JSON.stringify(names));
    router.push("/result");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            모임원의 이름과 출발역을 입력해주세요
          </h1>
          <p className="text-gray-500 text-sm">
            {personCount}명의 정보를 모두 입력해주세요
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {Array.from({ length: personCount }, (_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-blue-500 mb-3">
                {i + 1}번째 모임원
              </p>

              {/* 이름 */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={names[i] || ""}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  placeholder={`이름 입력 (예: 김도균)`}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>

              {/* 출발역 */}
              <StationInput
                index={i}
                selected={selected[i] || null}
                onSelect={(station) => handleSelect(i, station)}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSearch}
          disabled={!allSelected}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
        >
          최적의 장소 찾기
        </button>

        <button
          onClick={() => router.back()}
          className="w-full mt-4 text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 뒤로
        </button>
      </div>
    </main>
  );
}
