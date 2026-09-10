// src/services/product.service.ts
import { Product } from "../models/Product.model.js";
import { Inventory } from "../models/Inventory.model.js";
import { ApiError } from "../utils/ApiError.js";
import type { CreateProductInput, UpdateProductInput } from "@robago/shared";

export async function listProducts(filter: { categoryId?: string; type?: string; search?: string } = {}) {
    const query: Record<string, unknown> = {};
    if (filter.categoryId) query.categoryId = filter.categoryId;
    if (filter.type) query.type = filter.type;
    if (filter.search) query.$text = { $search: filter.search };
    return Product.find(query).sort({ name: 1 });
}

export async function createProduct(input: CreateProductInput) {
    return Product.create(input);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
    const updated = await Product.findByIdAndUpdate(id, input, { new: true, runValidators: true });
    if (!updated) throw ApiError.notFound("Product not found");
    return updated;
}

export async function deleteProduct(id: string) {
    const hasInventory = await Inventory.exists({ productId: id });
    if (hasInventory) {
        throw ApiError.conflict("Can't delete. Dependent data exists.");
    }
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) throw ApiError.notFound("Product not found");
}
