"use client";

import { useStore } from "@/context/StoreContext";
import { DashboardInventory } from "@/components/dashboard/DashboardInventory";
import { TopSellingChartSection } from "@/components/dashboard/TopSellingChartSection";
import { LowStockAlertSection } from "@/components/dashboard/LowStockAlertSection";

export default function DashboardPage() {
  const { store } = useStore();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DashboardInventory />
            <TopSellingChartSection />
          </div>

          <div className="lg:col-span-1">
            <LowStockAlertSection />
          </div>
        </div>
      </div>
    </main>
  );
}