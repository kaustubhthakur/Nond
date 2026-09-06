import { TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import type { HighestSellingItem } from "@/types/dashboardStats";

export function HighestSellingHighlightCard({ item }: { item: HighestSellingItem | null }) {
  return (
    <StatCard icon={<TrendingUp className="h-4 w-4" />} title="Best Seller">
      {item ? (
        <div className="text-sm font-medium text-emerald-600">
          {item.productName} — sold: {item.quantitySold}
        </div>
      ) : (
        <div className="text-sm text-ink/40">No sales recorded yet</div>
      )}
    </StatCard>
  );
}