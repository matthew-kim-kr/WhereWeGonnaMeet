import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🗺️</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          우리 어디서 만날까?
        </h1>
        <p className="text-gray-500 text-lg mb-8 leading-relaxed">
          각자 출발역을 입력하면<br />
          모두가 이동하기 가장 편한<br />
          중간 지하철역을 추천해드립니다.
        </p>
        <Link
          href="/setup"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg px-10 py-4 rounded-2xl transition-colors shadow-md"
        >
          시작하기
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-6 text-center max-w-sm w-full">
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl">👥</div>
          <p className="text-xs text-gray-500">2~9명 지원</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl">🚇</div>
          <p className="text-xs text-gray-500">수도권 지하철</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl">📍</div>
          <p className="text-xs text-gray-500">TOP 3 추천</p>
        </div>
      </div>
    </main>
  );
}
