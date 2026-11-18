// src/scripts/seed.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.model.js";
import { Warehouse, Supplier, ProductionUnit } from "../models/taggedEntity.model.js";
import { Category } from "../models/Category.model.js";
import { Product } from "../models/Product.model.js";
import { Inventory } from "../models/Inventory.model.js";
import { Transaction } from "../models/Transaction.model.js";
import { ProductType, Unit, TransactionType } from "@robago/shared";

async function seed() {
    console.log("Connecting to MongoDB:", env.MONGO_URI.replace(/:([^:@]+)@/, ":****@"));
    await mongoose.connect(env.MONGO_URI);

    console.log("Cleaning existing domain data...");
    await Promise.all([
        User.deleteMany({}),
        Warehouse.deleteMany({}),
        Supplier.deleteMany({}),
        ProductionUnit.deleteMany({}),
        Category.deleteMany({}),
        Product.deleteMany({}),
        Inventory.deleteMany({}),
        Transaction.deleteMany({}),
    ]);

    // 1. Users
    console.log("Seeding Users...");
    const passcodeHash = await bcrypt.hash("123456", 10);
    const adminUser = await User.create({
        phoneNumber: "1234567890",
        name: "Admin User",
        role: "superadmin",
        passwordHash: passcodeHash,
        tokenVersion: 0,
    });
    await User.create({
        phoneNumber: "9500088697",
        name: "Default Admin",
        role: "superadmin",
        passwordHash: passcodeHash,
        tokenVersion: 0,
    });

    // 2. Warehouses
    console.log("Seeding Warehouses...");
    const godown = await Warehouse.create({
        name: "Parrys Central Godown",
        description: "Central storage hub in Parrys",
        tagColor: "#A0C4FF",
    });
    const factory = await Warehouse.create({
        name: "Factory Workshop Floor",
        description: "Production stitching floor",
        tagColor: "#D1E6B1",
    });

    // 3. Production Units
    console.log("Seeding Production Units...");
    const saImpex = await ProductionUnit.create({
        name: "S A IMPEX",
        description: "Stitching & Assembly Contractor",
        tagColor: "#FFCBA4",
    });
    const parrysStitching = await ProductionUnit.create({
        name: "Parrys Stitching Line",
        description: "Internal Stitching Unit",
        tagColor: "#FFB6A1",
    });

    // 4. Suppliers
    console.log("Seeding Suppliers...");
    const ningbo = await Supplier.create({
        name: "Ningbo-jonny (China)",
        description: "Imported fabrics & hardware",
        tagColor: "#99D6D0",
    });
    await Supplier.create({
        name: "Janakson Zippers",
        description: "Zippers & sliders",
        tagColor: "#FFD580",
    });
    const ifc = await Supplier.create({
        name: "IFC Trims",
        description: "Tapes, buckles & accessories",
        tagColor: "#C1A3C3",
    });

    // 5. Categories
    console.log("Seeding Categories...");
    const chinaFabric = await Category.create({
        title: "China fabric",
        description: "Imported polyester and nylon fabrics",
        type: ProductType.RawMaterial,
        tagColor: "#A0C4FF",
    });
    const airmesh = await Category.create({
        title: "Airmesh",
        description: "Breathable 3D spacer mesh fabrics",
        type: ProductType.RawMaterial,
        tagColor: "#D1E6B1",
    });
    await Category.create({
        title: "YKK zippers",
        description: "Standard and waterproof coil zippers",
        type: ProductType.RawMaterial,
        tagColor: "#FFD580",
    });
    await Category.create({
        title: "Backpack Tapes",
        description: "Webbing, piping & border tapes",
        type: ProductType.RawMaterial,
        tagColor: "#FFB6A1",
    });
    const backpackBags = await Category.create({
        title: "Backpack Bags",
        description: "Everyday and school backpacks",
        type: ProductType.FinishedProduct,
        tagColor: "#C1A3C3",
    });
    const executiveBags = await Category.create({
        title: "Executive Backpacks",
        description: "Office, laptop and premium travel bags",
        type: ProductType.FinishedProduct,
        tagColor: "#FFCBA4",
    });

    // 6. Products
    console.log("Seeding Products...");
    const pZyGrey = await Product.create({
        name: "ZY-065-9 GREY",
        description: "600D Grey Polyester Fabric",
        categoryId: chinaFabric._id,
        unit: Unit.Metre,
        type: ProductType.RawMaterial,
    });
    const pMilBlack = await Product.create({
        name: "Military Black",
        description: "1000D Nylon Cordura Military Black",
        categoryId: chinaFabric._id,
        unit: Unit.Metre,
        type: ProductType.RawMaterial,
    });
    const pAirmeshBlack = await Product.create({
        name: "Airmesh Black",
        description: "3mm Breathable Spacer Mesh",
        categoryId: airmesh._id,
        unit: Unit.Metre,
        type: ProductType.RawMaterial,
    });
    const pLiningBlack = await Product.create({
        name: "Lining 210 D-Black",
        description: "210D Poly Taffeta Lining",
        categoryId: chinaFabric._id,
        unit: Unit.Metre,
        type: ProductType.RawMaterial,
    });
    const pBlaze = await Product.create({
        name: "Blaze-530",
        description: "Ergonomic 32L Everyday Backpack",
        categoryId: backpackBags._id,
        unit: Unit.Piece,
        type: ProductType.FinishedProduct,
    });
    const pPosh = await Product.create({
        name: "POSH-610",
        description: "Premium Water-Resistant Laptop Bag",
        categoryId: executiveBags._id,
        unit: Unit.Piece,
        type: ProductType.FinishedProduct,
    });
    const pWern = await Product.create({
        name: "WERN-616",
        description: "Compact Roll-Top Commuter Bag",
        categoryId: executiveBags._id,
        unit: Unit.Piece,
        type: ProductType.FinishedProduct,
    });

    // 7. Inventories
    console.log("Seeding Inventories...");
    // Raw materials
    const invZyGodown = await Inventory.create({
        productId: pZyGrey._id,
        warehouseId: godown._id,
        supplierId: ningbo._id,
        location: "Rack A-12",
        price: 130,
        quantity: 180,
        alertThreshold: 50,
    });

    const invMilGodown = await Inventory.create({
        productId: pMilBlack._id,
        warehouseId: godown._id,
        supplierId: ningbo._id,
        location: "Rack B-04",
        price: 255,
        quantity: 997,
        alertThreshold: 100,
    });

    const invMilFactory = await Inventory.create({
        productId: pMilBlack._id,
        warehouseId: factory._id,
        supplierId: ningbo._id,
        location: "Cutting Table 1",
        price: 255,
        quantity: 65,
        alertThreshold: 20,
    });

    const invAirmeshFactory = await Inventory.create({
        productId: pAirmeshBlack._id,
        warehouseId: factory._id,
        supplierId: ifc._id,
        location: "Shelf C-02",
        price: 140,
        quantity: 79, // Alert: 79 < 80
        alertThreshold: 80,
    });

    await Inventory.create({
        productId: pLiningBlack._id,
        warehouseId: godown._id,
        supplierId: ningbo._id,
        location: "Rack A-08",
        price: 79,
        quantity: 774,
        alertThreshold: 200,
    });

    // Finished products
    const invBlazeGodown = await Inventory.create({
        productId: pBlaze._id,
        warehouseId: godown._id,
        location: "Finished Goods Bay 1",
        price: 530,
        quantity: 150,
        alertThreshold: 30,
    });

    const invBlazeFactory = await Inventory.create({
        productId: pBlaze._id,
        warehouseId: factory._id,
        location: "QC Inspection Area",
        price: 530,
        quantity: 17, // Alert: 17 < 25
        alertThreshold: 25,
    });

    const invPoshGodown = await Inventory.create({
        productId: pPosh._id,
        warehouseId: godown._id,
        location: "Finished Goods Bay 2",
        price: 610,
        quantity: 80,
        alertThreshold: 20,
    });

    await Inventory.create({
        productId: pWern._id,
        warehouseId: factory._id,
        location: "Assembly Packing Line",
        price: 616,
        quantity: 3, // Alert: 3 < 10
        alertThreshold: 10,
    });

    // 8. Transactions (6-8 entries)
    console.log("Seeding Transactions...");
    const now = Date.now();
    const oneHour = 3600 * 1000;

    await Transaction.create([
        {
            inventoryId: invZyGodown._id,
            transactionType: TransactionType.Purchase,
            quantity: 180,
            createdBy: adminUser.phoneNumber,
            notes: "Initial roll import from Ningbo-jonny",
            timestamp: new Date(now - 7 * 24 * oneHour),
        },
        {
            inventoryId: invMilGodown._id,
            transactionType: TransactionType.Purchase,
            quantity: 1000,
            createdBy: adminUser.phoneNumber,
            notes: "Import container batch #MB-442",
            timestamp: new Date(now - 5 * 24 * oneHour),
        },
        {
            inventoryId: invMilFactory._id,
            transactionType: TransactionType.Consumption,
            quantity: 35,
            consumedBy: saImpex._id,
            createdBy: adminUser.phoneNumber,
            notes: "Fabric issue for Blaze-530 batch 1",
            timestamp: new Date(now - 3 * 24 * oneHour),
        },
        {
            inventoryId: invBlazeFactory._id,
            transactionType: TransactionType.Production,
            quantity: 20,
            producedBy: saImpex._id,
            createdBy: adminUser.phoneNumber,
            notes: "Stitched and assembled by S A IMPEX",
            timestamp: new Date(now - 2 * 24 * oneHour),
        },
        {
            inventoryId: invBlazeGodown._id,
            transactionType: TransactionType.Sale,
            quantity: 25,
            createdBy: adminUser.phoneNumber,
            notes: "Dispatch to Metro Retailers PO #991",
            timestamp: new Date(now - 1 * 24 * oneHour),
        },
        {
            inventoryId: invPoshGodown._id,
            transactionType: TransactionType.Production,
            quantity: 80,
            producedBy: parrysStitching._id,
            createdBy: adminUser.phoneNumber,
            notes: "Inward from Parrys Stitching Line",
            timestamp: new Date(now - 12 * oneHour),
        },
        {
            inventoryId: invAirmeshFactory._id,
            transactionType: TransactionType.Consumption,
            quantity: 15,
            consumedBy: parrysStitching._id,
            createdBy: adminUser.phoneNumber,
            notes: "Back panel padding consumption",
            timestamp: new Date(now - 4 * oneHour),
        },
        {
            inventoryId: invMilGodown._id,
            transactionType: TransactionType.Adjustment,
            quantity: 3,
            createdBy: adminUser.phoneNumber,
            notes: "Scrap cutoff audit reconciliation",
            timestamp: new Date(now - 1 * oneHour),
        },
    ]);

    await mongoose.disconnect();
    console.log("Seeding complete! Domain data populated successfully.");
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
