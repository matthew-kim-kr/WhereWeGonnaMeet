import { Station, SearchResult } from "@/types";
import { STATIONS } from "@/data/stations";

// 후보역: 주요 환승역 및 인기 역만 추려서 API 요청 수 최소화
const CANDIDATE_IDS = [
  // 2호선
  "2-hongdae", "2-sinchon", "2-hapjeong", "2-dangsan", "2-sindorim",
  "2-gangnam", "2-yeoksam", "2-seolleung", "2-samsung", "2-jamsil",
  "2-konkuk", "2-wangsimni", "2-seongsu", "2-sadang",
  // 1·4호선
  "1-seoul", "3-jongno3",
  // 3호선
  "3-gyeongbokgung", "3-sinsa", "3-yangjae",
  // 5호선
  "5-yeouido", "5-mapo", "5-gongdeok", "5-gwanghwamun",
  // 6호선
  "6-itaewon",
  // 7호선
  "7-isu", "7-nonhyeon", "7-hakdong",
  // 9호선
  "9-noryangjin", "4-dongjak", "9-sinnonhyeon",
  // 신분당선
  "sin-pangyo",
];

export async function findBestStations(
  departures: Station[],
  personNames?: string[]
): Promise<SearchResult[]> {
  // 후보역 필터링 (없으면 전체 STATIONS 중 환승역 우선 상위 40개)
  let candidates = STATIONS.filter((s) => CANDIDATE_IDS.includes(s.id));
  if (candidates.length < 10) {
    // fallback: 환승역(lines 2개 이상)만
    candidates = STATIONS.filter((s) => s.lines.length >= 2).slice(0, 40);
  }

  // 출발지와 동일한 역은 후보에서 제외
  const departureIds = new Set(departures.map((d) => d.id));
  candidates = candidates.filter((c) => !departureIds.has(c.id));

  // 페어 빌드: (후보 × 출발지)
  const pairs = candidates.flatMap((candidate) =>
    departures.map((dep) => ({
      fromLat: dep.lat,
      fromLng: dep.lng,
      toLat: candidate.lat,
      toLng: candidate.lng,
    }))
  );

  console.log(`[algorithm] 후보역 수: ${candidates.length}, 출발역 수: ${departures.length}, 페어 수: ${pairs.length}`);
  console.log(`[algorithm] 첫 번째 페어:`, JSON.stringify(pairs[0]));

  const res = await fetch("/api/travel-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairs }),
  });

  console.log(`[algorithm] /api/travel-time 응답 status: ${res.status}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[algorithm] API 에러 body: ${body}`);
    throw new Error("travel-time API error");
  }
  const data = await res.json();
  const times: number[] = data.times;

  const validCount = times.filter((t) => t < 9999).length;
  console.log(`[algorithm] 받은 times 수: ${times.length}, 유효(< 9999): ${validCount}`);
  if (validCount === 0 && times.length > 0) {
    console.warn(`[algorithm] 첫 5개 time 값:`, times.slice(0, 5));
  }

  const n = departures.length;
  const results: SearchResult[] = candidates.map((candidate, ci) => {
    const individualMinutes = departures.map((_, di) => times[ci * n + di]);
    const valid = individualMinutes.filter((t) => t < 9999);
    const avgMinutes =
      valid.length > 0
        ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
        : 9999;
    return {
      station: candidate,
      avgMinutes,
      individualMinutes,
      personNames,
      departures,
    };
  });

  const reachable = results.filter((r) => r.avgMinutes < 9999);
  reachable.sort((a, b) => a.avgMinutes - b.avgMinutes);
  console.log(`[algorithm] 도달 가능 역 수: ${reachable.length}`);
  return reachable.slice(0, 3);
}
