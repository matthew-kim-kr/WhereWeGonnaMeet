import { NextResponse } from "next/server";

// 실제 알고리즘과 동일한 조건으로 3쌍을 병렬 요청해서 결과 확인
const TEST_PAIRS = [
  // 강남 → 홍대입구
  { fromLat: 37.4979, fromLng: 127.0276, toLat: 37.5572, toLng: 126.9249 },
  // 역삼 → 신촌
  { fromLat: 37.5004, fromLng: 127.0365, toLat: 37.5553, toLng: 126.9368 },
  // 잠실 → 합정
  { fromLat: 37.5133, fromLng: 127.1001, toLat: 37.5498, toLng: 126.9148 },
  // 건대입구 → 왕십리
  { fromLat: 37.5403, fromLng: 127.0702, toLat: 37.5614, toLng: 127.0379 },
  // 사당 → 홍대입구
  { fromLat: 37.4764, fromLng: 126.9816, toLat: 37.5572, toLng: 126.9249 },
];

async function fetchSingle(
  pair: { fromLat: number; fromLng: number; toLat: number; toLng: number },
  index: number
) {
  const apiKey = process.env.ODSAY_API_KEY;
  const url =
    `https://api.odsay.com/v1/api/searchPubTransPathT` +
    `?SX=${pair.fromLng}&SY=${pair.fromLat}` +
    `&EX=${pair.toLng}&EY=${pair.toLat}` +
    `&apiKey=${encodeURIComponent(apiKey || "")}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Referer: "http://localhost:3000", "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();
    const totalTime = data?.result?.path?.[0]?.info?.totalTime;
    return {
      index,
      httpStatus: res.status,
      totalTime: totalTime ?? null,
      hasError: !!data?.error,
      errorCode: data?.error?.code ?? null,
      errorMsg: data?.error?.message ?? null,
      rawKeys: Object.keys(data ?? {}),
    };
  } catch (e) {
    return { index, error: String(e) };
  }
}

export async function GET() {
  const apiKey = process.env.ODSAY_API_KEY;

  // 5개를 동시에 요청 (실제 알고리즘의 concurrency=5와 동일)
  const results = await Promise.all(TEST_PAIRS.map((pair, i) => fetchSingle(pair, i)));

  return NextResponse.json({
    apiKeyPresent: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 6)}...` : "없음",
    concurrency: TEST_PAIRS.length,
    results,
  });
}
