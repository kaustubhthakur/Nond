export interface Shelf {
  id: string;
  storeId: string;
  warehouseId: string;
  name: string;
  description: string | null;
  maxSubShelves: number;
  productQuantity: number;
  capacity: number;
  availableCapacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShelfOptions {
  maxSubShelves: number;
  maxProducts: number;
}

export interface CreateShelfPayload {
  name: string;
  description?: string;
}

export interface UpdateShelfPayload {
  name?: string;
  description?: string;
}

export interface ShelfProduct {
  id: string;
  productId: string;
  storeId: string;
  warehouseId: string;
  shelfId: string;
  logo: string | null;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddProductToShelfPayload {
  productId: string;
  logo?: string;
  price: number;
  quantity: number;
}