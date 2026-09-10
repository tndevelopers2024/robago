// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import transactionRoutes from "./transaction.routes.js";
import userRoutes from "./user.routes.js";
import { createTaggedEntityRouter } from "./taggedEntity.routes.js";
import {
    warehouseService,
    supplierService,
    productionUnitService,
} from "../services/taggedEntityInstances.service.js";
import {
    createWarehouseSchema,
    updateWarehouseSchema,
    createSupplierSchema,
    updateSupplierSchema,
    createProductionUnitSchema,
    updateProductionUnitSchema,
} from "@robago/shared";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/users", userRoutes);
router.use(
    "/warehouses",
    createTaggedEntityRouter(warehouseService, createWarehouseSchema, updateWarehouseSchema),
);
router.use(
    "/suppliers",
    createTaggedEntityRouter(supplierService, createSupplierSchema, updateSupplierSchema),
);
router.use(
    "/production-units",
    createTaggedEntityRouter(
        productionUnitService,
        createProductionUnitSchema,
        updateProductionUnitSchema,
    ),
);

export default router;
