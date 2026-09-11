import type { MonthlyValuation } from "@/types/dashboardStats";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function InventoryValuationTable({
  monthly,
  currentMonthLabel,
  lastMonthLabel,
}: {
  monthly: MonthlyValuation[];
  currentMonthLabel: string;
  lastMonthLabel: string;
}) {
  const currentIndex = monthly.findIndex((m) => m.month === currentMonthLabel);
  const current = monthly[currentIndex];
  const last = monthly[currentIndex - 1];

  const hasLast = typeof last?.amount === "number" && last.amount > 0;
  const changePct = hasLast && current
    ? ((current.amount - last.amount) / last.amount) * 100
    : null;
  const isUp = (changePct ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-ink">Total Inventory Valuation</h3>
        <span className="text-xs text-ink/40">Amounts in ₹</span>
      </div>

      <div className="grid grid-cols-6 gap-px overflow-hidden rounded-lg border border-line bg-line text-center text-xs">
        {monthly.map((m) => {
          const isCurrent = m.month === currentMonthLabel;
          return (
            <div
              key={m.month}
              className={`px-2 py-3 ${isCurrent ? "bg-ink/[0.04]" : "bg-paper"}`}
            >
              <div className={isCurrent ? "font-semibold text-ink" : "font-medium text-ink/50"}>
                {m.month}
              </div>
              <div
                className={`mt-1 font-mono tabular-nums ${
                  isCurrent ? "font-semibold text-ink" : "text-ink/70"
                }`}
              >
                {m.amount ? formatINR(m.amount) : "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <div className="space-y-1 text-ink/70">
          <div>
            Current Month ({currentMonthLabel}):{" "}
            <span className="font-mono font-semibold tabular-nums text-ink">
              {current ? formatINR(current.amount) : "—"}
            </span>
          </div>
          <div>
            Last Month ({lastMonthLabel}):{" "}
            <span className="font-mono font-semibold tabular-nums text-ink">
              {hasLast ? formatINR(last.amount) : "—"}
            </span>
          </div>
        </div>

        {changePct !== null && (
          <span
            className={`font-mono text-sm tabular-nums ${
              isUp ? "text-[#146449]" : "text-[#9A3324]"
            }`}
          >
            {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}