import { TotalSalesCard } from "./TotalSalesCard";
import { LowStockHighlightCard } from "./LowStockHighlightCard";
import { HighestSellingCard } from "./HighestSellingCard";
import type { DashboardStats } from "@/types/dashboardStats";

export function StatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <TotalSalesCard amount={stats.totalSales} deltaPct={stats.totalSalesDeltaPct} />
      <LowStockHighlightCard item={stats.lowStockTopItem} />
      <HighestSellingCard productName={stats.highestSellingProduct} />
    </div>
  );
}