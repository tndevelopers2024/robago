// src/services/expense.service.ts
import { isValidObjectId, type HydratedDocument } from "mongoose";
import {
    EXPENSE_DEFAULT_ITEMS,
    type CreateExpenseInput,
    type CreateExpenseItemInput,
    type ExpenseDTO,
    type ExpenseItemDTO,
    type ExpenseTotalDTO,
    type UpdateExpenseInput,
    type UpdateExpenseItemInput,
} from "@robago/shared";
import { Expense, ExpenseItem } from "../models/Expense.model.js";
import { ApiError } from "../utils/ApiError.js";

const keyOf = (name: string) => name.trim().toLowerCase();

type ItemDoc = HydratedDocument<{ name: string; nameKey: string; type: string; active: boolean }>;
const toItemDTO = (i: ItemDoc): ExpenseItemDTO => ({
    id: i.id as string,
    name: i.name,
    type: i.type as ExpenseItemDTO["type"],
    active: i.active,
});

type ExpenseDoc = HydratedDocument<{ date: string; month: string; itemId: unknown; amount: number; note: string }>;
const toExpenseDTO = (e: ExpenseDoc): ExpenseDTO => ({
    id: e.id as string,
    date: e.date,
    itemId: String(e.itemId),
    amount: e.amount,
    note: e.note,
});

// ---- heads --------------------------------------------------------------------------------------

/** First use: create the starting list of heads, but only if there are none at all. */
async function ensureDefaultItems() {
    if (await ExpenseItem.exists({})) return;
    const docs = EXPENSE_DEFAULT_ITEMS.flatMap(({ type, names }) =>
        names.map((name) => ({ name, nameKey: keyOf(name), type })),
    );
    try {
        await ExpenseItem.insertMany(docs, { ordered: false });
    } catch (err) {
        // Two first requests racing: the unique index makes the loser's inserts fail harmlessly.
        if (!(typeof err === "object" && err !== null && "code" in err && err.code === 11000)) throw err;
    }
}

/** Defaults first, then anything added later — i.e. creation order. */
export async function listItems(): Promise<ExpenseItemDTO[]> {
    await ensureDefaultItems();
    return (await ExpenseItem.find().sort({ _id: 1 })).map(toItemDTO);
}

export async function createItem(input: CreateExpenseItemInput): Promise<ExpenseItemDTO> {
    const nameKey = keyOf(input.name);
    const existing = await ExpenseItem.findOne({ type: input.type, nameKey });
    if (existing) {
        throw ApiError.conflict(`"${existing.name}" already exists under ${input.type} expenses`, {
            name: "This item already exists",
        });
    }
    return toItemDTO(await ExpenseItem.create({ name: input.name, nameKey, type: input.type }));
}

export async function updateItem(id: string, input: UpdateExpenseItemInput): Promise<ExpenseItemDTO> {
    if (!isValidObjectId(id)) throw ApiError.notFound("Item not found");
    const item = await ExpenseItem.findById(id);
    if (!item) throw ApiError.notFound("Item not found");
    if (input.name !== undefined) {
        const nameKey = keyOf(input.name);
        const clash = await ExpenseItem.findOne({ type: item.type, nameKey, _id: { $ne: item._id } });
        if (clash) throw ApiError.conflict(`"${clash.name}" already exists`, { name: "This item already exists" });
        item.name = input.name;
        item.nameKey = nameKey;
    }
    if (input.active !== undefined) item.active = input.active;
    await item.save();
    return toItemDTO(item);
}

/** A head with entries can't be deleted (it would orphan history) — archive it instead. */
export async function deleteItem(id: string): Promise<void> {
    if (!isValidObjectId(id)) throw ApiError.notFound("Item not found");
    if (await Expense.exists({ itemId: id })) {
        throw ApiError.conflict("This item has expenses recorded. Archive it instead of deleting.");
    }
    const res = await ExpenseItem.findByIdAndDelete(id);
    if (!res) throw ApiError.notFound("Item not found");
}

// ---- entries ------------------------------------------------------------------------------------

async function assertItem(itemId: string) {
    if (!(await ExpenseItem.exists({ _id: itemId }))) {
        throw ApiError.badRequest("Unknown expense item", { itemId: "Pick an item from the list" });
    }
}

export async function listExpenses(month: string): Promise<ExpenseDTO[]> {
    return (await Expense.find({ month }).sort({ date: 1, _id: 1 })).map(toExpenseDTO);
}

export async function createExpense(input: CreateExpenseInput): Promise<ExpenseDTO> {
    await assertItem(input.itemId);
    const created = await Expense.create({
        date: input.date,
        month: input.date.slice(0, 7),
        itemId: input.itemId,
        amount: input.amount,
        note: input.note ?? "",
    });
    return toExpenseDTO(created);
}

/** Save many entries in one go. Every item must exist or nothing is saved. */
export async function createExpenses(inputs: CreateExpenseInput[]): Promise<ExpenseDTO[]> {
    const ids = [...new Set(inputs.map((i) => i.itemId))];
    if ((await ExpenseItem.countDocuments({ _id: { $in: ids } })) !== ids.length) {
        throw ApiError.badRequest("One or more items no longer exist", { entries: "Refresh and try again" });
    }
    const created = await Expense.insertMany(
        inputs.map((i) => ({ date: i.date, month: i.date.slice(0, 7), itemId: i.itemId, amount: i.amount, note: i.note ?? "" })),
    );
    return created.map((e) => toExpenseDTO(e as unknown as ExpenseDoc));
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<ExpenseDTO> {
    if (!isValidObjectId(id)) throw ApiError.notFound("Expense not found");
    if (input.itemId) await assertItem(input.itemId);
    const set: Record<string, unknown> = { ...input };
    if (input.date) set.month = input.date.slice(0, 7);
    const updated = await Expense.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true });
    if (!updated) throw ApiError.notFound("Expense not found");
    return toExpenseDTO(updated);
}

export async function deleteExpense(id: string): Promise<void> {
    if (!isValidObjectId(id)) throw ApiError.notFound("Expense not found");
    if (!(await Expense.findByIdAndDelete(id))) throw ApiError.notFound("Expense not found");
}

/** Spending per item per month across a range — one row for each month × item that has any. */
export async function getTotals(from: string, to: string): Promise<ExpenseTotalDTO[]> {
    const rows = await Expense.aggregate<{ _id: { month: string; itemId: unknown }; total: number }>([
        { $match: { month: { $gte: from, $lte: to } } },
        { $group: { _id: { month: "$month", itemId: "$itemId" }, total: { $sum: "$amount" } } },
        { $sort: { "_id.month": 1 } },
    ]);
    return rows.map((r) => ({ month: r._id.month, itemId: String(r._id.itemId), total: r.total }));
}
