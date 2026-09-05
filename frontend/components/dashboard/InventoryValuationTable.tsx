import type { MonthlyValuation } from "@/types/dashboardStats";

export function InventoryValuationTable({
  monthly,
  currentMonthLabel,
  lastMonthLabel,
}: {
  monthly: MonthlyValuation[];
  currentMonthLabel: string;
  lastMonthLabel: string;
}) {
  const current = monthly.find((m) => m.month === currentMonthLabel);
  const last = monthly[monthly.findIndex((m) => m.month === currentMonthLabel) - 1];

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-ink">Total Inventory Valuation</h3>
      <div className="grid grid-cols-6 gap-px overflow-hidden rounded-lg border border-line bg-line text-center text-xs">
        {monthly.map((m) => (
          <div key={m.month} className="bg-paper px-2 py-3">
            <div className="font-medium text-ink/60">{m.month}</div>
            <div className="mt-1 font-semibold text-ink">{m.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1 text-sm text-ink/70">
        <div>Current Month ({currentMonthLabel}): <span className="font-semibold text-ink">{current?.amount.toLocaleString() ?? "—"}</span></div>
        <div>Last Month ({lastMonthLabel}): <span className="font-semibold text-ink">{last?.amount.toLocaleString() ?? "—"}</span></div>
      </div>
    </div>
  );
}