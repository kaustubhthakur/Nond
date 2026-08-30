export interface WarehouseOptions {
  shelfCapacityOptions: number[];
  maxSubShelvesPerShelf: number;
  maxBoxesPerSubShelf: number;
  maxProductsPerBox: number;
}

export interface Warehouse {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  address: string | null;

  shelfCapacity: number;
  maxSubShelvesPerShelf: number;
  maxBoxesPerSubShelf: number;
  maxProductsPerBox: number;

  createdAt: string;
  updatedAt: string;
  shelvesUsed?: number;
  productsStored?: number;
}

export interface CreateWarehousePayload {
  storeId: string;
  name: string;
  description?: string;
  address?: string;
  shelfCapacity: number;
}

export interface UpdateWarehousePayload {
  name?: string;
  description?: string;
  address?: string;
}