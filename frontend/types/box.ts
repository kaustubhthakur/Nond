export interface Box {
  id: string;
  storeId: string;
  warehouseId: string;
  shelfId: string;
  subShelfId: string;
  name: string;
  description: string | null;
  capacity: number;
  productQuantity: number;
  availableCapacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoxProduct {
  id: string;
  storeId: string;
  warehouseId: string;
  shelfId: string;
  subShelfId: string;
  boxId: string;
  name: string;
  sku: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetBoxesResponse {
  success: boolean;
  count: number;
  maxBoxes: number;
  availableBoxes: number;
  productsPerBox: number;
  boxes: Box[];
}

export interface GetBoxProductsResponse {
  success: boolean;
  count: number;
  capacity: number;
  productQuantity: number;
  products: BoxProduct[];
}