// src/lib/mockData.ts
import { ProductType, Unit, TransactionType, type TagColor } from "@robago/shared";
import type {
    CategoryDTO,
    ProductDTO,
    TaggedEntityDTO,
    InventoryDTO,
    TransactionDTO,
    UserDTO,
} from "@/types";

export const MOCK_ADMIN_USER: UserDTO = {
    _id: "u1",
    phoneNumber: "1234567890",
    name: "Admin User",
    role: "superadmin",
};

export const MOCK_DEFAULT_ADMIN: UserDTO = {
    _id: "u2",
    phoneNumber: "9500088697",
    name: "Default Admin",
    role: "superadmin",
};

// 1. Warehouses
export const whGodown: TaggedEntityDTO = {
    _id: "wh_godown",
    name: "Parrys Central Godown",
    description: "Central storage hub in Parrys",
    tagColor: "#A0C4FF",
};

export const whFactory: TaggedEntityDTO = {
    _id: "wh_factory",
    name: "Factory Workshop Floor",
    description: "Production stitching floor",
    tagColor: "#D1E6B1",
};

export const INITIAL_WAREHOUSES: TaggedEntityDTO[] = [whGodown, whFactory];

// 2. Production Units
export const puSaImpex: TaggedEntityDTO = {
    _id: "pu_sa_impex",
    name: "S A IMPEX",
    description: "Stitching & Assembly Contractor",
    tagColor: "#FFCBA4",
};

export const puParrys: TaggedEntityDTO = {
    _id: "pu_parrys",
    name: "Parrys Stitching Line",
    description: "Internal Stitching Unit",
    tagColor: "#FFB6A1",
};

export const INITIAL_PRODUCTION_UNITS: TaggedEntityDTO[] = [puSaImpex, puParrys];

// 3. Suppliers
export const supNingbo: TaggedEntityDTO = {
    _id: "sup_ningbo",
    name: "Ningbo-jonny (China)",
    description: "Imported fabrics & hardware",
    tagColor: "#99D6D0" as TagColor,
};

export const supJanakson: TaggedEntityDTO = {
    _id: "sup_janakson",
    name: "Janakson Zippers",
    description: "Zippers & sliders",
    tagColor: "#FFD580",
};

export const supIfc: TaggedEntityDTO = {
    _id: "sup_ifc",
    name: "IFC Trims",
    description: "Tapes, buckles & accessories",
    tagColor: "#C1A3C3",
};

export const INITIAL_SUPPLIERS: TaggedEntityDTO[] = [supNingbo, supJanakson, supIfc];

// 4. Categories
export const catChina: CategoryDTO = {
    _id: "cat_china",
    title: "China fabric",
    description: "Imported polyester and nylon fabrics",
    type: ProductType.RawMaterial,
    tagColor: "#A0C4FF",
};

export const catAirmesh: CategoryDTO = {
    _id: "cat_airmesh",
    title: "Airmesh",
    description: "Breathable 3D spacer mesh fabrics",
    type: ProductType.RawMaterial,
    tagColor: "#D1E6B1",
};

export const catYkk: CategoryDTO = {
    _id: "cat_ykk",
    title: "YKK zippers",
    description: "Standard and waterproof coil zippers",
    type: ProductType.RawMaterial,
    tagColor: "#FFD580",
};

export const catTapes: CategoryDTO = {
    _id: "cat_tapes",
    title: "Backpack Tapes",
    description: "Webbing, piping & border tapes",
    type: ProductType.RawMaterial,
    tagColor: "#FFB6A1",
};

export const catBackpacks: CategoryDTO = {
    _id: "cat_backpacks",
    title: "Backpack Bags",
    description: "Everyday and school backpacks",
    type: ProductType.FinishedProduct,
    tagColor: "#C1A3C3",
};

export const catExecutive: CategoryDTO = {
    _id: "cat_executive",
    title: "Executive Backpacks",
    description: "Office, laptop and premium travel bags",
    type: ProductType.FinishedProduct,
    tagColor: "#FFCBA4",
};

export const INITIAL_CATEGORIES: CategoryDTO[] = [
    catChina,
    catAirmesh,
    catYkk,
    catTapes,
    catBackpacks,
    catExecutive,
];

// 5. Products
export const prodZy: ProductDTO = {
    _id: "prod_zy",
    name: "ZY-065-9 GREY",
    description: "600D Grey Polyester Fabric",
    categoryId: catChina,
    unit: Unit.Metre,
    type: ProductType.RawMaterial,
};

