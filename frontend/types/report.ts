export interface ReportPurchaseItem {
  date: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  price: number;
  quantity: number;
  totalCost: number;
  level: "shelf" | "subShelf" | "box";
  warehouseId: string | null;
}

export interface ReportSaleItem {
  date: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  profit: number | null;
}

export interface ReportShelfStock {
  id: string;
  name: string;
  productQuantity: number;
  capacity: number;
}

export interface ReportWarehouseStock {
  id: string;
  name: string;
  productQuantity: number;
  shelves: ReportShelfStock[];
}

export interface MonthlyReport {
  storeId: string;
  period: {
    year: number;
    month: number;
    start: string;
    end: string;
  };
  purchases: {
    items: ReportPurchaseItem[];
    totalUnitsBought: number;
    totalPurchaseCost: number;
  };
  sales: {
    items: ReportSaleItem[];
    totalUnitsSold: number;
    totalRevenue: number;
    totalProfit: number;
    profitDataComplete: boolean;
  };
  growth: {
    previousMonthRevenue: number;
    currentMonthRevenue: number;
    growthPercent: number;
  };
  stock: {
    totalUnitsAvailable: number;
    warehouses: ReportWarehouseStock[];
  };
  generatedAt: string;
}