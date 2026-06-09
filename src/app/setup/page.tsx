"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const COUNTS = [2, 3, 4, 5, 6, 7, 8, 9];

// 인원 수에 따른 안내 문구
const HINTS: Record<number, string> = {
  2: "둘이서 만나요 🤝",
  3: "셋이서 만나요 😄",
  4: "넷이서 만나요 🎉",
  5: "다섯 명이서 만나요 🙌",
  6: "여섯 명이서 만나요 🎊",
  7: "일곱 명이서 만나요 🚀",
  8: "여덟 명이서 만나요 ✨",
  9: "아홉 명이서 만나요 🎆",
};

export default function SetupPage() {
  const router = useRouter();

  function handleSelect(count: number) {
    sessionStorage.setItem("personCount", String(count));
    router.push("/search");
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center px-4 pt-14 pb-4">
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        {/* 스텝 인디케이터 */}
        <div className="flex gap-1.5 mx-auto">
          <span className="w-6 h-1.5 rounded-full bg-blue-500" />
          <span className="w-6 h-1.5 rounded-full bg-gray-200" />
        </div>
        <div className="w-9" />
      </header>

      {/* 본문 */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">몇 명이 모이나요?</h1>
          <p className="text-gray-400 text-sm">인원 수를 선택하면 바로 다음 단계로 이동해요</p>
        </div>

        {/* 인원 선택 그리드 */}
        <div className="grid grid-cols-4 gap-3 max-w-sm">
          {COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => handleSelect(count)}
              className="aspect-square flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 active:bg-blue-100 border-2 border-transparent hover:border-blue-300 active:border-blue-500 rounded-2xl transition-all active:scale-95"
            >
              <span className="text-2xl font-extrabold text-gray-800 leading-none">{count}</span>
              <span className="text-xs text-gray-400 mt-1 font-medium">명</span>
            </button>
          ))}
        </div>

        {/* 힌트 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-2xl">
          <p className="text-xs text-blue-500 font-medium">💡 tip</p>
          <p className="text-sm text-blue-700 mt-1">
            인원이 많을수록 계산에 조금 더 시간이 걸릴 수 있어요
          </p>
        </div>
      </div>
    </main>
  );
}
