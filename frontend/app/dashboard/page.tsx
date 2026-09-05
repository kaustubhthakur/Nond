"use client";

import { useStore } from "@/context/StoreContext";
import { DashboardInventory } from "@/components/dashboard/DashboardInventory";
import { TopSellingChartSection } from "@/components/dashboard/TopSellingChartSection";

export default function DashboardPage() {
  const { store } = useStore();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
       

        <div className="max-w-xl -ml-2 sm:-ml-4 space-y-6">
          <DashboardInventory />
          <TopSellingChartSection />
        </div>
      </div>
    </main>
  );
}