"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { reportApi } from "@/lib/reportApi";
import type { MonthlyReport } from "@/types/report";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatCurrency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReportsPage() {
  const { store } = useStore();
  const { year: defaultYear, month: defaultMonth } = useMemo(currentYearMonth, []);

  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = defaultYear; y >= defaultYear - 4; y--) years.push(y);
    return years;
  }, [defaultYear]);

  const loadReport = async () => {
    if (!store) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getMonthlyReport(store.id, year, month);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!store) return;
    setDownloading(true);
    setError(null);
    try {
      await reportApi.downloadMonthlyReportPdf(store.id, year, month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  if (!store) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-ink/60">Select or create a store to view reports.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display italic text-2xl text-ink">Reports</h1>
        <p className="text-ink/60 text-sm mt-1">
          View or download {store.store_name}&apos;s monthly performance.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="eyebrow text-ink/50">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-line bg-paper px-3 py-2 text-sm"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="eyebrow text-ink/50">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-line bg-paper px-3 py-2 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={loadReport}
          disabled={loading}
          className="eyebrow border border-ink/20 px-4 py-2 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
        >
          {loading ? "Loading…" : "View report"}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="eyebrow border border-accent/40 text-accent px-4 py-2 hover:border-accent transition-colors disabled:opacity-50"
        >
          {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>

      {error && <p className="text-rust text-sm">{error}</p>}

      {report && (
        <div className="space-y-8">
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <SummaryCard label="Units purchased" value={report.purchases.totalUnitsBought} />
            <SummaryCard label="Purchase cost" value={formatCurrency(report.purchases.totalPurchaseCost)} />
            <SummaryCard label="Units sold" value={report.sales.totalUnitsSold} />
            <SummaryCard label="Revenue" value={formatCurrency(report.sales.totalRevenue)} />
            <SummaryCard
              label="Profit"
              value={formatCurrency(report.sales.totalProfit)}
              hint={!report.sales.profitDataComplete ? "Some cost data missing" : undefined}
            />
            <SummaryCard
              label="Growth vs last month"
              value={`${report.growth.growthPercent >= 0 ? "+" : ""}${report.growth.growthPercent}%`}
            />
            <SummaryCard label="Stock available" value={`${report.stock.totalUnitsAvailable} units`} />
          </section>

          <section>
            <h2 className="font-display italic text-lg text-ink mb-3">Products Purchased</h2>
            {report.purchases.items.length === 0 ? (
              <p className="text-ink/50 text-sm">No purchases recorded this month.</p>
            ) : (
              <ReportTable
                columns={["Date", "Product", "Price", "Units", "Total cost"]}
                rows={report.purchases.items.map((item) => [
                  formatDate(item.date),
                  item.productName,
                  formatCurrency(item.price),
                  String(item.quantity),
                  formatCurrency(item.totalCost),
                ])}
              />
            )}
          </section>

          <section>
            <h2 className="font-display italic text-lg text-ink mb-3">Products Sold</h2>
            {report.sales.items.length === 0 ? (
              <p className="text-ink/50 text-sm">No sales recorded this month.</p>
            ) : (
              <ReportTable
                columns={["Date", "Product", "Price", "Units", "Subtotal", "Profit"]}
                rows={report.sales.items.map((item) => [
                  formatDate(item.date),
                  item.productName,
                  formatCurrency(item.price),
                  String(item.quantity),
                  formatCurrency(item.subtotal),
                  item.profit !== null ? formatCurrency(item.profit) : "-",
                ])}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border border-line p-4">
      <p className="eyebrow text-ink/50">{label}</p>
      <p className="text-xl font-display text-ink mt-1">{value}</p>
      {hint && <p className="text-xs text-rust mt-1">{hint}</p>}
    </div>
  );
}

function ReportTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink/50 eyebrow">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-normal">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-line/50 last:border-0">
              {row.map((cell, i) => (
                <td key={i} className="px-3 py-2 text-ink/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}