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

function formatCurrency(value: number | null | undefined) {
  return `₹${(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function safeFileNamePart(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}

type Column = { label: string; align?: "left" | "right" };

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
      const fileNameHint = `${safeFileNamePart(store.store_name)}_${MONTH_NAMES[month - 1]}_${year}.pdf`;
      await reportApi.downloadMonthlyReportPdf(store.id, year, month, fileNameHint);
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

  const growth = report?.growth.growthPercent ?? 0;
  const growthTone = growth > 0 ? "text-emerald-700" : growth < 0 ? "text-rust" : "text-ink/50";
  const growthArrow = growth > 0 ? "↑" : growth < 0 ? "↓" : "→";
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div>
        <h1 className="font-display italic text-2xl text-ink">Reports</h1>
        <p className="text-ink/60 text-sm mt-1">
          See how {store.store_name} performed each month, or download a full PDF report.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-b border-line py-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="report-month" className="eyebrow text-ink/50">
              Month
            </label>
            <select
              id="report-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="report-year" className="eyebrow text-ink/50">
              Year
            </label>
            <select
              id="report-year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 text-sm hover:bg-ink/90 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {loading && <Spinner className="text-paper" />}
            {loading ? "Loading…" : "View report"}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 border border-accent/40 text-accent px-4 py-2 text-sm hover:border-accent transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {downloading ? <Spinner className="text-accent" /> : <DownloadIcon />}
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
          {error}
        </div>
      )}

      {loading && !report && <ReportSkeleton />}

      {!loading && !report && !error && (
        <p className="text-ink/50 text-sm italic">
          Choose a month and year, then select "View report" to see the numbers.
        </p>
      )}

      {report && (
        <div className="space-y-10">
          <section>
            <p className="eyebrow text-ink/50">{monthLabel}</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
              <span className="font-display italic text-4xl sm:text-5xl text-ink tabular-nums">
                {formatCurrency(report.sales.totalRevenue)}
              </span>
              <span className="text-ink/50 text-sm">total revenue</span>
              <span className={`text-sm font-medium tabular-nums ${growthTone}`}>
                {growthArrow} {growth >= 0 ? "+" : ""}
                {growth}% vs last month
              </span>
            </div>

            <dl className="mt-6 flex flex-wrap divide-x divide-line border-t border-line pt-4">
              <LedgerItem label="Units purchased" value={report.purchases.totalUnitsBought.toLocaleString("en-IN")} />
              <LedgerItem label="Purchase cost" value={formatCurrency(report.purchases.totalPurchaseCost)} />
              <LedgerItem label="Units sold" value={report.sales.totalUnitsSold.toLocaleString("en-IN")} />
              <LedgerItem
                label="Profit"
                value={
                  report.sales.profitDataComplete
                    ? formatCurrency(report.sales.totalProfit)
                    : `${formatCurrency(report.sales.totalProfit)}*`
                }
              />
              <LedgerItem label="Stock available" value={`${report.stock.totalUnitsAvailable.toLocaleString("en-IN")} units`} />
            </dl>
            {!report.sales.profitDataComplete && (
              <p className="text-xs text-ink/40 mt-2">* Based on partial cost data for this period.</p>
            )}
          </section>

          <section>
            <h2 className="font-display italic text-lg text-ink mb-3">Products Purchased</h2>
            {report.purchases.items.length === 0 ? (
              <EmptyState message="No purchases recorded this month." />
            ) : (
              <ReportTable
                columns={[
                  { label: "Date" },
                  { label: "Product" },
                  { label: "Price", align: "right" },
                  { label: "Units", align: "right" },
                  { label: "Total cost", align: "right" },
                ]}
                rows={report.purchases.items.map((item) => [
                  formatDate(item.date),
                  item.productName,
                  formatCurrency(item.price),
                  item.quantity.toLocaleString("en-IN"),
                  formatCurrency(item.totalCost),
                ])}
              />
            )}
          </section>

          <section>
            <h2 className="font-display italic text-lg text-ink mb-3">Products Sold</h2>
            {report.sales.items.length === 0 ? (
              <EmptyState message="No sales recorded this month." />
            ) : (
              <ReportTable
                columns={[
                  { label: "Date" },
                  { label: "Product" },
                  { label: "Price", align: "right" },
                  { label: "Units", align: "right" },
                  { label: "Subtotal", align: "right" },
                  { label: "Profit", align: "right" },
                ]}
                rows={report.sales.items.map((item) => [
                  formatDate(item.date),
                  item.productName,
                  formatCurrency(item.price),
                  item.quantity.toLocaleString("en-IN"),
                  formatCurrency(item.subtotal),
                  item.profit !== null ? formatCurrency(item.profit) : "-",
                ])}
                cellTone={report.sales.items.map((item) => [
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  item.profit !== null && item.profit < 0 ? "text-rust" : undefined,
                ])}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function LedgerItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 first:pl-0 py-1">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="text-base text-ink mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-line px-4 py-6 text-center text-ink/50 text-sm italic">
      {message}
    </div>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
      aria-hidden="true"
    />
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5v8.25m0 0L4.75 6.5M8 9.75l3.25-3.25M2.5 12v1.5a1 1 0 001 1h9a1 1 0 001-1V12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-10 animate-pulse" aria-hidden="true">
      <div className="space-y-4">
        <div className="h-3 w-24 bg-ink/10" />
        <div className="h-10 w-64 bg-ink/10" />
        <div className="flex gap-6 border-t border-line pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-2.5 w-16 bg-ink/10" />
              <div className="h-4 w-20 bg-ink/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-40 bg-ink/10" />
        <div className="h-32 w-full bg-ink/5" />
      </div>
    </div>
  );
}

function ReportTable({
  columns,
  rows,
  cellTone,
}: {
  columns: Column[];
  rows: string[][];
  cellTone?: (string | undefined)[][];
}) {
  return (
    <div className="border border-line max-h-[420px] overflow-auto">
      <table className="w-full min-w-[560px] text-sm tabular-nums">
        <thead>
          <tr className="text-left text-ink/50">
            {columns.map((col) => (
              <th
                key={col.label}
                className={`sticky top-0 z-10 bg-paper px-3 py-2 font-normal text-xs border-b border-line ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 1 ? "bg-ink/[0.03]" : undefined}>
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={`px-3 py-2 border-b border-line/50 last:border-0 ${
                    columns[i]?.align === "right" ? "text-right" : "text-left"
                  } ${cellTone?.[idx]?.[i] ?? "text-ink/80"}`}
                >
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