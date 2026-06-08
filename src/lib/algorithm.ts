import { Station, SearchResult } from "@/types";
import { STATIONS } from "@/data/stations";

export async function findBestStations(departures: Station[]): Promise<SearchResult[]> {
  const candidates = STATIONS;

  // Build all pairs: each departure → each candidate
  const pairs: { fromLat: number; fromLng: number; toLat: number; toLng: number }[] = [];
  for (const candidate of candidates) {
    for (const dep of departures) {
      pairs.push({
        fromLat: dep.lat,
        fromLng: dep.lng,
        toLat: candidate.lat,
        toLng: candidate.lng,
      });
    }
  }

  // Fetch all travel times in one API call
  const res = await fetch("/api/travel-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairs }),
  });

  const data = await res.json();
  const times: number[] = data.times;

  // Calculate average per candidate
  const results: SearchResult[] = candidates.map((candidate, ci) => {
    const individualMinutes = departures.map((_, di) => times[ci * departures.length + di]);
    const valid = individualMinutes.filter((t) => t < 9999);
    const avgMinutes = valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 9999;
    return { station: candidate, avgMinutes, individualMinutes };
  });

  // Filter out unreachable and sort
  const reachable = results.filter((r) => r.avgMinutes < 9999);
  reachable.sort((a, b) => a.avgMinutes - b.avgMinutes);

  return reachable.slice(0, 3);
}
