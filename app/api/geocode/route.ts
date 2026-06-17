import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Geocode a free-text address via OpenStreetMap Nominatim (free, no key).
// Called once when a gym saves its address — not per search.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Missing address" }, { status: 400 });

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Grapplr/1.0 (open-mat directory; contact: support@grapplr.app)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });

    const data = (await res.json()) as Array<{
      lat: string; lon: string; display_name: string;
      address?: { country?: string; country_code?: string };
    }>;
    if (!data.length) return NextResponse.json({ error: "Address not found" }, { status: 404 });

    const hit = data[0];
    return NextResponse.json({
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      country: hit.address?.country ?? null,
      countryCode: hit.address?.country_code?.toUpperCase() ?? null,
      displayName: hit.display_name,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
