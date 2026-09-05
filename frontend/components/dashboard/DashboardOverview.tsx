"use client";

import { useState } from "react";
import { GlobalSearch } from "@/components/inventory/GlobalSearch";
import { StockEntryModal } from "@/components/inventory/StockEntryModal";
import { StockExitModal } from "@/components/inventory/StockExitModal";
import { StatsRow } from "./StatsRow";
import { LowStockTable } from "./LowStockTable";
import { TopSellingPieChart } from "./TopSellingPieChart";
import { InventoryValuationTable } from "./InventoryValuationTable";
import { ProductInventoryTable, type InventoryRow } from "./ProductInventoryTable";
import { ProductHistoryModal } from "./ProductHistoryModal";
import type { DashboardStats } from "@/types/dashboardStats";

export function DashboardOverview({
  storeId,
  stats,
  rows,
}: {
  storeId: string;
  stats: DashboardStats;
  rows: InventoryRow[];
}) {
  const [addTarget, setAddTarget] = useState<InventoryRow | null>(null);
  const [sellTarget, setSellTarget] = useState<InventoryRow | null>(null);
  const [historyTarget, setHistoryTarget] = useState<InventoryRow | null>(null);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <GlobalSearch storeId={storeId} onSell={() => {}} />

      <StatsRow stats={stats} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ProductInventoryTable rows={rows} onAdd={setAddTarget} onSell={setSellTarget} onTrack={setHistoryTarget} />
        <LowStockTable items={stats.lowStockItems} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopSellingPieChart data={stats.topSelling} />
        <InventoryValuationTable monthly={stats.monthlyValuation} currentMonthLabel="Sept" lastMonthLabel="Aug" />
      </div>

      <StockEntryModal open={addTarget !== null} targetLabel={addTarget?.category ?? ""} onClose={() => setAddTarget(null)} onSubmit={async () => setAddTarget(null)} />
      <StockExitModal open={sellTarget !== null} productName={sellTarget?.category ?? ""} currentQuantity={sellTarget?.quantity ?? 0} onClose={() => setSellTarget(null)} onSubmit={async () => setSellTarget(null)} />
      <ProductHistoryModal open={historyTarget !== null} productName={historyTarget?.category ?? ""} history={[]} onClose={() => setHistoryTarget(null)} />
    </div>
  );
}