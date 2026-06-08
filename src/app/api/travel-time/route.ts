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

  const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${pair.fromLng}&SY=${pair.fromLat}&EX=${pair.toLng}&EY=${pair.toLat}&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return 9999;
    const data = await res.json();
    const totalTime = data?.result?.path?.[0]?.info?.totalTime;
    if (typeof totalTime === "number") return totalTime;
    return 9999;
  } catch {
    return 9999;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pairs: TravelPair[] = body.pairs;

    if (!Array.isArray(pairs)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const times = await Promise.all(pairs.map(fetchTravelTime));
    return NextResponse.json({ times });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
