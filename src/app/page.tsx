import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* 히어로 섹션 */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-white text-center"
        style={{
          background: "linear-gradient(145deg, #1E40AF 0%, #3B82F6 45%, #6366F1 100%)",
        }}
      >
        <div className="text-7xl mb-6 select-none" role="img" aria-label="지도">
          🗺️
        </div>

        <h1 className="text-3xl font-extrabold mb-3 tracking-tight leading-tight">
          우리 어디서 만날까?
        </h1>
        <p className="text-blue-100 text-base leading-relaxed mb-10 max-w-xs">
          각자 출발역만 입력하면<br />
          모두에게 가장 가까운<br />
          만남의 장소를 찾아드려요
        </p>

        <Link
          href="/setup"
          className="flex items-center gap-2 bg-white text-blue-600 font-bold text-lg px-10 py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          시작하기
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 기능 소개 */}
      <div className="bg-white px-6 py-10">
        <div className="max-w-sm mx-auto space-y-5">
          <FeatureItem
            emoji="👥"
            title="2~9명 동시 지원"
            desc="친구, 동료, 가족 모두 가능해요"
            color="bg-blue-50"
          />
          <FeatureItem
            emoji="🚇"
            title="실제 지하철 소요시간 계산"
            desc="ODsay 기반 수도권 환승 경로 포함"
            color="bg-indigo-50"
          />
          <FeatureItem
            emoji="📍"
            title="TOP 3 역 추천 + 지도 경로"
            desc="주변 음식점·카페 정보도 함께 제공"
            color="bg-violet-50"
          />
        </div>
      </div>

      {/* 하단 */}
      <div className="pb-safe bg-white border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        서울·경기 지하철 한정 베타 서비스
      </div>
    </main>
  );
}

function FeatureItem({
  emoji,
  title,
  desc,
  color,
}: {
  emoji: string;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${color} rounded-2xl px-5 py-4`}>
      <span className="text-3xl select-none">{emoji}</span>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
