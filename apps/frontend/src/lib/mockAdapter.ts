// src/lib/mockAdapter.ts
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { ProductType, Unit, TransactionType, type TagColor } from "@robago/shared";
import type {
    InventoryDTO,
    TransactionDTO,
    CategoryDTO,
    ProductDTO,
    TaggedEntityDTO,
    UserDTO,
} from "@/types";
import {
    MOCK_ADMIN_USER,
    getStoredInventory,
    saveStoredInventory,
    getStoredTransactions,
    saveStoredTransactions,
    getStoredCategories,
    saveStoredCategories,
    getStoredWarehouses,
    saveStoredWarehouses,
    getStoredProductionUnits,
    saveStoredProductionUnits,
    getStoredSuppliers,
    saveStoredSuppliers,
    getStoredProducts,
    saveStoredProducts,
    getStoredUsers,
    saveStoredUsers,
    isDemoAuthenticated,
    setDemoAuthenticated,
} from "./mockData";
import { handleStaffMock } from "./staff/mockStaff";
import { handleExpenseMock } from "./expenses/mockExpenses";
import { handleAccountsMock } from "./accounts/mockAccounts";

/** Demo mode that can't be switched off from the UI (env flag, or the hosted Vercel demo). */
export function isDemoForced(): boolean {
    if (typeof window === "undefined") return false;
    return import.meta.env.VITE_DEMO_MODE === "true" || window.location.hostname.includes("vercel.app");
}

export function isDemoModeActive(): boolean {
    if (typeof window === "undefined") return false;
    if (isDemoForced()) return true;
    return localStorage.getItem("robago_demo_mode") === "true";
}

export function setDemoModeActive(enabled: boolean): void {
    if (typeof window === "undefined") return;
    if (enabled) {
        localStorage.setItem("robago_demo_mode", "true");
    } else {
        localStorage.removeItem("robago_demo_mode");
    }
}

function createSuccessResponse<T>(data: T, config: InternalAxiosRequestConfig): AxiosResponse<T> {
    return {
        data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
    };
}

function createErrorResponse(status: number, message: string, config: InternalAxiosRequestConfig) {
    const error = new Error(message) as Error & {
        response?: AxiosResponse;
        config?: InternalAxiosRequestConfig;
        isAxiosError?: boolean;
    };
    error.isAxiosError = true;
    error.config = config;
    error.response = {
        data: { message, error: message },
        status,
        statusText: status === 401 ? "Unauthorized" : status === 404 ? "Not Found" : "Bad Request",
        headers: {},
        config,
        request: {},
    };
    return Promise.reject(error);
}

function parseData(config: InternalAxiosRequestConfig): Record<string, unknown> {
    if (!config.data) return {};
    if (typeof config.data === "string") {
        try {
            return JSON.parse(config.data);
        } catch {
            return {};
        }
    }
    return config.data as Record<string, unknown>;
}

