import type {
  User,
  Category,
  Product,
  Warehouse,
  Supplier,
  ProductionUnit,
  InventoryItem,
  StockTransaction,
  DashboardMetrics,
  ProductType,
  TransactionType,
} from "@/types";
import {
  initialUsers,
  initialWarehouses,
  initialProductionUnits,
  initialSuppliers,
  initialCategories,
  initialProducts,
  initialInventoryItems,
  initialTransactions,
} from "./mock-data";

// In-memory state
let users: User[] = [...initialUsers];
let warehouses: Warehouse[] = [...initialWarehouses];
let productionUnits: ProductionUnit[] = [...initialProductionUnits];
let suppliers: Supplier[] = [...initialSuppliers];
let categories: Category[] = [...initialCategories];
let products: Product[] = [...initialProducts];
const inventoryItems: InventoryItem[] = [...initialInventoryItems];
const transactions: StockTransaction[] = [...initialTransactions];

// Simulated active session (in-memory HttpOnly cookie emulation)
// Default to user usr-1 (Test Admin) on initial load for seamless development, or null
let currentSessionUser: User | null = users[0] || null;

// Helper to simulate network latency
const delay = (ms: number = 180) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper to populate inventory item relations
function populateItem(item: InventoryItem): InventoryItem {
  const product = products.find((p) => p.id === item.productId);
  const category = product
    ? categories.find((c) => c.id === product.categoryId)
    : undefined;
  const warehouse = warehouses.find((w) => w.id === item.warehouseId);
  const supplier = item.supplierId
    ? suppliers.find((s) => s.id === item.supplierId) || null
    : null;

  return {
    ...item,
    product,
    category,
    warehouse,
    supplier,
  };
}

// Helper to populate transaction relations
function populateTransaction(tx: StockTransaction): StockTransaction {
  const item = inventoryItems.find((i) => i.id === tx.inventoryId);
  const product = item ? products.find((p) => p.id === item.productId) : undefined;
  const unitId = tx.producedBy || tx.consumedBy;
  const prodUnit = unitId
    ? productionUnits.find((u) => u.id === unitId)
    : undefined;
  const creator = tx.createdBy
    ? users.find((u) => u.id === tx.createdBy)
    : undefined;

  return {
    ...tx,
    productName: product ? product.name : "Unknown Item",
    productUnit: product ? product.unit : "Piece",
    productionUnitName: prodUnit ? prodUnit.name : null,
    createdByName: creator ? creator.name : "System",
  };
}

