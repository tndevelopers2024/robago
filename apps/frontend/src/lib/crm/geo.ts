// src/lib/crm/geo.ts — where each school sits on the map, and how far apart they are.
import { locate, roadKm, type Located, type SchoolDTO } from "@robago/shared";

/** A school's position, plus the slightly spread-out position used to DRAW it (schools in one town would overlap). */
export interface Placed extends Located {
    drawLat: number;
    drawLng: number;
}

/** Position every school. Schools sharing a spot are fanned out in a small spiral so each one can be clicked. */
export function placeAll(schools: SchoolDTO[]): Map<string, Placed> {
    const groups = new Map<string, { s: SchoolDTO; at: Located }[]>();
    for (const s of schools) {
        const at = locate(s);
        if (!at) continue;
        const key = `${at.lat.toFixed(3)},${at.lng.toFixed(3)}`;
        (groups.get(key) ?? groups.set(key, []).get(key)!).push({ s, at });
    }
    const out = new Map<string, Placed>();
    for (const list of groups.values()) {
        list.sort((a, b) => a.s.id.localeCompare(b.s.id));
        list.forEach(({ s, at }, i) => {
            const r = list.length === 1 ? 0 : 0.0035 * Math.sqrt(i + 0.5);
            const angle = i * 2.399963; // golden angle: an even spiral
            out.set(s.id, {
                ...at,
                drawLat: at.lat + r * Math.sin(angle),
                drawLng: at.lng + (r * Math.cos(angle)) / Math.cos((at.lat * Math.PI) / 180),
            });
        });
    }
    return out;
}

/** Estimated km by road between two schools, or null when either has no known position. */
export function kmBetween(placed: Map<string, Placed>, a: string, b: string): number | null {
    const pa = placed.get(a);
    const pb = placed.get(b);
    return pa && pb ? roadKm(pa, pb) : null;
}

export const kmText = (km: number | null | undefined) =>
    km === null || km === undefined ? "" : km < 1 ? "< 1 km" : `${km} km`;
