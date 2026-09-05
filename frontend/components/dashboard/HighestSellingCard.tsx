import { TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";

export function HighestSellingCard({ productName }: { productName: string }) {
  return (
    <StatCard icon={<TrendingUp className="h-4 w-4" />} title="Highest Selling Product">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
        {productName}
        <TrendingUp className="h-4 w-4" />
      </div>
    </StatCard>
  );
}