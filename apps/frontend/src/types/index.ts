export type UserRole = "admin" | "user";

export interface User {
  id: string;
  phoneNumber: string; // 10 digits
  name: string;
  role: UserRole;
  fcmToken?: string | null;
}

export type ProductType = "RawMaterial" | "FinishedProduct";

export interface Category {
  id: string;
  title: string;
  description: string;
  tagColor: string; // 8 pastel presets
  type: ProductType;
}

export type UnitType = "Roll" | "Piece" | "Packet" | "Metre";

export interface Product {
  id: string;
  name: string;
  skuCode?: string | null;
  colorVariant?: string | null;
  description?: string | null;
  categoryId: string;
  unit: UnitType;
  type: ProductType;
  isManufactured?: boolean;
  isKit?: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  description: string;
  tagColor: string;
}

export interface Supplier {
  id: string;
  name: string;
  description: string;
  tagColor: string;
}

export interface ProductionUnit {
  id: string;
  name: string;
  description: string;
  tagColor: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  supplierId?: string | null;
  price: number;
  quantity: number; // Supports decimal meters/quantities
  alertThreshold: number;
  location: string;
  imgUrl?: string | null;
  lastUpdated: string;
  // Populated fields for UI convenience
  product?: Product;
  category?: Category;
  warehouse?: Warehouse;
  supplier?: Supplier | null;
}

export type TransactionType =
  | "Purchase"
  | "Sale"
  | "Production"
  | "Consumption"
  | "Adjustment"
  | "KitAssembly";

export interface StockTransaction {
  id: string;
  inventoryId: string;
  transactionType: TransactionType;
  quantity: number;
  producedBy?: string | null;
  consumedBy?: string | null;
  createdBy?: string | null;
  notes?: string | null;
  timestamp: string;
  // Populated relations
  productName?: string;
  productUnit?: UnitType;
  productionUnitName?: string | null;
  createdByName?: string | null;
}

export interface DashboardMetrics {
  rawMaterialsValue: number;
  finishedProductsValue: number;
  totalRawMaterialCount: number;
  totalFinishedProductCount: number;
  lowStockAlertCount: number;
}
