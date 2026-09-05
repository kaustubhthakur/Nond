import { Tag } from "lucide-react";
import { StatCard } from "./StatCard";

export function TotalSalesCard({ amount, deltaPct }: { amount: number; deltaPct: number }) {
  const positive = deltaPct >= 0;
  return (
    <StatCard icon={<Tag className="h-4 w-4" />} title="Total Sales">
      <div className="text-2xl font-semibold text-ink">${amount.toLocaleString()}</div>
      <div className={`mt-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-red-600"}`}>
        {positive ? "+" : ""}
        {deltaPct}% than last month
      </div>
    </StatCard>
  );
}