// src/services/taggedEntityInstances.service.ts
import { Warehouse, Supplier, ProductionUnit } from "../models/taggedEntity.model.js";
import { Inventory } from "../models/Inventory.model.js";
import { Transaction } from "../models/Transaction.model.js";
import { createTaggedEntityService } from "./taggedEntity.service.js";

export const warehouseService = createTaggedEntityService(Warehouse, [
    (id) => Inventory.exists({ warehouseId: id }).then(Boolean),
]);

export const supplierService = createTaggedEntityService(Supplier, [
    (id) => Inventory.exists({ supplierId: id }).then(Boolean),
]);

export const productionUnitService = createTaggedEntityService(ProductionUnit, [
    (id) => Transaction.exists({ producedBy: id }).then(Boolean),
    (id) => Transaction.exists({ consumedBy: id }).then(Boolean),
]);
