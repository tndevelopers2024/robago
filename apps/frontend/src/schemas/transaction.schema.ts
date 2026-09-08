import { z } from "zod";

export const createTransactionSchema = z
  .object({
    inventoryId: z.string().optional(),
    transactionType: z.enum([
      "Purchase",
      "Sale",
      "Production",
      "Consumption",
      "Adjustment",
    ]),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    unitId: z.string().optional().nullable(),
    producedBy: z.string().optional().nullable(),
    consumedBy: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.transactionType === "Production" && !data.producedBy && !data.unitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unitId"],
        message: "Please select which production unit produced this stock",
      });
    }

    if (data.transactionType === "Consumption" && !data.consumedBy && !data.unitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unitId"],
        message: "Please select which production unit consumed this material",
      });
    }
  });

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
