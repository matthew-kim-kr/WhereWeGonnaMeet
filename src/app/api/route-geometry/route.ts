import { NextRequest, NextResponse } from "next/server";
import { RoutePoint } from "@/types";

interface RoutePair {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

// 지하철 노선 색상 (ODsay 호선 번호 → HEX)
const LINE_COLORS: Record<number, string> = {
  1: "#0052A4",
  2: "#009246",
  3: "#EF7C1C",
  4: "#00A5DE",
  5: "#996CAC",
  6: "#CD7C2F",
  7: "#747F00",
  8: "#E6186C",
  9: "#BDB092",
};
const DEFAULT_LINE_COLOR = "#888888";

interface RouteSegment {
  points: RoutePoint[];
  color: string;
  lineNum: number;
}

interface RouteResult {
  segments: RouteSegment[];
  totalPoints: RoutePoint[];
}

async function fetchRouteGeometry(pair: RoutePair): Promise<RouteResult> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) return { segments: [], totalPoints: [] };

  const url =
    `https://api.odsay.com/v1/api/searchPubTransPathT` +
    `?SX=${pair.fromLng}&SY=${pair.fromLat}` +
    `&EX=${pair.toLng}&EY=${pair.toLat}` +
    `&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Referer: "http://localhost:3000", "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return { segments: [], totalPoints: [] };

    const data = await res.json();
    if (data?.error) return { segments: [], totalPoints: [] };

    const path = data?.result?.path?.[0];
    if (!path) return { segments: [], totalPoints: [] };

    const segments: RouteSegment[] = [];
    const totalPoints: RoutePoint[] = [];

    for (const subPath of path.subPath ?? []) {
      // trafficType: 1=지하철, 2=버스, 3=도보
      const lineNum: number = subPath?.lane?.[0]?.subwayCode ?? 0;
      const color = LINE_COLORS[lineNum] ?? DEFAULT_LINE_COLOR;

      const stations: Array<{ x: string | number; y: string | number }> =
        subPath?.passStopList?.stations ?? [];

      if (stations.length < 2) continue;

      const points: RoutePoint[] = stations
        .map((st) => ({
          lat: parseFloat(String(st.y)),
          lng: parseFloat(String(st.x)),
        }))
        .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));

      if (points.length > 0) {
        segments.push({ points, color, lineNum });
        totalPoints.push(...points);
      }
    }

    return { segments, totalPoints };
  } catch {
    return { segments: [], totalPoints: [] };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pairs }: { pairs: RoutePair[] } = await req.json();
    if (!Array.isArray(pairs)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // 동시 요청 (최대 5)
    const batchSize = 5;
    const results: RouteResult[] = [];

    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(fetchRouteGeometry));
      results.push(...batchResults);
    }

    return NextResponse.json({ routes: results });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
