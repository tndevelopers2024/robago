// src/services/inventory.service.ts
import { Inventory } from "../models/Inventory.model.js";
import { Product } from "../models/Product.model.js";
import { Transaction } from "../models/Transaction.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ProductType, validateInventoryBusinessRules } from "@robago/shared";
import type { CreateInventoryInput, UpdateInventoryInput } from "@robago/shared";

export async function listInventory(filter: {
    search?: string;
    warehouseId?: string;
    type?: string;
} = {}) {
    const query: Record<string, unknown> = {};
    if (filter.warehouseId) query.warehouseId = filter.warehouseId;

    // `type` filters on the *product's* type, so resolve matching product ids first.
    let productIds: string[] | undefined;
    if (filter.type || filter.search) {
        const productQuery: Record<string, unknown> = {};
        if (filter.type) productQuery.type = filter.type;
        if (filter.search) productQuery.name = { $regex: filter.search, $options: "i" };
        const products = await Product.find(productQuery).select("_id");
        productIds = products.map((p) => String(p._id));
        query.productId = { $in: productIds };
    }

    return Inventory.find(query).populate("productId").sort({ productId: 1 });
}

export async function getInventoryById(id: string) {
    const inventory = await Inventory.findById(id).populate("productId");
    if (!inventory) throw ApiError.notFound("Inventory item not found");
    const transactions = await Transaction.find({ inventoryId: id })
        .sort({ timestamp: -1 })
        .populate("producedBy consumedBy");
    return { inventory, transactions };
}

export async function getAlerts() {
    const lowStock = await Inventory.find({
        alertThreshold: { $ne: null },
        $expr: { $lt: ["$quantity", "$alertThreshold"] },
    })
        .populate("productId")
        .sort({ quantity: 1 });

    const rawMaterials = lowStock.filter(
        (i) => (i.productId as unknown as { type?: string })?.type === ProductType.RawMaterial,
    );
    const finishedProducts = lowStock.filter(
        (i) => (i.productId as unknown as { type?: string })?.type === ProductType.FinishedProduct,
    );
    return { rawMaterials, finishedProducts };
}

export async function createInventory(input: CreateInventoryInput) {
    const product = await Product.findById(input.productId);
    if (!product) throw ApiError.badRequest("Select a product", { productId: "Select a product" });

    const ruleErrors = validateInventoryBusinessRules(input, product.type as ProductType);
    if (ruleErrors.length > 0) {
        const fieldErrors = Object.fromEntries(ruleErrors.map((e) => [e.field, e.message]));
        throw ApiError.badRequest("Validation failed", fieldErrors);
    }

    // Finished products never carry an alert threshold, matching the legacy app's
    // behavior (robago-prd.md §4.2 / the alertThreshold discrepancy noted in §5).
    const alertThreshold =
        product.type === ProductType.RawMaterial ? (input.alertThreshold ?? null) : null;

    return Inventory.create({ ...input, alertThreshold });
}

export async function updateInventory(id: string, input: UpdateInventoryInput) {
    const existing = await Inventory.findById(id);
    if (!existing) throw ApiError.notFound("Inventory item not found");

    const productId = input.productId ?? String(existing.productId);
    const product = await Product.findById(productId);
    if (!product) throw ApiError.badRequest("Select a product", { productId: "Select a product" });

    const merged = { ...existing.toObject(), ...input };
    const ruleErrors = validateInventoryBusinessRules(
        {
            supplierId: merged.supplierId ? String(merged.supplierId) : undefined,
            alertThreshold: merged.alertThreshold ?? undefined,
        },
        product.type as ProductType,
    );
    if (ruleErrors.length > 0) {
        const fieldErrors = Object.fromEntries(ruleErrors.map((e) => [e.field, e.message]));
        throw ApiError.badRequest("Validation failed", fieldErrors);
    }

    const alertThreshold =
        product.type === ProductType.RawMaterial ? (merged.alertThreshold ?? null) : null;

    const updated = await Inventory.findByIdAndUpdate(
        id,
        { ...input, alertThreshold },
        { new: true, runValidators: true },
    );
    if (!updated) throw ApiError.notFound("Inventory item not found");
    return updated;
}

export async function setInventoryImage(id: string, imgUrl: string) {
    const updated = await Inventory.findByIdAndUpdate(id, { imgUrl }, { new: true });
    if (!updated) throw ApiError.notFound("Inventory item not found");
    return updated;
}
