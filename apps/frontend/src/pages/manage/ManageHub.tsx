import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useProducts,
  useCreateProduct,
  useDeleteProduct,
  useWarehouses,
  useCreateWarehouse,
  useDeleteWarehouse,
  useSuppliers,
  useCreateSupplier,
  useDeleteSupplier,
  useProductionUnits,
  useCreateProductionUnit,
  useDeleteProductionUnit,
  useUsers,
  useCreateUser,
  useDeleteUser,
} from "@/hooks/useMasterData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Layers,
  Package,
  Building2,
  Truck,
  Factory,
  Users,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCategorySchema,
  createProductSchema,
  createWarehouseSchema,
  createSupplierSchema,
  createProductionUnitSchema,
  createUserSchema,
  type CreateCategoryInput,
  type CreateProductInput,
  type CreateWarehouseInput,
  type CreateSupplierInput,
  type CreateProductionUnitInput,
  type CreateUserInput,
} from "@/schemas/manage.schema";

const PASTEL_COLORS = [
  "#C1A3C3", // Lavender
  "#FFCBA4", // Peach
  "#A0C4FF", // Sky
  "#FFB6A1", // Coral
  "#D1E6B1", // Green
  "#FFC0CB", // Pink
  "#FFD580", // Yellow
  "#99D6D0", // Teal
];

type ManageTab =
  | "categories"
  | "products"
  | "warehouses"
  | "suppliers"
  | "productionUnits"
  | "users";