export const mockService = {
  // ================= AUTHENTICATION =================
  async login(phoneNumber: string, passcode: string): Promise<User> {
    await delay();

    if (passcode !== "000000") {
      throw new Error("Invalid passcode. For demo access, use 000000");
    }

    const matchedUser = users.find((u) => u.phoneNumber === phoneNumber);
    if (!matchedUser) {
      throw new Error(
        "Phone number not registered. Please use demo phone 9500088697"
      );
    }

    currentSessionUser = matchedUser;
    return currentSessionUser;
  },

  async checkSession(): Promise<User | null> {
    await delay(100);
    return currentSessionUser;
  },

  async logout(): Promise<void> {
    await delay(80);
    currentSessionUser = null;
  },

  getCurrentUser(): User | null {
    return currentSessionUser;
  },

  // ================= DASHBOARD & METRICS =================
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await delay();

    const populated = inventoryItems.map(populateItem);

    const rawMaterials = populated.filter(
      (item) => item.product?.type === "RawMaterial"
    );
    const finishedProducts = populated.filter(
      (item) => item.product?.type === "FinishedProduct"
    );

    const rawMaterialsValue = rawMaterials.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const finishedProductsValue = finishedProducts.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const lowStockAlertCount = populated.filter(
      (item) => item.quantity <= item.alertThreshold
    ).length;

    return {
      rawMaterialsValue,
      finishedProductsValue,
      totalRawMaterialCount: rawMaterials.length,
      totalFinishedProductCount: finishedProducts.length,
      lowStockAlertCount,
    };
  },

  // ================= TRANSACTIONS =================
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    inventoryId?: string;
    type?: TransactionType;
  }): Promise<{ transactions: StockTransaction[]; total: number }> {
    await delay();

    let filtered = [...transactions];

    if (params?.inventoryId) {
      filtered = filtered.filter((t) => t.inventoryId === params.inventoryId);
    }

    if (params?.type) {
      filtered = filtered.filter((t) => t.transactionType === params.type);
    }

    // Sort newest first
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const total = filtered.length;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      transactions: paginated.map(populateTransaction),
      total,
    };
  },

  async createTransaction(payload: {
    inventoryId: string;
    transactionType: TransactionType;
    quantity: number;
    producedBy?: string | null;
    consumedBy?: string | null;
    notes?: string | null;
  }): Promise<{ transaction: StockTransaction; updatedItem: InventoryItem }> {
    await delay();

    const itemIndex = inventoryItems.findIndex(
      (i) => i.id === payload.inventoryId
    );
    if (itemIndex === -1) {
      throw new Error("Inventory record not found.");
    }

    const currentItem = inventoryItems[itemIndex];
    const qty = Number(payload.quantity);

    if (qty <= 0) {
      throw new Error("Transaction quantity must be greater than zero.");
    }

    // Strict Overdraft Protection Check
    if (
      (payload.transactionType === "Sale" ||
        payload.transactionType === "Consumption") &&
      currentItem.quantity < qty
    ) {
      throw new Error(
        `Overdraft Prevented: Cannot deduct ${qty} units. Current available stock balance is only ${currentItem.quantity}.`
      );
    }

    // Compute new balance
    let newQty = currentItem.quantity;
    switch (payload.transactionType) {
      case "Purchase":
      case "Production":
      case "KitAssembly":
        newQty += qty;
        break;
      case "Sale":
      case "Consumption":
        newQty -= qty;
        break;
      case "Adjustment":
        // Adjust quantity up or down
        newQty += qty;
        if (newQty < 0) {
          throw new Error(
            `Overdraft Prevented: Adjustment would result in negative stock balance (${newQty}).`
          );
        }
        break;
    }

    // Update inventory item
    const updatedItem: InventoryItem = {
      ...currentItem,
      quantity: Math.round(newQty * 100) / 100, // round to 2 decimals
      lastUpdated: new Date().toISOString(),
    };
    inventoryItems[itemIndex] = updatedItem;

    // Create transaction record
    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      inventoryId: payload.inventoryId,
      transactionType: payload.transactionType,
      quantity: qty,
      producedBy: payload.producedBy || null,
      consumedBy: payload.consumedBy || null,
      createdBy: currentSessionUser?.id || "usr-1",
      notes: payload.notes || null,
      timestamp: new Date().toISOString(),
    };

    transactions.unshift(newTx);

    return {
      transaction: populateTransaction(newTx),
      updatedItem: populateItem(updatedItem),
    };
  },

  // ================= INVENTORY =================
  async getInventory(params?: {
    type?: ProductType;
    search?: string;
    warehouseId?: string;
    categoryId?: string;
  }): Promise<InventoryItem[]> {
    await delay();

    let list = inventoryItems.map(populateItem);

    if (params?.type) {
      list = list.filter((item) => item.product?.type === params.type);
    }

    if (params?.warehouseId && params.warehouseId !== "all") {
      list = list.filter((item) => item.warehouseId === params.warehouseId);
    }

    if (params?.categoryId && params.categoryId !== "all") {
      list = list.filter((item) => item.product?.categoryId === params.categoryId);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (item) =>
          item.product?.name.toLowerCase().includes(q) ||
          item.product?.skuCode?.toLowerCase().includes(q) ||
          item.product?.colorVariant?.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
      );
    }

    // Sort by latest updated
    list.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

    return list;
  },

  async getInventoryById(id: string): Promise<InventoryItem | null> {
    await delay();
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return null;
    return populateItem(item);
  },

  async getInventoryAlerts(): Promise<InventoryItem[]> {
    await delay();
    const populated = inventoryItems.map(populateItem);
    return populated.filter((item) => item.quantity <= item.alertThreshold);
  },

  async createStock(
    payload: Omit<InventoryItem, "id" | "lastUpdated">
  ): Promise<InventoryItem> {
    await delay();

    const newItem: InventoryItem = {
      ...payload,
      id: `inv-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };

    inventoryItems.unshift(newItem);
    return populateItem(newItem);
  },

  async updateStock(
    id: string,
    payload: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    await delay();

    const idx = inventoryItems.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error("Inventory item not found");
    }

    const updated: InventoryItem = {
      ...inventoryItems[idx],
      ...payload,
      id, // ensure ID is preserved
      lastUpdated: new Date().toISOString(),
    };

    inventoryItems[idx] = updated;
    return populateItem(updated);
  },

  // ================= MASTER DATA: CATEGORIES =================
  async getCategories(type?: ProductType): Promise<Category[]> {
    await delay();
    if (type) {
      return categories.filter((c) => c.type === type);
    }
    return [...categories];
  },

  async createCategory(payload: Omit<Category, "id">): Promise<Category> {
    await delay();
    const newCat: Category = {
      ...payload,
      id: `cat-${Date.now()}`,
    };
    categories.push(newCat);
    return newCat;
  },

  async updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
    await delay();
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    categories[idx] = { ...categories[idx], ...payload, id };
    return categories[idx];
  },

  async deleteCategory(id: string): Promise<void> {
    await delay();
    const hasProducts = products.some((p) => p.categoryId === id);
    if (hasProducts) {
      throw new Error(
        "Cannot delete category: products are assigned to this category."
      );
    }
    categories = categories.filter((c) => c.id !== id);
  },

  // ================= MASTER DATA: PRODUCTS =================
  async getProducts(params?: {
    type?: ProductType;
    categoryId?: string;
  }): Promise<Product[]> {
    await delay();
    let list = [...products];
    if (params?.type) {
      list = list.filter((p) => p.type === params.type);
    }
    if (params?.categoryId) {
      list = list.filter((p) => p.categoryId === params.categoryId);
    }
    return list;
  },

  async createProduct(payload: Omit<Product, "id">): Promise<Product> {
    await delay();
    const newProd: Product = {
      ...payload,
      id: `prod-${Date.now()}`,
    };
    products.push(newProd);
    return newProd;
  },

  async updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
    await delay();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    products[idx] = { ...products[idx], ...payload, id };
    return products[idx];
  },

  async deleteProduct(id: string): Promise<void> {
    await delay();
    const hasStock = inventoryItems.some((i) => i.productId === id);
    if (hasStock) {
      throw new Error(
        "Cannot delete product: active inventory records exist for this product."
      );
    }
    products = products.filter((p) => p.id !== id);
  },

  // ================= MASTER DATA: WAREHOUSES =================
  async getWarehouses(): Promise<Warehouse[]> {
    await delay();
    return [...warehouses];
  },

  async createWarehouse(payload: Omit<Warehouse, "id">): Promise<Warehouse> {
    await delay();
    const newWh: Warehouse = {
      ...payload,
      id: `wh-${Date.now()}`,
    };
    warehouses.push(newWh);
    return newWh;
  },

  async updateWarehouse(
    id: string,
    payload: Partial<Warehouse>
  ): Promise<Warehouse> {
    await delay();
    const idx = warehouses.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error("Warehouse not found");
    warehouses[idx] = { ...warehouses[idx], ...payload, id };
    return warehouses[idx];
  },

  async deleteWarehouse(id: string): Promise<void> {
    await delay();
    const hasStock = inventoryItems.some((i) => i.warehouseId === id);
    if (hasStock) {
      throw new Error(
        "Cannot delete warehouse: inventory records are currently stored here."
      );
    }
    warehouses = warehouses.filter((w) => w.id !== id);
  },

  // ================= MASTER DATA: SUPPLIERS =================
  async getSuppliers(): Promise<Supplier[]> {
    await delay();
    return [...suppliers];
  },

  async createSupplier(payload: Omit<Supplier, "id">): Promise<Supplier> {
    await delay();
    const newSup: Supplier = {
      ...payload,
      id: `sup-${Date.now()}`,
    };
    suppliers.push(newSup);
    return newSup;
  },

  async updateSupplier(id: string, payload: Partial<Supplier>): Promise<Supplier> {
    await delay();
    const idx = suppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Supplier not found");
    suppliers[idx] = { ...suppliers[idx], ...payload, id };
    return suppliers[idx];
  },

  async deleteSupplier(id: string): Promise<void> {
    await delay();
    const hasStock = inventoryItems.some((i) => i.supplierId === id);
    if (hasStock) {
      throw new Error(
        "Cannot delete supplier: active inventory supplies linked to this vendor."
      );
    }
    suppliers = suppliers.filter((s) => s.id !== id);
  },

  // ================= MASTER DATA: PRODUCTION UNITS =================
  async getProductionUnits(): Promise<ProductionUnit[]> {
    await delay();
    return [...productionUnits];
  },

  async createProductionUnit(
    payload: Omit<ProductionUnit, "id">
  ): Promise<ProductionUnit> {
    await delay();
    const newPu: ProductionUnit = {
      ...payload,
      id: `pu-${Date.now()}`,
    };
    productionUnits.push(newPu);
    return newPu;
  },

  async updateProductionUnit(
    id: string,
    payload: Partial<ProductionUnit>
  ): Promise<ProductionUnit> {
    await delay();
    const idx = productionUnits.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("Production unit not found");
    productionUnits[idx] = { ...productionUnits[idx], ...payload, id };
    return productionUnits[idx];
  },

  async deleteProductionUnit(id: string): Promise<void> {
    await delay();
    const hasTransactions = transactions.some(
      (t) => t.producedBy === id || t.consumedBy === id
    );
    if (hasTransactions) {
      throw new Error(
        "Cannot delete unit: historical production/consumption records reference this unit."
      );
    }
    productionUnits = productionUnits.filter((u) => u.id !== id);
  },

  // ================= MASTER DATA: USERS =================
  async getUsers(): Promise<User[]> {
    await delay();
    return [...users];
  },

  async createUser(payload: Omit<User, "id">): Promise<User> {
    await delay();
    const existing = users.find((u) => u.phoneNumber === payload.phoneNumber);
    if (existing) {
      throw new Error("A user with this phone number already exists.");
    }
    const newUser: User = {
      ...payload,
      id: `usr-${Date.now()}`,
    };
    users.push(newUser);
    return newUser;
  },

  async updateUser(id: string, payload: Partial<User>): Promise<User> {
    await delay();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx] = { ...users[idx], ...payload, id };
    return users[idx];
  },

  async deleteUser(id: string): Promise<void> {
    await delay();
    if (currentSessionUser?.id === id) {
      throw new Error("Cannot delete currently logged in user.");
    }
    users = users.filter((u) => u.id !== id);
  },
};
