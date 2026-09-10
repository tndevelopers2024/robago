// src/enums.ts
//
// NOTE: these are plain `as const` object unions, not TypeScript `enum` declarations.
// regraft's tsconfig.app.json (mirrored in ../../tsconfig.base.json) sets
// `erasableSyntaxOnly: true`, which forbids `enum` because it emits a runtime object
// the TS compiler can't simply erase. The const-object + derived-union-type pattern
// below is the erasable equivalent — value union for runtime checks (`UserRole.Admin`),
// type union for type positions (`UserRole` as a type).

export const UserRole = {
    Admin: "admin",
    User: "user",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProductType = {
    RawMaterial: "RawMaterial",
    FinishedProduct: "FinishedProduct",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const Unit = {
    Roll: "Roll",
    Piece: "Piece",
    Packet: "Packet",
    Metre: "Metre",
} as const;
export type Unit = (typeof Unit)[keyof typeof Unit];

export const TransactionType = {
    Purchase: "Purchase",
    Sale: "Sale",
    Production: "Production",
    Consumption: "Consumption",
    Adjustment: "Adjustment",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

// The 8 fixed tag colors used across Category / Warehouse / Supplier / ProductionUnit,
// reverse-engineered from the legacy app's Drizzle schema (robago-prd.md §5).
export const TagColor = {
    Lavendar: "#C1A3C3",
    Peach: "#FFCBA4",
    Sky: "#A0C4FF",
    Coral: "#FFB6A1",
    Green: "#D1E6B1",
    Pink: "#FFC0CB",
    Yellow: "#FFD580",
    Teal: "#99D6D0",
} as const;
export type TagColor = (typeof TagColor)[keyof typeof TagColor];

/** Ordered list for rendering color-swatch pickers, so UI order is deterministic. */
export const TAG_COLOR_OPTIONS: ReadonlyArray<{ label: string; value: TagColor }> = [
    { label: "Lavendar", value: TagColor.Lavendar },
    { label: "Peach", value: TagColor.Peach },
    { label: "Sky", value: TagColor.Sky },
    { label: "Coral", value: TagColor.Coral },
    { label: "Green", value: TagColor.Green },
    { label: "Pink", value: TagColor.Pink },
    { label: "Yellow", value: TagColor.Yellow },
    { label: "Teal", value: TagColor.Teal },
];
