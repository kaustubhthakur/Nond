import type { MonthlyValuation } from "@/types/dashboardStats";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "April", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec",
];

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}


function formatINRCompact(amount: number) {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(1)}k`;
  return formatINR(amount);
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
  const currentYear = new Date().getFullYear();

  const withYear = monthly.map((m) => ({
    ...m,
    year: (m as MonthlyValuation & { year?: number }).year ?? currentYear,
  }));

  const years = Array.from(new Set(withYear.map((m) => m.year))).sort((a, b) => b - a);
  if (years.length === 0) years.push(currentYear);

  const getAmount = (year: number, month: string) =>
    withYear.find((m) => m.year === year && m.month === month)?.amount;

  const current = getAmount(currentYear, currentMonthLabel);
  const last = getAmount(currentYear, lastMonthLabel);
  const hasLast = typeof last === "number" && last > 0;
  const changePct =
    hasLast && typeof current === "number" ? ((current - last) / last) * 100 : null;
  const isUp = (changePct ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-ink">Total Inventory Valuation</h3>
        <span className="text-xs text-ink/40">Amounts in ₹</span>
      </div>

      <div className="space-y-4">
        {years.map((year) => (
          <div key={year}>
            <div className="mb-2 text-xs font-medium text-ink/40">{year}</div>
            <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-line bg-line">
              {MONTH_LABELS.map((month) => {
                const amount = getAmount(year, month);
                const isCurrent = year === currentYear && month === currentMonthLabel;
                return (
                  <div
                    key={month}
                    title={typeof amount === "number" ? formatINR(amount) : undefined}
                    className={`px-1.5 py-3 text-center ${
                      isCurrent ? "bg-ink/[0.05]" : "bg-paper"
                    }`}
                  >
                    <div
                      className={`text-xs ${
                        isCurrent ? "font-semibold text-ink" : "font-medium text-ink/50"
                      }`}
                    >
                      {month}
                    </div>
                    <div
                      className={`mt-1 truncate font-mono text-xs tabular-nums leading-tight ${
                        isCurrent
                          ? "font-semibold text-ink"
                          : amount
                          ? "text-ink/70"
                          : "text-ink/30"
                      }`}
                    >
                      {typeof amount === "number" ? formatINRCompact(amount) : "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <div className="space-y-1 text-ink/70">
          <div>
            Current Month ({currentMonthLabel}):{" "}
            <span className="font-mono font-semibold tabular-nums text-ink">
              {typeof current === "number" ? formatINR(current) : "—"}
            </span>
          </div>
          <div>
            Last Month ({lastMonthLabel}):{" "}
            <span className="font-mono font-semibold tabular-nums text-ink">
              {hasLast ? formatINR(last as number) : "—"}
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