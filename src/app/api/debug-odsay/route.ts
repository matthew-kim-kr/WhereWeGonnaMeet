import { NextResponse } from "next/server";

// 강남 → 홍대입구 단건 테스트
export async function GET() {
  const apiKey = process.env.ODSAY_API_KEY;

  const url =
    `https://api.odsay.com/v1/api/searchPubTransPathT` +
    `?SX=127.0276&SY=37.4979` + // 강남
    `&EX=126.9249&EY=37.5572` + // 홍대입구
    `&apiKey=${encodeURIComponent(apiKey || "")}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Referer: "http://localhost:3000", "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      apiKeyUsed: apiKey ? `${apiKey.slice(0, 6)}...` : "없음",
      encodedKey: encodeURIComponent(apiKey || ""),
      response: data,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
