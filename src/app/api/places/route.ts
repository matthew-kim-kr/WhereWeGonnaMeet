import { NextRequest, NextResponse } from "next/server";
import { Place } from "@/types";

async function fetchPlacesByType(lat: number, lng: number, type: string, apiKey: string): Promise<Place[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&type=${type}&key=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.results)) return [];
    return data.results.slice(0, 10).map((p: Record<string, unknown>) => ({
      name: p.name as string,
      vicinity: p.vicinity as string,
      rating: p.rating as number | undefined,
      types: (p.types as string[]) || [],
      photoRef: ((p.photos as Array<{ photo_reference: string }> | undefined)?.[0]?.photo_reference),
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ places: [] });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const [restaurants, cafes, attractions] = await Promise.all([
    fetchPlacesByType(lat, lng, "restaurant", apiKey),
    fetchPlacesByType(lat, lng, "cafe", apiKey),
    fetchPlacesByType(lat, lng, "tourist_attraction", apiKey),
  ]);

  const seen = new Set<string>();
  const places: Place[] = [];
  for (const p of [...restaurants, ...cafes, ...attractions]) {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      places.push(p);
    }
  }

  return NextResponse.json({ places: places.slice(0, 10) });
}
