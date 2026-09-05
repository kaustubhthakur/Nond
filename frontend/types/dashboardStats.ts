export type LowStockItem = {
  productId: string;
  productName: string;
  quantity: number;
};

export type TopSellingSlice = {
  name: string;
  value: number;
  color?: string;
};

export type MonthlyValuation = {
  month: string; // "Jan", "Feb", ...
  amount: number;
};

export type DashboardStats = {
  totalSales: number;
  totalSalesDeltaPct: number;
  highestSellingProduct: string;
  lowStockTopItem: LowStockItem | null;
  lowStockItems: LowStockItem[];
  topSelling: TopSellingSlice[];
  monthlyValuation: MonthlyValuation[];
};