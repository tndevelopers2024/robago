// src/tnGeo.ts — where Tamil Nadu's districts and towns are, so schools can be put on a map and distances worked out.
//
// These are APPROXIMATE positions (the district headquarters and the main towns), not school addresses. A school sits at
// its town's position unless someone pins its exact spot. Distances are straight-line × 1.3 as a rough "by road" figure.

export interface LatLng {
    lat: number;
    lng: number;
}
const p = (lat: number, lng: number): LatLng => ({ lat, lng });

/** District headquarters. A district's schools without a known town are placed here. */
export const TN_DISTRICTS: Record<string, LatLng> = {
    Ariyalur: p(11.14, 79.08), Chengalpattu: p(12.69, 79.98), Chennai: p(13.08, 80.27), Coimbatore: p(11.0, 76.96),
    Cuddalore: p(11.75, 79.77), Dharmapuri: p(12.13, 78.16), Dindigul: p(10.36, 77.98), Erode: p(11.34, 77.72),
    Kallakurichi: p(11.74, 78.96), Kancheepuram: p(12.83, 79.7), Kanyakumari: p(8.18, 77.43), Karur: p(10.96, 78.08),
    Krishnagiri: p(12.52, 78.21), Madurai: p(9.92, 78.12), Mayiladuthurai: p(11.1, 79.65), Nagapattinam: p(10.77, 79.84),
    Namakkal: p(11.22, 78.17), Nilgiris: p(11.41, 76.7), Perambalur: p(11.23, 78.88), Pudukkottai: p(10.38, 78.82),
    Ramanathapuram: p(9.37, 78.83), Ranipet: p(12.93, 79.33), Salem: p(11.66, 78.15), Sivaganga: p(9.85, 78.48),
    Tenkasi: p(8.96, 77.31), Thanjavur: p(10.79, 79.14), Theni: p(10.01, 77.48), Thoothukudi: p(8.76, 78.13),
    Tiruchirappalli: p(10.8, 78.69), Tirunelveli: p(8.73, 77.7), Tirupathur: p(12.5, 78.57), Tiruppur: p(11.11, 77.34),
    Tiruvallur: p(13.14, 79.91), Tiruvannamalai: p(12.23, 79.07), Tiruvarur: p(10.77, 79.64), Vellore: p(12.92, 79.13),
    Villupuram: p(11.94, 79.49), Virudhunagar: p(9.59, 77.96),
};

/** Main towns, keyed by lower-case name. */
const TOWNS: Record<string, LatLng> = {
    dharmapuri: p(12.127, 78.158), harur: p(12.05, 78.48), ariyalur: p(11.14, 79.08), jayankondam: p(11.21, 79.36),
    thanjavur: p(10.787, 79.139), mannargudi: p(10.66, 79.45), pattukkottai: p(10.42, 79.32), kumbakonam: p(10.96, 79.38),
    tiruchirappalli: p(10.805, 78.686), thuraiyur: p(11.14, 78.6), perambalur: p(11.234, 78.88),
    nagapattinam: p(10.766, 79.842), vedaranyam: p(10.37, 79.85), mayiladuthurai: p(11.1, 79.65),
    vridhachalam: p(11.52, 79.33), srimushnam: p(11.4, 79.41), chidambaram: p(11.4, 79.69), neyveli: p(11.6, 79.48),
    cuddalore: p(11.75, 79.76), villupuram: p(11.94, 79.49), tindivanam: p(12.24, 79.65), gingee: p(12.25, 79.42),
    salem: p(11.665, 78.146), attur: p(11.6, 78.6), edappadi: p(11.585, 77.84), namakkal: p(11.22, 78.167),
    tiruchengode: p(11.38, 77.89), rasipuram: p(11.46, 78.18), kallakurichi: p(11.74, 78.96),
    hosur: p(12.74, 77.83), krishnagiri: p(12.52, 78.21), thally: p(12.54, 77.95), bargur: p(12.54, 78.36),
    arani: p(12.67, 79.28), cheyyar: p(12.66, 79.54), tiruvannamalai: p(12.23, 79.07),
    katpadi: p(12.97, 79.14), vellore: p(12.92, 79.13), ambur: p(12.79, 78.72),
    perundurai: p(11.28, 77.58), gobichettipalayam: p(11.45, 77.44), erode: p(11.34, 77.72), karur: p(10.96, 78.08),
    aranthangi: p(10.17, 78.99), pudukkottai: p(10.38, 78.82), thiruthuraipoondi: p(10.53, 79.64), tiruvarur: p(10.77, 79.64),
    palani: p(10.45, 77.52), oddanchatram: p(10.48, 77.75), dindigul: p(10.37, 77.98),
};
const ALIASES: Record<string, string> = { trichy: "tiruchirappalli", tiruchi: "tiruchirappalli", thanjavore: "thanjavur", chithamparam: "chidambaram", nagapatinam: "nagapattinam", kallakurchi: "kallakurichi", villupuram: "villupuram", kancheepuram: "kancheepuram" };

export type GeoLevel = "pin" | "town" | "district";
export interface Located extends LatLng {
    level: GeoLevel;
}

/** "Villupuram (31 km)" → "villupuram", "Trichy" → "tiruchirappalli". */
export function normPlace(s: string): string {
    const base = s.replace(/\(.*?\)/g, "").trim().toLowerCase().replace(/\s+/g, " ");
    return ALIASES[base] ?? base;
}

/** Best known position of a school: its pin, else its town, else its district. null if nothing is known. */
export function locate(s: { lat?: number | null; lng?: number | null; place: string; district: string }): Located | null {
    if (typeof s.lat === "number" && typeof s.lng === "number") return { lat: s.lat, lng: s.lng, level: "pin" };
    const town = TOWNS[normPlace(s.place)];
    if (town) return { ...town, level: "town" };
    const dist = TN_DISTRICTS[s.district] ?? TN_DISTRICTS[Object.keys(TN_DISTRICTS).find((d) => d.toLowerCase() === s.district.trim().toLowerCase()) ?? ""];
    return dist ? { ...dist, level: "district" } : null;
}

/** Straight-line distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
    const rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
}
/** Roads wind: straight-line distance × 1.3 is a fair estimate of the drive. Rounded to whole km. */
export const ROAD_FACTOR = 1.3;
export const roadKm = (a: LatLng, b: LatLng): number => Math.round(haversineKm(a, b) * ROAD_FACTOR);

/** Districts closest to `from` (by their headquarters), nearest first, within `maxKm` by road. */
export function nearbyDistricts(from: string, limit = 5, maxKm = 140): { name: string; km: number }[] {
    const origin = TN_DISTRICTS[from];
    if (!origin) return [];
    return Object.entries(TN_DISTRICTS)
        .filter(([name]) => name !== from)
        .map(([name, c]) => ({ name, km: roadKm(origin, c) }))
        .filter((d) => d.km <= maxKm)
        .sort((a, b) => a.km - b.km)
        .slice(0, limit);
}
