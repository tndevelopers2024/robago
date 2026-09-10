// src/services/taggedEntity.service.ts
import type { Model } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

interface TaggedEntityInput {
    name?: string;
    description?: string;
    tagColor?: string;
}

/**
 * Warehouse, Supplier, and ProductionUnit expose byte-identical CRUD behavior
 * (robago-prd.md §5/§9.1) — this factory avoids writing the same five functions three
 * times. `dependencyChecks` is a list of "does anything else reference this row?"
 * queries to run before allowing a delete, matching the legacy app's blocked-delete
 * message for these three resources: *"Can't delete. Dependent data exists."*
 */
export function createTaggedEntityService<T extends TaggedEntityInput>(
    model: Model<T>,
    dependencyChecks: Array<(id: string) => Promise<boolean>>,
) {
    return {
        async list() {
            return model.find().sort({ name: 1 });
        },
        async create(input: T) {
            return model.create(input);
        },
        async update(id: string, input: Partial<T>) {
            const updated = await model.findByIdAndUpdate(id, input, {
                new: true,
                runValidators: true,
            });
            if (!updated) throw ApiError.notFound("Not found");
            return updated;
        },
        async remove(id: string) {
            for (const check of dependencyChecks) {
                if (await check(id)) {
                    throw ApiError.conflict("Can't delete. Dependent data exists.");
                }
            }
            const deleted = await model.findByIdAndDelete(id);
            if (!deleted) throw ApiError.notFound("Not found");
        },
    };
}
