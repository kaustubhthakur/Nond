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
        <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
          <div className="border-b border-line px-6 py-6 text-center">
            <h1 className="text-xl font-semibold tracking-wide text-ink">{store?.store_name ?? "Dashboard"}</h1>
          </div>
        </div>

        <div className="-ml-2 sm:-ml-4 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="max-w-xl space-y-6">
            <DashboardInventory />
            <TopSellingChartSection />
          </div>

          <div className="w-full max-w-sm">
            <LowStockAlertSection />
          </div>
        </div>
      </div>
    </main>
  );
}