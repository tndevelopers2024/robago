// src/api/taggedEntityInstances.ts
import { createTaggedEntityApi } from "./taggedEntity";
import type {
    CreateWarehouseInput,
    UpdateWarehouseInput,
    CreateSupplierInput,
    UpdateSupplierInput,
    CreateProductionUnitInput,
    UpdateProductionUnitInput,
} from "@robago/shared";

export const warehouseApi = createTaggedEntityApi<CreateWarehouseInput, UpdateWarehouseInput>(
    "warehouses",
);
export const supplierApi = createTaggedEntityApi<CreateSupplierInput, UpdateSupplierInput>(
    "suppliers",
);
export const productionUnitApi = createTaggedEntityApi<
    CreateProductionUnitInput,
    UpdateProductionUnitInput
>("production-units");