export async function mockAxiosAdapter(
    config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
    const method = (config.method || "get").toUpperCase();
    const rawUrl = config.url || "";
    const [pathOnly = ""] = rawUrl.split("?");

    // Normalize path by stripping base URLs and prefixes
    let path = pathOnly
        .replace(/^https?:\/\/[^/]+/, "")
        .replace(/^\/api\/v1/, "")
        .replace(/^\/api/, "");

    // Allow /manage prefix aliases (e.g. /manage/categories -> /categories)
    path = path.replace(/^\/manage\//, "/");

    const params = (config.params || {}) as Record<string, string | undefined>;
    const body = parseData(config);

    // -------------------------------------------------------------
    // 1. Auth Handlers
    // -------------------------------------------------------------
    if (path === "/auth/login" && method === "POST") {
        setDemoAuthenticated(true);
        return createSuccessResponse(
            {
                accessToken: "demo-jwt-token",
                user: MOCK_ADMIN_USER,
            },
            config,
        );
    }

    if (path === "/auth/refresh" && method === "POST") {
        if (isDemoAuthenticated()) {
            return createSuccessResponse({ accessToken: "demo-jwt-token" }, config);
        }
        return createErrorResponse(401, "Unauthorized in demo mode", config);
    }

    if (path === "/auth/me" && method === "GET") {
        if (isDemoAuthenticated()) {
            return createSuccessResponse(MOCK_ADMIN_USER, config);
        }
        return createErrorResponse(401, "Unauthorized in demo mode", config);
    }

    if (path === "/auth/logout" && method === "POST") {
        setDemoAuthenticated(false);
        return createSuccessResponse({ success: true }, config);
    }

    // -------------------------------------------------------------
    // 2. Categories
    // -------------------------------------------------------------
    if (path === "/categories" && method === "GET") {
        let cats = getStoredCategories();
        if (params.type) {
            cats = cats.filter((c) => c.type === params.type);
        }
        return createSuccessResponse(cats, config);
    }

    if (path === "/categories" && method === "POST") {
        const cats = getStoredCategories();
        const newCat: CategoryDTO = {
            _id: "cat_" + Date.now(),
            title: String(body.title || "New Category"),
            description: String(body.description || ""),
            tagColor: (body.tagColor as TagColor) || "#A0C4FF",
            type: (body.type as ProductType) || ProductType.RawMaterial,
        };
        cats.push(newCat);
        saveStoredCategories(cats);
        return createSuccessResponse(newCat, config);
    }

    if (path.startsWith("/categories/") && method === "PATCH") {
        const id = path.replace("/categories/", "");
        const cats = getStoredCategories();
        const idx = cats.findIndex((c) => c._id === id);
        const target = cats[idx];
        if (target) {
            const updated: CategoryDTO = {
                ...target,
                ...(body as Partial<CategoryDTO>),
                _id: target._id,
            };
            cats[idx] = updated;
            saveStoredCategories(cats);
            return createSuccessResponse(updated, config);
        }
        return createErrorResponse(404, "Category not found", config);
    }

    if (path.startsWith("/categories/") && method === "DELETE") {
        const id = path.replace("/categories/", "");
        const cats = getStoredCategories().filter((c) => c._id !== id);
        saveStoredCategories(cats);
        return createSuccessResponse({ success: true }, config);
    }

    // -------------------------------------------------------------
    // 3. Warehouses, Production Units, Suppliers
    // -------------------------------------------------------------
    // Warehouses
    if (path === "/warehouses" && method === "GET") {
        return createSuccessResponse(getStoredWarehouses(), config);
    }
    if (path === "/warehouses" && method === "POST") {
        const list = getStoredWarehouses();
        const newItem: TaggedEntityDTO = {
            _id: "wh_" + Date.now(),
            name: String(body.name || "New Warehouse"),
            description: String(body.description || ""),
            tagColor: (body.tagColor as TagColor) || "#A0C4FF",
        };
        list.push(newItem);
        saveStoredWarehouses(list);
        return createSuccessResponse(newItem, config);
    }
    if (path.startsWith("/warehouses/") && method === "PATCH") {
        const id = path.replace("/warehouses/", "");
        const list = getStoredWarehouses();
        const idx = list.findIndex((w) => w._id === id);
        const target = list[idx];
        if (target) {
            const updated: TaggedEntityDTO = {
                ...target,
                ...(body as Partial<TaggedEntityDTO>),
                _id: target._id,
            };
            list[idx] = updated;
            saveStoredWarehouses(list);
            return createSuccessResponse(updated, config);
        }
        return createErrorResponse(404, "Warehouse not found", config);
    }
    if (path.startsWith("/warehouses/") && method === "DELETE") {
        const id = path.replace("/warehouses/", "");
        const list = getStoredWarehouses().filter((w) => w._id !== id);
        saveStoredWarehouses(list);
        return createSuccessResponse({ success: true }, config);
    }

    // Production Units
    if (path === "/production-units" && method === "GET") {
        return createSuccessResponse(getStoredProductionUnits(), config);
    }
    if (path === "/production-units" && method === "POST") {
        const list = getStoredProductionUnits();
        const newItem: TaggedEntityDTO = {
            _id: "pu_" + Date.now(),
            name: String(body.name || "New Unit"),
            description: String(body.description || ""),
            tagColor: (body.tagColor as TagColor) || "#FFCBA4",
        };
        list.push(newItem);
        saveStoredProductionUnits(list);
        return createSuccessResponse(newItem, config);
    }
    if (path.startsWith("/production-units/") && method === "PATCH") {
        const id = path.replace("/production-units/", "");
        const list = getStoredProductionUnits();
        const idx = list.findIndex((u) => u._id === id);
        const target = list[idx];
        if (target) {
            const updated: TaggedEntityDTO = {
                ...target,
                ...(body as Partial<TaggedEntityDTO>),
                _id: target._id,
            };
            list[idx] = updated;
            saveStoredProductionUnits(list);
            return createSuccessResponse(updated, config);
        }
        return createErrorResponse(404, "Production unit not found", config);
    }
    if (path.startsWith("/production-units/") && method === "DELETE") {
        const id = path.replace("/production-units/", "");
        const list = getStoredProductionUnits().filter((u) => u._id !== id);
        saveStoredProductionUnits(list);
        return createSuccessResponse({ success: true }, config);
    }

    // Suppliers
    if (path === "/suppliers" && method === "GET") {
        return createSuccessResponse(getStoredSuppliers(), config);
    }
    if (path === "/suppliers" && method === "POST") {
        const list = getStoredSuppliers();
        const newItem: TaggedEntityDTO = {
            _id: "sup_" + Date.now(),
            name: String(body.name || "New Supplier"),
            description: String(body.description || ""),
            tagColor: (body.tagColor as TagColor) || "#99D6D0",
        };
        list.push(newItem);
        saveStoredSuppliers(list);
        return createSuccessResponse(newItem, config);
    }
    if (path.startsWith("/suppliers/") && method === "PATCH") {
        const id = path.replace("/suppliers/", "");
        const list = getStoredSuppliers();
        const idx = list.findIndex((s) => s._id === id);
        const target = list[idx];
        if (target) {
            const updated: TaggedEntityDTO = {
                ...target,
                ...(body as Partial<TaggedEntityDTO>),
                _id: target._id,
            };
            list[idx] = updated;
            saveStoredSuppliers(list);
            return createSuccessResponse(updated, config);
        }
        return createErrorResponse(404, "Supplier not found", config);
    }
    if (path.startsWith("/suppliers/") && method === "DELETE") {
        const id = path.replace("/suppliers/", "");
        const list = getStoredSuppliers().filter((s) => s._id !== id);
        saveStoredSuppliers(list);
        return createSuccessResponse({ success: true }, config);
    }

    // -------------------------------------------------------------
    // 4. Products
    // -------------------------------------------------------------
    if (path === "/products" && method === "GET") {
        let prods = getStoredProducts();
        if (params.type) {
            prods = prods.filter((p) => p.type === params.type);
        }
        if (params.categoryId) {
            prods = prods.filter((p) => {
                const catId = typeof p.categoryId === "object" ? p.categoryId?._id : p.categoryId;
                return catId === params.categoryId;
            });
        }
        return createSuccessResponse(prods, config);
    }
    if (path === "/products" && method === "POST") {
        const prods = getStoredProducts();
        const cats = getStoredCategories();
        const matchingCat = cats.find((c) => c._id === body.categoryId);

        const newProd: ProductDTO = {
            _id: "prod_" + Date.now(),
            name: String(body.name || "New Product"),
            description: body.description ? String(body.description) : null,
            categoryId: matchingCat || String(body.categoryId || ""),
            unit: (body.unit as Unit) || Unit.Piece,
            type: (body.type as ProductType) || ProductType.FinishedProduct,
        };
        prods.push(newProd);
        saveStoredProducts(prods);
        return createSuccessResponse(newProd, config);
    }
    if (path.startsWith("/products/") && method === "PATCH") {
        const id = path.replace("/products/", "");
        const prods = getStoredProducts();
        const idx = prods.findIndex((p) => p._id === id);
        const target = prods[idx];
        if (target) {
            const updated: ProductDTO = {
                ...target,
                ...(body as Partial<ProductDTO>),
                _id: target._id,
            };
            prods[idx] = updated;
            saveStoredProducts(prods);
            return createSuccessResponse(updated, config);
        }
        return createErrorResponse(404, "Product not found", config);
    }
    if (path.startsWith("/products/") && method === "DELETE") {
        const id = path.replace("/products/", "");
        const prods = getStoredProducts().filter((p) => p._id !== id);
        saveStoredProducts(prods);
        return createSuccessResponse({ success: true }, config);
    }

    // -------------------------------------------------------------
    // 5. Users
    // -------------------------------------------------------------
    if (path === "/users" && method === "GET") {
        return createSuccessResponse(getStoredUsers(), config);
    }
    if (path === "/users" && method === "POST") {
        const users = getStoredUsers();
        const newUser: UserDTO = {
            _id: "u_" + Date.now(),
            phoneNumber: String(body.phoneNumber),
            name: String(body.name),
            role: (body.role as UserDTO["role"]) || "worker",
        };
        users.push(newUser);
        saveStoredUsers(users);
        return createSuccessResponse(newUser, config);
    }
    if (path.startsWith("/users/") && method === "PATCH") {
        const phone = path.replace("/users/", "");
        const users = getStoredUsers();
        const idx = users.findIndex((u) => u.phoneNumber === phone);
        const target = users[idx];
        if (target) {
            const updated: UserDTO = {
                ...target,
                ...(body as Partial<UserDTO>),
                _id: target._id,
            };
            users[idx] = updated;
            saveStoredUsers(users);
            return createSuccessResponse(updated, config);
        }
        return createErrorResponse(404, "User not found", config);
    }
    if (path.startsWith("/users/") && method === "DELETE") {
        const phone = path.replace("/users/", "");
        const users = getStoredUsers().filter((u) => u.phoneNumber !== phone);
        saveStoredUsers(users);
        return createSuccessResponse({ success: true }, config);
    }

    // -------------------------------------------------------------
    // 6. Inventory & Alerts
    // -------------------------------------------------------------
    if (path === "/inventory/alerts" && method === "GET") {
        const inv = getStoredInventory();
        const rawMaterials: InventoryDTO[] = [];
        const finishedProducts: InventoryDTO[] = [];

        for (const item of inv) {
            if (item.alertThreshold !== null && item.quantity <= item.alertThreshold) {
                if (item.productId?.type === ProductType.RawMaterial) {
                    rawMaterials.push(item);
                } else {
                    finishedProducts.push(item);
                }
            }
        }
        return createSuccessResponse({ rawMaterials, finishedProducts }, config);
    }

    // Sub-route: /inventory/:id/transactions
    if (path.startsWith("/inventory/") && path.endsWith("/transactions") && method === "GET") {
        const inventoryId = path.replace("/inventory/", "").replace("/transactions", "");
        const allTxns = getStoredTransactions();
        const itemTxns = allTxns
            .filter((t) => {
                const id = typeof t.inventoryId === "object" ? t.inventoryId?._id : t.inventoryId;
                return id === inventoryId;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const limit = params.limit ? parseInt(params.limit, 10) : undefined;
        return createSuccessResponse(limit ? itemTxns.slice(0, limit) : itemTxns, config);
    }

    // Sub-route: /inventory/:id/image
    if (path.startsWith("/inventory/") && path.endsWith("/image") && method === "POST") {
        const inventoryId = path.replace("/inventory/", "").replace("/image", "");
        const invList = getStoredInventory();
        const idx = invList.findIndex((i) => i._id === inventoryId);
        const target = invList[idx];
        if (target) {
            target.imgUrl = body.imgUrl ? String(body.imgUrl) : null;
            target.lastUpdated = new Date().toISOString();
            saveStoredInventory(invList);
            return createSuccessResponse(target, config);
        }
        return createErrorResponse(404, "Inventory item not found", config);
    }

    // Single item detail: /inventory/:id
    if (path.startsWith("/inventory/") && method === "GET") {
        const inventoryId = path.replace("/inventory/", "");
        const invList = getStoredInventory();
        const item = invList.find((i) => i._id === inventoryId);
        if (!item) {
            return createErrorResponse(404, "Inventory item not found", config);
        }
        const allTxns = getStoredTransactions();
        const transactions = allTxns
            .filter((t) => {
                const id = typeof t.inventoryId === "object" ? t.inventoryId?._id : t.inventoryId;
                return id === inventoryId;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return createSuccessResponse({ inventory: item, transactions }, config);
    }

    // List inventory: /inventory
    if (path === "/inventory" && method === "GET") {
        let invList = getStoredInventory();

        if (params.search) {
            const q = params.search.toLowerCase();
            invList = invList.filter(
                (item) =>
                    item.productId?.name.toLowerCase().includes(q) ||
                    item.location?.toLowerCase().includes(q),
            );
        }

        if (params.warehouseId) {
            invList = invList.filter((item) => {
                const whId =
                    typeof item.warehouseId === "object"
                        ? item.warehouseId?._id
                        : item.warehouseId;
                return whId === params.warehouseId;
            });
        }

        if (params.type) {
            invList = invList.filter((item) => item.productId?.type === params.type);
        }

        if (params.categoryId) {
            invList = invList.filter((item) => {
                const catId =
                    typeof item.productId?.categoryId === "object"
                        ? item.productId.categoryId?._id
                        : item.productId?.categoryId;
                return catId === params.categoryId;
            });
        }

        return createSuccessResponse(invList, config);
    }

    // Create inventory: POST /inventory
    if (path === "/inventory" && method === "POST") {
        const invList = getStoredInventory();
        const products = getStoredProducts();
        const warehouses = getStoredWarehouses();

        const product = products.find((p) => p._id === body.productId) || {
            _id: String(body.productId),
            name: "Product #" + String(body.productId).slice(-4),
            description: null,
            categoryId: "",
            unit: Unit.Piece,
            type: ProductType.FinishedProduct,
        };

        const warehouse = warehouses.find((w) => w._id === body.warehouseId) || {
            _id: String(body.warehouseId),
            name: "Warehouse",
            description: "",
            tagColor: "#A0C4FF" as TagColor,
        };

        const newInv: InventoryDTO = {
            _id: "inv_" + Date.now(),
            productId: product,
            warehouseId: warehouse,
            supplierId: body.supplierId ? String(body.supplierId) : null,
            location: String(body.location || "Default Bay"),
            price: Number(body.price || 0),
            quantity: Number(body.quantity || 0),
            alertThreshold:
                body.alertThreshold != null && body.alertThreshold !== ""
                    ? Number(body.alertThreshold)
                    : null,
            imgUrl: null,
            lastUpdated: new Date().toISOString(),
        };

        invList.unshift(newInv);
        saveStoredInventory(invList);

        // If initial quantity > 0, log an initial transaction
        if (newInv.quantity > 0) {
            const txns = getStoredTransactions();
            const initTxn: TransactionDTO = {
                _id: "txn_" + Date.now(),
                inventoryId: {
                    _id: newInv._id,
                    productId: newInv.productId,
                    warehouseId: newInv.warehouseId,
                    location: newInv.location,
                    price: newInv.price,
                    quantity: newInv.quantity,
                },
                transactionType:
                    newInv.productId.type === ProductType.RawMaterial
                        ? TransactionType.Purchase
                        : TransactionType.Production,
                quantity: newInv.quantity,
                producedBy: null,
                consumedBy: null,
                createdBy: MOCK_ADMIN_USER.phoneNumber,
                notes: "Initial inventory setup",
                timestamp: new Date().toISOString(),
            };
            txns.unshift(initTxn);
            saveStoredTransactions(txns);
        }

        return createSuccessResponse(newInv, config);
    }

    // Update inventory: PATCH /inventory/:id
    if (path.startsWith("/inventory/") && method === "PATCH") {
        const id = path.replace("/inventory/", "");
        const invList = getStoredInventory();
        const idx = invList.findIndex((i) => i._id === id);
        const target = invList[idx];
        if (target) {
            const updated: InventoryDTO = {
                ...target,
                ...(body as Partial<InventoryDTO>),
                _id: target._id,
                lastUpdated: new Date().toISOString(),
            };
            invList[idx] = updated;
            saveStoredInventory(invList);
            return createSuccessResponse(updated, config);
        }
        return createErrorResponse(404, "Inventory item not found", config);
    }

    // -------------------------------------------------------------
    // 7. Transactions
    // -------------------------------------------------------------
    if (
        (path === "/transactions/recent" ||
            path === "/transactions" ||
            path === "/dashboard/transactions") &&
        method === "GET"
    ) {
        const txns = getStoredTransactions().sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        const limit = params.limit ? parseInt(params.limit, 10) : 100;
        return createSuccessResponse(txns.slice(0, limit), config);
    }

    if (path === "/transactions" && method === "POST") {
        const invList = getStoredInventory();
        const units = getStoredProductionUnits();
        const txns = getStoredTransactions();

        const invId = String(body.inventoryId);
        const invItem = invList.find((i) => i._id === invId);
        const qty = Number(body.quantity || 0);
        const txnType = body.transactionType as TransactionType;

        // Apply dynamic stock updates
        if (invItem) {
            if (
                txnType === TransactionType.Purchase ||
                txnType === TransactionType.Production ||
                txnType === TransactionType.Adjustment
            ) {
                invItem.quantity += qty;
            } else if (
                txnType === TransactionType.Sale ||
                txnType === TransactionType.Consumption
            ) {
                invItem.quantity = Math.max(0, invItem.quantity - qty);
            }
            invItem.lastUpdated = new Date().toISOString();
            saveStoredInventory(invList);
        }

        const prodUnit = units.find((u) => u._id === body.producedBy) || null;
        const consUnit = units.find((u) => u._id === body.consumedBy) || null;

        const newTxn: TransactionDTO = {
            _id: "txn_" + Date.now(),
            inventoryId: invItem
                ? {
                      _id: invItem._id,
                      productId: invItem.productId,
                      warehouseId: invItem.warehouseId,
                      location: invItem.location,
                      price: invItem.price,
                      quantity: invItem.quantity,
                  }
                : invId,
            transactionType: txnType,
            quantity: qty,
            producedBy: prodUnit,
            consumedBy: consUnit,
            createdBy: MOCK_ADMIN_USER.phoneNumber,
            notes: body.notes ? String(body.notes) : null,
            timestamp: new Date().toISOString(),
        };

        txns.unshift(newTxn);
        saveStoredTransactions(txns);

        // Support both direct TransactionDTO return and { success: true, transaction }
        const responseData = {
            ...newTxn,
            success: true,
            transaction: newTxn,
        };

        return createSuccessResponse(responseData, config);
    }

    if (path.startsWith("/transactions/") && method === "PATCH") {
        const id = path.replace("/transactions/", "");
        const txns = getStoredTransactions();
        const idx = txns.findIndex((t) => t._id === id);
        const target = txns[idx];
        if (target) {
            const updated: TransactionDTO = {
                ...target,
                ...(body as Partial<TransactionDTO>),
                _id: target._id,
            };
            txns[idx] = updated;
            saveStoredTransactions(txns);
            return createSuccessResponse(updated, config);
        }
        return createErrorResponse(404, "Transaction not found", config);
    }

    // Staff (employees, weekly advances, attendance)
    const staff = handleStaffMock(method, path, params, body);
    if (staff) {
        if (staff.status >= 400) return createErrorResponse(staff.status, staff.error ?? "Request failed", config);
        return createSuccessResponse(staff.data ?? null, config);
    }

    // Expenses (heads, dated entries, monthly totals)
    const expenses = handleExpenseMock(method, path, params, body);
    if (expenses) {
        if (expenses.status >= 400) return createErrorResponse(expenses.status, expenses.error ?? "Request failed", config);
        return createSuccessResponse(expenses.data ?? null, config);
    }

    // Accounts (creditors, debtors, ledger, activity log, reminders)
    const accounts = handleAccountsMock(method, path, params, body);
    if (accounts) {
        if (accounts.status >= 400) {
            const err = (await createErrorResponse(accounts.status, accounts.error ?? "Request failed", config).catch((e) => e)) as { response?: { data: unknown } };
            if (err.response && accounts.fieldErrors) (err.response.data as Record<string, unknown>).fieldErrors = accounts.fieldErrors;
            return Promise.reject(err);
        }
        return createSuccessResponse(accounts.data ?? null, config);
    }

    // Fallback for any unhandled GET/POST/etc
    console.warn(`[Mock Adapter] Unhandled route: ${method} ${path}`, body);
    return createSuccessResponse({ success: true }, config);
}
