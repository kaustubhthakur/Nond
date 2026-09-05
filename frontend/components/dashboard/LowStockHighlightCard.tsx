import { Bell } from "lucide-react";
import { StatCard } from "./StatCard";
import type { LowStockItem } from "@/types/dashboardStats";

export function LowStockHighlightCard({ item }: { item: LowStockItem | null }) {
  return (
    <StatCard icon={<Bell className="h-4 w-4" />} title="Low stock Alert">
      {item ? (
        <div className="text-sm font-medium text-red-600">
          {item.productName} — qty: {item.quantity}
        </div>
      ) : (
        <div className="text-sm text-ink/40">All stock levels healthy</div>
      )}
    </StatCard>
  );
}