export const prodMil: ProductDTO = {
    _id: "prod_mil",
    name: "Military Black",
    description: "1000D Nylon Cordura Military Black",
    categoryId: catChina,
    unit: Unit.Metre,
    type: ProductType.RawMaterial,
};

export const prodAirmesh: ProductDTO = {
    _id: "prod_airmesh",
    name: "Airmesh Black",
    description: "3mm Breathable Spacer Mesh",
    categoryId: catAirmesh,
    unit: Unit.Metre,
    type: ProductType.RawMaterial,
};

export const prodLining: ProductDTO = {
    _id: "prod_lining",
    name: "Lining 210 D-Black",
    description: "210D Poly Taffeta Lining",
    categoryId: catChina,
    unit: Unit.Metre,
    type: ProductType.RawMaterial,
};

export const prodBlaze: ProductDTO = {
    _id: "prod_blaze",
    name: "Blaze-530",
    description: "Ergonomic 32L Everyday Backpack",
    categoryId: catBackpacks,
    unit: Unit.Piece,
    type: ProductType.FinishedProduct,
};

export const prodPosh: ProductDTO = {
    _id: "prod_posh",
    name: "POSH-610",
    description: "Premium Water-Resistant Laptop Bag",
    categoryId: catExecutive,
    unit: Unit.Piece,
    type: ProductType.FinishedProduct,
};

export const prodWern: ProductDTO = {
    _id: "prod_wern",
    name: "WERN-616",
    description: "Compact Roll-Top Commuter Bag",
    categoryId: catExecutive,
    unit: Unit.Piece,
    type: ProductType.FinishedProduct,
};

export const INITIAL_PRODUCTS: ProductDTO[] = [
    prodZy,
    prodMil,
    prodAirmesh,
    prodLining,
    prodBlaze,
    prodPosh,
    prodWern,
];

// 6. Inventories
export const invZyGodown: InventoryDTO = {
    _id: "inv_zy_godown",
    productId: prodZy,
    warehouseId: whGodown,
    supplierId: "sup_ningbo",
    location: "Rack A-12",
    price: 130,
    quantity: 180,
    alertThreshold: 50,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 7 * 86400000).toISOString(),
};

export const invMilGodown: InventoryDTO = {
    _id: "inv_mil_godown",
    productId: prodMil,
    warehouseId: whGodown,
    supplierId: "sup_ningbo",
    location: "Rack B-04",
    price: 255,
    quantity: 997,
    alertThreshold: 100,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 5 * 86400000).toISOString(),
};

export const invMilFactory: InventoryDTO = {
    _id: "inv_mil_factory",
    productId: prodMil,
    warehouseId: whFactory,
    supplierId: "sup_ningbo",
    location: "Cutting Table 1",
    price: 255,
    quantity: 65,
    alertThreshold: 20,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 3 * 86400000).toISOString(),
};

export const invAirmeshFactory: InventoryDTO = {
    _id: "inv_airmesh_factory",
    productId: prodAirmesh,
    warehouseId: whFactory,
    supplierId: "sup_ifc",
    location: "Shelf C-02",
    price: 140,
    quantity: 79, // Alert: 79 < 80
    alertThreshold: 80,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 4 * 3600000).toISOString(),
};

export const invLiningGodown: InventoryDTO = {
    _id: "inv_lining_godown",
    productId: prodLining,
    warehouseId: whGodown,
    supplierId: "sup_ningbo",
    location: "Rack A-08",
    price: 79,
    quantity: 774,
    alertThreshold: 200,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 8 * 86400000).toISOString(),
};

export const invBlazeGodown: InventoryDTO = {
    _id: "inv_blaze_godown",
    productId: prodBlaze,
    warehouseId: whGodown,
    supplierId: null,
    location: "Finished Goods Bay 1",
    price: 530,
    quantity: 150,
    alertThreshold: 30,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 1 * 86400000).toISOString(),
};

export const invBlazeFactory: InventoryDTO = {
    _id: "inv_blaze_factory",
    productId: prodBlaze,
    warehouseId: whFactory,
    supplierId: null,
    location: "QC Inspection Area",
    price: 530,
    quantity: 17, // Alert: 17 < 25
    alertThreshold: 25,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 2 * 86400000).toISOString(),
};

export const invPoshGodown: InventoryDTO = {
    _id: "inv_posh_godown",
    productId: prodPosh,
    warehouseId: whGodown,
    supplierId: null,
    location: "Finished Goods Bay 2",
    price: 610,
    quantity: 80,
    alertThreshold: 20,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 12 * 3600000).toISOString(),
};

