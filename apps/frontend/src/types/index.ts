// src/types/index.ts
import type { ProductType, TagColor, TransactionType, Unit, UserRole } from "@robago/shared";

// Mongo documents come back over the wire with string _ids and populated refs where
// the backend calls .populate() — these are the frontend's read-side view models,
// distinct from the @robago/shared *write*-side Zod input types (Create/Update*Input).

export interface CategoryDTO {
    _id: string;
    title: string;
    description: string;
    tagColor: TagColor;
    type: ProductType;
}

export interface ProductDTO {
    _id: string;
    name: string;
    description: string | null;
    categoryId: string | CategoryDTO;
    unit: Unit;
    type: ProductType;
}

export interface TaggedEntityDTO {
    _id: string;
    name: string;
    description: string;
    tagColor: TagColor;
}

export interface InventoryDTO {
    _id: string;
    productId: ProductDTO; // populated by the backend on list/detail
    warehouseId: string | TaggedEntityDTO;
    supplierId: string | null;
    location: string;
    price: number;
    quantity: number;
    alertThreshold: number | null;
    imgUrl: string | null;
    lastUpdated: string;
}

export interface TransactionDTO {
    _id: string;
    inventoryId:
        | string
        | {
              _id: string;
              productId?: ProductDTO;
              warehouseId?: TaggedEntityDTO | string;
              location?: string;
              price?: number;
              quantity?: number;
          };
    transactionType: TransactionType;
    quantity: number;
    producedBy: TaggedEntityDTO | null;
    consumedBy: TaggedEntityDTO | null;
    createdBy: string | null;
    notes: string | null;
    timestamp: string;
}

export interface UserDTO {
    _id: string;
    phoneNumber: string;
    name: string;
    role: UserRole;
}

export interface InventoryAlertsResponse {
    rawMaterials: InventoryDTO[];
    finishedProducts: InventoryDTO[];
}

export interface InventoryDetailResponse {
    inventory: InventoryDTO;
    transactions: TransactionDTO[];
}