export function ManageHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get("tab") as ManageTab) || "categories";
  const [activeTab, setActiveTab] = useState<ManageTab>(currentTab);

  // Dialog states
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [whDialogOpen, setWhDialogOpen] = useState(false);
  const [supDialogOpen, setSupDialogOpen] = useState(false);
  const [puDialogOpen, setPuDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  // Queries
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: products = [], isLoading: prodLoading } = useProducts();
  const { data: warehouses = [], isLoading: whLoading } = useWarehouses();
  const { data: suppliers = [], isLoading: supLoading } = useSuppliers();
  const { data: productionUnits = [], isLoading: puLoading } =
    useProductionUnits();
  const { data: users = [], isLoading: userLoading } = useUsers();

  // Mutations
  const createCat = useCreateCategory();
  const deleteCat = useDeleteCategory();

  const createProd = useCreateProduct();
  const deleteProd = useDeleteProduct();

  const createWh = useCreateWarehouse();
  const deleteWh = useDeleteWarehouse();

  const createSup = useCreateSupplier();
  const deleteSup = useDeleteSupplier();

  const createPu = useCreateProductionUnit();
  const deletePu = useDeleteProductionUnit();

  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const handleTabSwitch = (tab: ManageTab) => {
    setActiveTab(tab);
    searchParams.set("tab", tab);
    setSearchParams(searchParams);
  };

  // Forms
  const catForm = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      title: "",
      description: "",
      tagColor: PASTEL_COLORS[0],
      type: "RawMaterial",
    },
  });

  const prodForm = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      skuCode: "",
      colorVariant: "",
      categoryId: "",
      unit: "Piece",
      type: "FinishedProduct",
    },
  });

  const whForm = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: "",
      description: "",
      tagColor: PASTEL_COLORS[2],
    },
  });

  const supForm = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      description: "",
      tagColor: PASTEL_COLORS[1],
    },
  });

  const puForm = useForm<CreateProductionUnitInput>({
    resolver: zodResolver(createProductionUnitSchema),
    defaultValues: {
      name: "",
      description: "",
      tagColor: PASTEL_COLORS[4],
    },
  });

  const userForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      phoneNumber: "",
      name: "",
      role: "user",
      passcode: "000000",
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Master Management Hub
        </h1>
        <p className="text-sm text-slate-500">
          Configure categories, catalog products, godowns, vendors, and factory units
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
        <button
          onClick={() => handleTabSwitch("categories")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === "categories"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:text-slate-900"
          }`}
        >
          <Layers className="h-4 w-4" />
          Categories ({categories.length})
        </button>

        <button
          onClick={() => handleTabSwitch("products")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === "products"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:text-slate-900"
          }`}
        >
          <Package className="h-4 w-4" />
          Catalog Models ({products.length})
        </button>

        <button
          onClick={() => handleTabSwitch("warehouses")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === "warehouses"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:text-slate-900"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Warehouses ({warehouses.length})
        </button>

        <button
          onClick={() => handleTabSwitch("suppliers")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === "suppliers"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:text-slate-900"
          }`}
        >
          <Truck className="h-4 w-4" />
          Suppliers ({suppliers.length})
        </button>

        <button
          onClick={() => handleTabSwitch("productionUnits")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === "productionUnits"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:text-slate-900"
          }`}
        >
          <Factory className="h-4 w-4" />
          Production Units ({productionUnits.length})
        </button>

        <button
          onClick={() => handleTabSwitch("users")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          Staff Users ({users.length})
        </button>
      </div>

      {/* TAB CONTENT 1: CATEGORIES */}
      {activeTab === "categories" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Classification Categories
              </CardTitle>
              <CardDescription className="text-xs">
                Color-coded categories with preset 8 pastel badges
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setCatDialogOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </CardHeader>
          <CardContent>
            {catLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 my-4" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-3">Title & Color</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <Badge colorHex={c.tagColor}>{c.title}</Badge>
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-slate-700">
                          {c.type === "RawMaterial"
                            ? "Raw Material"
                            : "Finished Product"}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500">
                          {c.description}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCat.mutate(c.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 2: PRODUCTS */}
      {activeTab === "products" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Catalog Models & Materials
              </CardTitle>
              <CardDescription className="text-xs">
                Master product specifications (Blaze, POSH, Seul, fabrics, trims)
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setProdDialogOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              New Catalog Model
            </Button>
          </CardHeader>
          <CardContent>
            {prodLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 my-4" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-3">Model Name</th>
                      <th className="py-2.5 px-3">Color Variant</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const cat = categories.find((c) => c.id === p.categoryId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {p.name}
                          </td>
                          <td className="py-3 px-3 text-xs font-medium text-slate-600">
                            {p.colorVariant || "—"}
                          </td>
                          <td className="py-3 px-3">
                            {cat && (
                              <Badge colorHex={cat.tagColor}>{cat.title}</Badge>
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs font-mono text-slate-600">
                            {p.unit}
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-500">
                            {p.type}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteProd.mutate(p.id)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 3: WAREHOUSES */}
      {activeTab === "warehouses" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Warehouses & Godowns
              </CardTitle>
              <CardDescription className="text-xs">
                Physical storage locations (Central Godown, Factory Godown)
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setWhDialogOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              New Warehouse
            </Button>
          </CardHeader>
          <CardContent>
            {whLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 my-4" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-3">Warehouse Name</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warehouses.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <Badge colorHex={w.tagColor}>{w.name}</Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500">
                          {w.description}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWh.mutate(w.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 4: SUPPLIERS */}
      {activeTab === "suppliers" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Suppliers & Material Vendors
              </CardTitle>
              <CardDescription className="text-xs">
                Fabric importers, zipper manufacturers, and trim distributors
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setSupDialogOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              New Supplier
            </Button>
          </CardHeader>
          <CardContent>
            {supLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 my-4" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-3">Supplier Name</th>
                      <th className="py-2.5 px-3">Specialty / Description</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <Badge colorHex={s.tagColor}>{s.name}</Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500">
                          {s.description}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSup.mutate(s.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 5: PRODUCTION UNITS */}
      {activeTab === "productionUnits" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Production Units & Stitching Contractors
              </CardTitle>
              <CardDescription className="text-xs">
                In-house factories and contractor job-work units (S A IMPEX, Parrys)
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setPuDialogOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              New Unit
            </Button>
          </CardHeader>
          <CardContent>
            {puLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 my-4" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-3">Unit Name</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productionUnits.map((pu) => (
                      <tr key={pu.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <Badge colorHex={pu.tagColor}>{pu.name}</Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500">
                          {pu.description}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePu.mutate(pu.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 6: USERS */}
      {activeTab === "users" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Enterprise Staff & Floor Operators
              </CardTitle>
              <CardDescription className="text-xs">
                Manage mobile login access and role authorizations
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setUserDialogOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              Register User
            </Button>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 my-4" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Phone Number</th>
                      <th className="py-2.5 px-3">System Role</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {u.name}
                        </td>
                        <td className="py-3 px-3 text-xs font-mono text-slate-700">
                          {u.phoneNumber}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              u.role === "admin" ? "default" : "secondary"
                            }
                            className="capitalize"
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser.mutate(u.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DIALOG: CREATE CATEGORY */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Classification Category</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={catForm.handleSubmit(async (data) => {
              await createCat.mutateAsync(data);
              catForm.reset();
              setCatDialogOpen(false);
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Category Title</Label>
              <Input
                placeholder="e.g. Airmesh or Backpacks"
                {...catForm.register("title")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Classification Type</Label>
              <Select {...catForm.register("type")}>
                <option value="RawMaterial">Raw Material</option>
                <option value="FinishedProduct">Finished Product</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Brief description"
                {...catForm.register("description")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Badge Preset Color</Label>
              <div className="flex gap-2 pt-1">
                {PASTEL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => catForm.setValue("tagColor", color)}
                    style={{ backgroundColor: color }}
                    className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer ${
                      catForm.watch("tagColor") === color
                        ? "border-slate-900 scale-110 shadow-sm"
                        : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREATE PRODUCT */}
      <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Catalog Model / Material</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={prodForm.handleSubmit(async (data) => {
              await createProd.mutateAsync(data);
              prodForm.reset();
              setProdDialogOpen(false);
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Product / Model Name</Label>
              <Input
                placeholder="e.g. Blaze-530 or China Fabric"
                {...prodForm.register("name")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Colorway Variant</Label>
                <Input
                  placeholder="e.g. V.RED, BLK, Olive"
                  {...prodForm.register("colorVariant")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unit Type</Label>
                <Select {...prodForm.register("unit")}>
                  <option value="Piece">Piece</option>
                  <option value="Metre">Metre</option>
                  <option value="Roll">Roll</option>
                  <option value="Packet">Packet</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select {...prodForm.register("categoryId")}>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Product Type</Label>
                <Select {...prodForm.register("type")}>
                  <option value="FinishedProduct">Finished Product</option>
                  <option value="RawMaterial">Raw Material</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProdDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Model</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREATE WAREHOUSE */}
      <Dialog open={whDialogOpen} onOpenChange={setWhDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Warehouse / Godown Facility</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={whForm.handleSubmit(async (data) => {
              await createWh.mutateAsync(data);
              whForm.reset();
              setWhDialogOpen(false);
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Facility Name</Label>
              <Input
                placeholder="e.g. Central Godown Parrys"
                {...whForm.register("name")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location / Description</Label>
              <Input
                placeholder="e.g. Parrys, Chennai"
                {...whForm.register("description")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWhDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Warehouse</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREATE SUPPLIER */}
      <Dialog open={supDialogOpen} onOpenChange={setSupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor / Supplier</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={supForm.handleSubmit(async (data) => {
              await createSup.mutateAsync(data);
              supForm.reset();
              setSupDialogOpen(false);
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Vendor / Company Name</Label>
              <Input
                placeholder="e.g. Janakson Zipper Co."
                {...supForm.register("name")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Material Category / Scope</Label>
              <Input
                placeholder="e.g. YKK zips, sliders"
                {...supForm.register("description")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSupDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Vendor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREATE PRODUCTION UNIT */}
      <Dialog open={puDialogOpen} onOpenChange={setPuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Production Unit / Stitching Contractor</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={puForm.handleSubmit(async (data) => {
              await createPu.mutateAsync(data);
              puForm.reset();
              setPuDialogOpen(false);
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Unit / Contractor Name</Label>
              <Input
                placeholder="e.g. S A IMPEX or Rani Parrys"
                {...puForm.register("name")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Facility Type / Scope</Label>
              <Input
                placeholder="e.g. In-house stitching line"
                {...puForm.register("description")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPuDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Production Unit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREATE USER */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Enterprise Staff User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={userForm.handleSubmit(async (data) => {
              await createUser.mutateAsync(data);
              userForm.reset();
              setUserDialogOpen(false);
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Staff Name" {...userForm.register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number (10 Digits)</Label>
              <Input
                placeholder="9876543210"
                maxLength={10}
                {...userForm.register("phoneNumber")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>System Role</Label>
                <Select {...userForm.register("role")}>
                  <option value="user">User (Staff Operator)</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>6-Digit Passcode</Label>
                <Input
                  type="password"
                  maxLength={6}
                  placeholder="000000"
                  {...userForm.register("passcode")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Register User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
