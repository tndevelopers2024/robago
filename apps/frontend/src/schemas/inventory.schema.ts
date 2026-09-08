import { z } from "zod";

export const createStockSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  warehouseId: z.string().min(1, "Please select a warehouse"),
  supplierId: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be at least ₹0"),
  quantity: z.coerce.number().min(0, "Quantity must be at least 0"),
  alertThreshold: z.coerce.number().min(0, "Alert threshold must be at least 0"),
  location: z.string().trim().min(1, "Please specify a location within the warehouse"),
});

export type CreateStockInput = z.infer<typeof createStockSchema>;

export const editStockSchema = z.object({
  price: z.coerce.number().min(0, "Price must be at least ₹0"),
  alertThreshold: z.coerce.number().min(0, "Alert threshold must be at least 0"),
  location: z.string().trim().min(1, "Please specify a location within the warehouse"),
  warehouseId: z.string().min(1, "Please select a warehouse"),
  supplierId: z.string().optional().nullable(),
});

export type EditStockInput = z.infer<typeof editStockSchema>;
