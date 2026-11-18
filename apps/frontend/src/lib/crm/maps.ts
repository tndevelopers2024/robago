// src/lib/crm/maps.ts — links that open a school in Google Maps (no API key needed), on the phone's Maps app or in a browser.
import type { SchoolDTO } from "@robago/shared";

type Findable = Pick<SchoolDTO, "name" | "place" | "district" | "address" | "lat" | "lng">;

/**
 * What to look for. An exact pin wins; then a typed address; otherwise Google finds the school by its name and town,
 * which works for most well-known schools but can pick a wrong namesake — so pin or add the address for those.
 */
export function mapsQuery(s: Findable): string {
    if (s.lat !== null && s.lng !== null) return `${s.lat},${s.lng}`;
    const where = s.address.trim() || [s.place, s.district].filter((v, i, a) => v && a.indexOf(v) === i).join(", ");
    return [s.name, where, "Tamil Nadu"].filter(Boolean).join(", ");
}

/** The school's place card: address, photos, phone, with a Directions button of its own. */
export const mapsUrl = (s: Findable) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(s))}`;

/** Straight to turn-by-turn directions from wherever you are now. */
export const directionsUrl = (s: Findable) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(s))}&travelmode=driving`;

/** How the link was worked out — shown as the tooltip so nobody is surprised by a wrong namesake. */
export function mapsHint(s: Findable): string {
    if (s.lat !== null && s.lng !== null) return "Open the pinned spot in Google Maps";
    if (s.address.trim()) return "Open this address in Google Maps";
    return "Find this school in Google Maps (by name and town)";
}
