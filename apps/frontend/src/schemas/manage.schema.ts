import { z } from "zod";

export const PRESET_TAG_COLORS = [
  "#C1A3C3", // Lavendar
  "#FFCBA4", // Peach
  "#A0C4FF", // Sky
  "#FFB6A1", // Coral
  "#D1E6B1", // Green
  "#FFC0CB", // Pink
  "#FFD580", // Yellow
  "#99D6D0", // Teal
] as const;

export const categorySchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().default(""),
  tagColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Invalid color hex format"),
  type: z.enum(["RawMaterial", "FinishedProduct"]),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters"),
  skuCode: z.string().trim().optional().nullable(),
  colorVariant: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  categoryId: z.string().min(1, "Please select a category"),
  unit: z.enum(["Roll", "Piece", "Packet", "Metre"]),
  type: z.enum(["RawMaterial", "FinishedProduct"]),
});
export type ProductInput = z.infer<typeof productSchema>;

export const warehouseSchema = z.object({
  name: z.string().trim().min(2, "Warehouse name must be at least 2 characters"),
  description: z.string().trim().default(""),
  tagColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Invalid color hex format"),
});
export type WarehouseInput = z.infer<typeof warehouseSchema>;

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Supplier name must be at least 2 characters"),
  description: z.string().trim().default(""),
  tagColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Invalid color hex format"),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

export const productionUnitSchema = z.object({
  name: z.string().trim().min(2, "Unit name must be at least 2 characters"),
  description: z.string().trim().default(""),
  tagColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Invalid color hex format"),
});
export type ProductionUnitInput = z.infer<typeof productionUnitSchema>;

export const userSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  role: z.enum(["admin", "user"]),
  passcode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Passcode must be exactly 6 digits"),
});
export type UserInput = z.infer<typeof userSchema>;

// Aliases for component imports
export const createCategorySchema = categorySchema;
export type CreateCategoryInput = CategoryInput;

export const createProductSchema = productSchema;
export type CreateProductInput = ProductInput;

export const createWarehouseSchema = warehouseSchema;
export type CreateWarehouseInput = WarehouseInput;

export const createSupplierSchema = supplierSchema;
export type CreateSupplierInput = SupplierInput;

export const createProductionUnitSchema = productionUnitSchema;
export type CreateProductionUnitInput = ProductionUnitInput;

export const createUserSchema = userSchema;
export type CreateUserInput = UserInput;