export const invWernFactory: InventoryDTO = {
    _id: "inv_wern_factory",
    productId: prodWern,
    warehouseId: whFactory,
    supplierId: null,
    location: "Assembly Packing Line",
    price: 616,
    quantity: 3, // Alert: 3 < 10
    alertThreshold: 10,
    imgUrl: null,
    lastUpdated: new Date(Date.now() - 6 * 86400000).toISOString(),
};

export const INITIAL_INVENTORY: InventoryDTO[] = [
    invZyGodown,
    invMilGodown,
    invMilFactory,
    invAirmeshFactory,
    invLiningGodown,
    invBlazeGodown,
    invBlazeFactory,
    invPoshGodown,
    invWernFactory,
];

// 7. Transactions
export const INITIAL_TRANSACTIONS: TransactionDTO[] = [
    {
        _id: "txn_8",
        inventoryId: {
            _id: "inv_mil_godown",
            productId: prodMil,
            warehouseId: whGodown,
            location: "Rack B-04",
            price: 255,
            quantity: 997,
        },
        transactionType: TransactionType.Adjustment,
        quantity: 3,
        producedBy: null,
        consumedBy: null,
        createdBy: "1234567890",
        notes: "Scrap cutoff audit reconciliation",
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
    {
        _id: "txn_7",
        inventoryId: {
            _id: "inv_airmesh_factory",
            productId: prodAirmesh,
            warehouseId: whFactory,
            location: "Shelf C-02",
            price: 140,
            quantity: 79,
        },
        transactionType: TransactionType.Consumption,
        quantity: 15,
        producedBy: null,
        consumedBy: puParrys,
        createdBy: "1234567890",
        notes: "Back panel padding consumption",
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
        _id: "txn_6",
        inventoryId: {
            _id: "inv_posh_godown",
            productId: prodPosh,
            warehouseId: whGodown,
            location: "Finished Goods Bay 2",
            price: 610,
            quantity: 80,
        },
        transactionType: TransactionType.Production,
        quantity: 80,
        producedBy: puParrys,
        consumedBy: null,
        createdBy: "1234567890",
        notes: "Inward from Parrys Stitching Line",
        timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
        _id: "txn_5",
        inventoryId: {
            _id: "inv_blaze_godown",
            productId: prodBlaze,
            warehouseId: whGodown,
            location: "Finished Goods Bay 1",
            price: 530,
            quantity: 150,
        },
        transactionType: TransactionType.Sale,
        quantity: 25,
        producedBy: null,
        consumedBy: null,
        createdBy: "1234567890",
        notes: "Dispatch to Metro Retailers PO #991",
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
        _id: "txn_4",
        inventoryId: {
            _id: "inv_blaze_factory",
            productId: prodBlaze,
            warehouseId: whFactory,
            location: "QC Inspection Area",
            price: 530,
            quantity: 17,
        },
        transactionType: TransactionType.Production,
        quantity: 20,
        producedBy: puSaImpex,
        consumedBy: null,
        createdBy: "1234567890",
        notes: "Stitched and assembled by S A IMPEX",
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
        _id: "txn_3",
        inventoryId: {
            _id: "inv_mil_factory",
            productId: prodMil,
            warehouseId: whFactory,
            location: "Cutting Table 1",
            price: 255,
            quantity: 65,
        },
        transactionType: TransactionType.Consumption,
        quantity: 35,
        producedBy: null,
        consumedBy: puSaImpex,
        createdBy: "1234567890",
        notes: "Fabric issue for Blaze-530 batch 1",
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
        _id: "txn_2",
        inventoryId: {
            _id: "inv_mil_godown",
            productId: prodMil,
            warehouseId: whGodown,
            location: "Rack B-04",
            price: 255,
            quantity: 997,
        },
        transactionType: TransactionType.Purchase,
        quantity: 1000,
        producedBy: null,
        consumedBy: null,
        createdBy: "1234567890",
        notes: "Import container batch #MB-442",
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
        _id: "txn_1",
        inventoryId: {
            _id: "inv_zy_godown",
            productId: prodZy,
            warehouseId: whGodown,
            location: "Rack A-12",
            price: 130,
            quantity: 180,
        },
        transactionType: TransactionType.Purchase,
        quantity: 180,
        producedBy: null,
        consumedBy: null,
        createdBy: "1234567890",
        notes: "Initial roll import from Ningbo-jonny",
        timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
];

// LocalStorage accessors
const STORAGE_KEYS = {
    INVENTORY: "robago_demo_inventory",
    TRANSACTIONS: "robago_demo_transactions",
    CATEGORIES: "robago_demo_categories",
    WAREHOUSES: "robago_demo_warehouses",
    PRODUCTION_UNITS: "robago_demo_production_units",
    SUPPLIERS: "robago_demo_suppliers",
    PRODUCTS: "robago_demo_products",
    USERS: "robago_demo_users",
    AUTH: "robago_demo_auth",
    MODE: "robago_demo_mode",
};

function safeGet<T>(key: string, fallback: T): T {
    try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        return JSON.parse(item) as T;
    } catch {
        return fallback;
    }
}

function safeSet<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn(`Failed to persist ${key} to localStorage:`, e);
    }
}

