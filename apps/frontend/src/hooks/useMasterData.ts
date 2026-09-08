import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockService } from "@/mocks/mock-service";
import type {
  Category,
  Product,
  Warehouse,
  Supplier,
  ProductionUnit,
  User,
  ProductType,
} from "@/types";
import { toast } from "sonner";
import { INVENTORY_QUERY_KEYS } from "./useInventory";

export const MASTER_QUERY_KEYS = {
  categories: (type?: ProductType) => ["master", "categories", type] as const,
  products: (filters?: Record<string, unknown>) =>
    ["master", "products", filters] as const,
  warehouses: ["master", "warehouses"] as const,
  suppliers: ["master", "suppliers"] as const,
  productionUnits: ["master", "productionUnits"] as const,
  users: ["master", "users"] as const,
};

// CATEGORIES
export function useCategories(type?: ProductType) {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.categories(type),
    queryFn: () => mockService.getCategories(type),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Category, "id">) =>
      mockService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "categories"] });
      toast.success("Category created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Category>;
    }) => mockService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "categories"] });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      toast.success("Category updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// PRODUCTS
export function useProducts(params?: {
  type?: ProductType;
  categoryId?: string;
}) {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.products(params),
    queryFn: () => mockService.getProducts(params),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Product, "id">) =>
      mockService.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "products"] });
      toast.success("Product created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Product> }) =>
      mockService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "products"] });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      toast.success("Product updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master", "products"] });
      toast.success("Product deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// WAREHOUSES
export function useWarehouses() {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.warehouses,
    queryFn: () => mockService.getWarehouses(),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Warehouse, "id">) =>
      mockService.createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.warehouses });
      toast.success("Warehouse created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Warehouse>;
    }) => mockService.updateWarehouse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.warehouses });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      toast.success("Warehouse updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockService.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.warehouses });
      toast.success("Warehouse deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// SUPPLIERS
export function useSuppliers() {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.suppliers,
    queryFn: () => mockService.getSuppliers(),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Supplier, "id">) =>
      mockService.createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.suppliers });
      toast.success("Supplier created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Supplier>;
    }) => mockService.updateSupplier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.suppliers });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      toast.success("Supplier updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.suppliers });
      toast.success("Supplier deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// PRODUCTION UNITS
export function useProductionUnits() {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.productionUnits,
    queryFn: () => mockService.getProductionUnits(),
  });
}

export function useCreateProductionUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ProductionUnit, "id">) =>
      mockService.createProductionUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MASTER_QUERY_KEYS.productionUnits,
      });
      toast.success("Production unit created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProductionUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProductionUnit>;
    }) => mockService.updateProductionUnit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MASTER_QUERY_KEYS.productionUnits,
      });
      toast.success("Production unit updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProductionUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockService.deleteProductionUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MASTER_QUERY_KEYS.productionUnits,
      });
      toast.success("Production unit deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// USERS
export function useUsers() {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.users,
    queryFn: () => mockService.getUsers(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<User, "id">) => mockService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.users });
      toast.success("User registered successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<User> }) =>
      mockService.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.users });
      toast.success("User updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_QUERY_KEYS.users });
      toast.success("User deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
