import { NextRequest, NextResponse } from "next/server";

interface TravelPair {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

async function fetchTravelTime(pair: TravelPair): Promise<number> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) return 9999;

  const url =
    `https://api.odsay.com/v1/api/searchPubTransPathT` +
    `?SX=${pair.fromLng}&SY=${pair.fromLat}` +
    `&EX=${pair.toLng}&EY=${pair.toLat}` +
    `&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Referer: "http://localhost:3000",
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (!res.ok) {
      console.error("[ODsay] HTTP error:", res.status);
      return 9999;
    }
    const data = await res.json();

    // ODsay 에러 응답 처리
    if (data?.error) {
      // 레이트 리밋 or 인증 에러 상세 로깅
      const code = data.error?.code;
      const msg = data.error?.message ?? JSON.stringify(data.error);
      console.error(`[ODsay] API error code=${code} msg=${msg}`);
      return 9999;
    }

    const totalTime = data?.result?.path?.[0]?.info?.totalTime;
    if (typeof totalTime === "number") return totalTime;

    // result 없음 — 경로 없음(도달 불가)이나 예상치 못한 응답 구조
    if (!data?.result) {
      console.warn("[ODsay] result 없음, 응답 keys:", Object.keys(data ?? {}).join(","));
    }
    return 9999;
  } catch (e) {
    console.error("[ODsay] fetch error:", e);
    return 9999;
  }
}

// 동시 요청 제한 (ODsay 레이트 리밋 방지)
async function fetchWithConcurrencyLimit(
  pairs: TravelPair[],
  concurrency = 5
): Promise<number[]> {
  const results: number[] = new Array(pairs.length).fill(9999);
  let idx = 0;

  async function worker() {
    while (idx < pairs.length) {
      const i = idx++;
      results[i] = await fetchTravelTime(pairs[i]);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pairs: TravelPair[] = body.pairs;

    if (!Array.isArray(pairs)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    console.log(`[travel-time] 요청 pairs 수: ${pairs.length}`);
    const times = await fetchWithConcurrencyLimit(pairs, 5);
    const validCount = times.filter((t) => t < 9999).length;
    console.log(`[travel-time] 유효 응답: ${validCount}/${pairs.length}`);

    return NextResponse.json({ times });
  } catch (e) {
    console.error("[travel-time] Server error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