export function getStoredInventory(): InventoryDTO[] {
    const data = safeGet<InventoryDTO[]>(STORAGE_KEYS.INVENTORY, []);
    if (data.length === 0) {
        safeSet(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY);
        return INITIAL_INVENTORY;
    }
    return data;
}

export function saveStoredInventory(items: InventoryDTO[]): void {
    safeSet(STORAGE_KEYS.INVENTORY, items);
}

export function getStoredTransactions(): TransactionDTO[] {
    const data = safeGet<TransactionDTO[]>(STORAGE_KEYS.TRANSACTIONS, []);
    if (data.length === 0) {
        safeSet(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
        return INITIAL_TRANSACTIONS;
    }
    return data;
}

export function saveStoredTransactions(txns: TransactionDTO[]): void {
    safeSet(STORAGE_KEYS.TRANSACTIONS, txns);
}

export function getStoredCategories(): CategoryDTO[] {
    const data = safeGet<CategoryDTO[]>(STORAGE_KEYS.CATEGORIES, []);
    if (data.length === 0) {
        safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
        return INITIAL_CATEGORIES;
    }
    return data;
}

export function saveStoredCategories(cats: CategoryDTO[]): void {
    safeSet(STORAGE_KEYS.CATEGORIES, cats);
}

export function getStoredWarehouses(): TaggedEntityDTO[] {
    const data = safeGet<TaggedEntityDTO[]>(STORAGE_KEYS.WAREHOUSES, []);
    if (data.length === 0) {
        safeSet(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
        return INITIAL_WAREHOUSES;
    }
    return data;
}

export function saveStoredWarehouses(whs: TaggedEntityDTO[]): void {
    safeSet(STORAGE_KEYS.WAREHOUSES, whs);
}

export function getStoredProductionUnits(): TaggedEntityDTO[] {
    const data = safeGet<TaggedEntityDTO[]>(STORAGE_KEYS.PRODUCTION_UNITS, []);
    if (data.length === 0) {
        safeSet(STORAGE_KEYS.PRODUCTION_UNITS, INITIAL_PRODUCTION_UNITS);
        return INITIAL_PRODUCTION_UNITS;
    }
    return data;
}

export function saveStoredProductionUnits(units: TaggedEntityDTO[]): void {
    safeSet(STORAGE_KEYS.PRODUCTION_UNITS, units);
}

export function getStoredSuppliers(): TaggedEntityDTO[] {
    const data = safeGet<TaggedEntityDTO[]>(STORAGE_KEYS.SUPPLIERS, []);
    if (data.length === 0) {
        safeSet(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
        return INITIAL_SUPPLIERS;
    }
    return data;
}

export function saveStoredSuppliers(sups: TaggedEntityDTO[]): void {
    safeSet(STORAGE_KEYS.SUPPLIERS, sups);
}

export function getStoredProducts(): ProductDTO[] {
    const data = safeGet<ProductDTO[]>(STORAGE_KEYS.PRODUCTS, []);
    if (data.length === 0) {
        safeSet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        return INITIAL_PRODUCTS;
    }
    return data;
}

export function saveStoredProducts(prods: ProductDTO[]): void {
    safeSet(STORAGE_KEYS.PRODUCTS, prods);
}

export function getStoredUsers(): UserDTO[] {
    const data = safeGet<UserDTO[]>(STORAGE_KEYS.USERS, []);
    if (data.length === 0) {
        const users = [MOCK_ADMIN_USER, MOCK_DEFAULT_ADMIN];
        safeSet(STORAGE_KEYS.USERS, users);
        return users;
    }
    return data;
}

export function saveStoredUsers(users: UserDTO[]): void {
    safeSet(STORAGE_KEYS.USERS, users);
}

export function isDemoAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === "true";
}

export function setDemoAuthenticated(val: boolean): void {
    if (val) {
        localStorage.setItem(STORAGE_KEYS.AUTH, "true");
    } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
}
