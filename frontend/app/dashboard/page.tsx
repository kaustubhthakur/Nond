"use client";

import { useStore } from "@/context/StoreContext";
import { DashboardInventory } from "@/components/dashboard/DashboardInventory";

export default function DashboardPage() {
  const { store } = useStore();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
       

        {/* Inventory panel: nudged left of the page container */}
        <div className="max-w-xl -ml-2 sm:-ml-4">
          <DashboardInventory />
        </div>
      </div>
    </main>
  );
}