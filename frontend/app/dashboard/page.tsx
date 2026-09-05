"use client";

import { useStore } from "@/context/StoreContext";
import { DashboardInventory } from "@/components/dashboard/DashboardInventory";
import { TopSellingChartSection } from "@/components/dashboard/TopSellingChartSection";
import { InventoryValuationSection } from "@/components/dashboard/InventoryValuationSection";
import { LowStockAlertSection } from "@/components/dashboard/LowStockAlertSection";
import { LowStockHighlightSection } from "@/components/dashboard/LowStockHighlightSection";

export default function DashboardPage() {
  const { store } = useStore();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
          <div className="border-b border-line px-6 py-6 text-center">
            <h1 className="text-xl font-semibold tracking-wide text-ink">{store?.store_name ?? "Dashboard"}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DashboardInventory />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TopSellingChartSection />
        <div className="grid grid-cols-1 gap-6">
  <LowStockHighlightSection />
  <LowStockHighlightSection />
</div>
           
            </div>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <LowStockAlertSection />
            <InventoryValuationSection />
          </div>
        </div>
      </div>
    </main>
  );
}