// src/hooks/queries/taggedEntityInstances.ts
import { warehouseApi, supplierApi, productionUnitApi } from "@/api/taggedEntityInstances";
import { queryKeys } from "@/lib/queryKeys";
import { createTaggedEntityQueries } from "./useTaggedEntityQueries";

export const warehouseQueries = createTaggedEntityQueries(
    queryKeys.warehouses.all(),
    warehouseApi,
    "warehouse",
);
export const supplierQueries = createTaggedEntityQueries(
    queryKeys.suppliers.all(),
    supplierApi,
    "supplier",
);
export const productionUnitQueries = createTaggedEntityQueries(
    queryKeys.productionUnits.all(),
    productionUnitApi,
    "production unit",
);
