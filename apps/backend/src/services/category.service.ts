// src/services/category.service.ts
import { Category } from "../models/Category.model.js";
import { Product } from "../models/Product.model.js";
import { ApiError } from "../utils/ApiError.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "@robago/shared";

export async function listCategories(filter: { type?: string } = {}) {
    return Category.find(filter.type ? { type: filter.type } : {}).sort({ title: 1 });
}

export async function createCategory(input: CreateCategoryInput) {
    return Category.create(input);
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
    const updated = await Category.findByIdAndUpdate(id, input, { new: true, runValidators: true });
    if (!updated) throw ApiError.notFound("Category not found");
    return updated;
}

export async function deleteCategory(id: string) {
    const hasProducts = await Product.exists({ categoryId: id });
    if (hasProducts) {
        throw ApiError.conflict("There are products in this category!");
    }
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) throw ApiError.notFound("Category not found");
}
