export interface SearchResultLocation {
  warehouseId: string;
  warehouseName: string | null;
  shelfId: string | null;
  shelfName: string | null;
  subShelfId: string | null;
  subShelfName: string | null;
  boxId: string | null;
  boxName: string | null;
}

export interface SearchResult {
  product: {
    id: string;
    name: string | null;
    sku: string | null;
    quantity: number;
  };
  location: SearchResultLocation;
  path: string;
}

export interface SearchProductsResponse {
  success: boolean;
  count: number;
  query: string;
  results: SearchResult[];
}