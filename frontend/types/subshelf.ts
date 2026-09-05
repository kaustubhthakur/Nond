export interface SubShelf {
  id: string;
  storeId: string;
  warehouseId: string;
  shelfId: string;
  name: string;
  description: string | null;
  maxBoxes: number;
  boxCount: number;
  productQuantity: number;
  capacity: number;
  availableCapacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubShelfProduct {
  id: string;
  storeId: string;
  warehouseId: string;
  shelfId: string;
  subShelfId: string;
  name: string;
  sku: string | null;
  logo: string | null;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetSubShelvesResponse {
  success: boolean;
  count: number;
  maxSubShelves: number;
  availableSubShelves: number;
  maxBoxesPerSubShelf: number;
  maxProductsPerSubShelf: number;
  subShelves: SubShelf[];
}

export interface GetSubShelfProductsResponse {
  success: boolean;
  count: number;
  capacity: number;
  productQuantity: number;
  products: SubShelfProduct[];
}