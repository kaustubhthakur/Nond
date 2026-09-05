"use client";

import { useStore } from "@/context/StoreContext";
import { DashboardInventory } from "@/components/dashboard/DashboardInventory";

export default function DashboardPage() {
  const { store } = useStore();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top-left: inventory panel, medium size */}
          <div className="lg:col-span-1">
            <DashboardInventory />
          </div>

          {/* Remaining dashboard space — add more cards/widgets here */}
        </div>
      </div>
    </main>
  );
}