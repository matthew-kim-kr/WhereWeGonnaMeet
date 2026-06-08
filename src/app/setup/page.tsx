"use client";

import { useRouter } from "next/navigation";

const COUNTS = [2, 3, 4, 5, 6, 7, 8, 9];

export default function SetupPage() {
  const router = useRouter();

  function handleSelect(count: number) {
    sessionStorage.setItem("personCount", String(count));
    router.push("/search");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">몇 명이 모이나요?</h1>
        <p className="text-gray-500">인원수를 선택해주세요</p>
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-sm w-full">
        {COUNTS.map((count) => (
          <button
            key={count}
            onClick={() => handleSelect(count)}
            className="aspect-square flex flex-col items-center justify-center bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-2xl text-2xl font-bold text-gray-700 hover:text-blue-600 transition-all shadow-sm"
          >
            {count}
            <span className="text-xs font-normal text-gray-400 mt-1">명</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.back()}
        className="mt-10 text-gray-400 hover:text-gray-600 text-sm"
      >
        ← 뒤로
      </button>
    </main>
  );
}
