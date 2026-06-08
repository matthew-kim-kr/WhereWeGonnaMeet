"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Station } from "@/types";
import StationInput from "@/components/StationInput";

export default function SearchPage() {
  const router = useRouter();
  const [personCount, setPersonCount] = useState(2);
  const [selected, setSelected] = useState<(Station | null)[]>([]);

  useEffect(() => {
    const count = parseInt(sessionStorage.getItem("personCount") || "2", 10);
    setPersonCount(count);
    setSelected(Array(count).fill(null));
  }, []);

  function handleSelect(index: number, station: Station) {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = station;
      return next;
    });
  }

  const allSelected = selected.length === personCount && selected.every(Boolean);

  function handleSearch() {
    if (!allSelected) return;
    sessionStorage.setItem("selectedStations", JSON.stringify(selected));
    router.push("/result");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">출발역을 입력해주세요</h1>
          <p className="text-gray-500 text-sm">{personCount}명의 출발역을 모두 입력해주세요</p>
        </div>

        <div className="space-y-4 mb-8">
          {Array.from({ length: personCount }, (_, i) => (
            <StationInput
              key={i}
              index={i}
              selected={selected[i] || null}
              onSelect={(station) => handleSelect(i, station)}
            />
          ))}
        </div>

        <button
          onClick={handleSearch}
          disabled={!allSelected}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
        >
          최적 역 찾기
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
