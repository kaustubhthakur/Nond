"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function toCsvValue(value: string | number) {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCsv(fileName: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers, ...rows].map((row) => row.map(toCsvValue).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
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

  // Guards against out-of-order responses when the period changes quickly
  // or the store is switched mid-request.
  const requestIdRef = useRef(0);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = defaultYear; y >= defaultYear - 4; y--) years.push(y);
    return years;
  }, [defaultYear]);

  const isFuturePeriod = useMemo(() => {
    const selected = year * 12 + month;
    const current = defaultYear * 12 + defaultMonth;
    return selected > current;
  }, [year, month, defaultYear, defaultMonth]);

  const loadReport = async (targetYear: number, targetMonth: number) => {
    if (!store) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getMonthlyReport(store.id, targetYear, targetMonth);
      if (requestId !== requestIdRef.current) return; // a newer request has since started
      setReport(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Couldn't load this report. Check your connection and try again.");
      setReport(null);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  // Reset and refetch whenever the store or period changes, so switching
  // stores never leaves a previous store's numbers on screen.
  useEffect(() => {
    setReport(null);
    setError(null);
    if (store) loadReport(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id, year, month]);

  const handleDownload = async () => {
    if (!store) return;
    setDownloading(true);
    setError(null);
    try {
      const fileNameHint = `${safeFileNamePart(store.store_name)}_${MONTH_NAMES[month - 1]}_${year}.pdf`;
      await reportApi.downloadMonthlyReportPdf(store.id, year, month, fileNameHint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate the PDF. Try again in a moment.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportCsv = () => {
    if (!report || !store) return;
    const rows = [
      ...report.purchases.items.map((item) => [
        "Purchase", formatDate(item.date), item.productName, item.price, item.quantity, item.totalCost,
      ]),
      ...report.sales.items.map((item) => [
        "Sale", formatDate(item.date), item.productName, item.price, item.quantity, item.subtotal,
      ]),
    ];
    downloadCsv(
      `${safeFileNamePart(store.store_name)}_${MONTH_NAMES[month - 1]}_${year}.csv`,
      ["Type", "Date", "Product", "Price", "Units", "Amount"],
      rows
    );
  };

  const shiftPeriod = (delta: number) => {
    const total = year * 12 + (month - 1) + delta;
    const nextYear = Math.floor(total / 12);
    const nextMonth = (total % 12) + 1;
    if (nextYear < defaultYear - 4) return;
    setYear(nextYear);
    setMonth(nextMonth);
  };

  if (!store) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-ink/60">Select or create a store to view reports.</p>
      </div>
    );
  }

  const busy = loading || downloading;
  const growth = report?.growth.growthPercent ?? 0;
  const growthTone = growth > 0 ? "text-emerald-700" : growth < 0 ? "text-rust" : "text-ink/50";
  const growthArrow = growth > 0 ? "↑" : growth < 0 ? "↓" : "→";
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const purchaseTotals = report
    ? [
        report.purchases.items.reduce((sum, i) => sum + i.quantity, 0).toLocaleString("en-IN"),
        formatCurrency(report.purchases.items.reduce((sum, i) => sum + i.totalCost, 0)),
      ]
    : null;

  const saleTotals = report
    ? [
        report.sales.items.reduce((sum, i) => sum + i.quantity, 0).toLocaleString("en-IN"),
        formatCurrency(report.sales.items.reduce((sum, i) => sum + i.subtotal, 0)),
        formatCurrency(report.sales.items.reduce((sum, i) => sum + (i.profit ?? 0), 0)),
      ]
    : null;

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
          <button
            type="button"
            onClick={() => shiftPeriod(-1)}
            disabled={busy}
            aria-label="Previous month"
            className="h-9 w-9 flex items-center justify-center border border-line text-ink/60 hover:text-ink hover:border-ink/30 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <ChevronIcon direction="left" />
          </button>

          <div className="flex flex-col gap-1">
            <label htmlFor="report-month" className="text-xs text-ink/50">
              Month
            </label>
            <select
              id="report-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              disabled={busy}
              className="border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="report-year" className="text-xs text-ink/50">
              Year
            </label>
            <select
              id="report-year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={busy}
              className="border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
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
            onClick={() => shiftPeriod(1)}
            disabled={busy || isFuturePeriod}
            aria-label="Next month"
            className="h-9 w-9 flex items-center justify-center border border-line text-ink/60 hover:text-ink hover:border-ink/30 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>

        <div className="flex items-end gap-3">
          {report && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={busy}
              className="inline-flex items-center gap-2 border border-line text-ink/70 px-4 py-2 text-sm hover:border-ink/30 hover:text-ink transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Export CSV
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={busy}
            className="inline-flex items-center gap-2 border border-accent/40 text-accent px-4 py-2 text-sm hover:border-accent transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {downloading ? <Spinner className="text-accent" /> : <DownloadIcon />}
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {loading ? `Loading report for ${monthLabel}` : error ? error : report ? `Report loaded for ${monthLabel}` : ""}
      </div>

      {error && (
        <div className="flex items-start justify-between gap-4 border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadReport(year, month)}
            className="shrink-0 underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !report && <ReportSkeleton />}

      {!loading && !report && !error && (
        <p className="text-ink/50 text-sm italic">No report data for {monthLabel} yet.</p>
      )}

      {report && (
        <div className="space-y-10" aria-busy={loading}>
          <section>
            <p className="text-xs text-ink/50">{monthLabel}</p>
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
                totalsRow={purchaseTotals ? ["", "Total", "", purchaseTotals[0], purchaseTotals[1]] : undefined}
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
                totalsRow={
                  saleTotals ? ["", "Total", "", saleTotals[0], saleTotals[1], saleTotals[2]] : undefined
                }
                scrollable
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

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M10 3.5L5.5 8l4.5 4.5" : "M6 3.5L10.5 8L6 12.5"}
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
  totalsRow,
  scrollable = false,
}: {
  columns: Column[];
  rows: string[][];
  cellTone?: (string | undefined)[][];
  totalsRow?: string[];
  scrollable?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  const updateFade = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowFade(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  };

  useEffect(() => {
    if (!scrollable) return;
    updateFade();
    window.addEventListener("resize", updateFade);
    return () => window.removeEventListener("resize", updateFade);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollable, rows.length]);

  return (
    <div className="relative">
      <div
        ref={scrollable ? scrollRef : undefined}
        onScroll={scrollable ? updateFade : undefined}
        className={`border border-line overflow-x-auto ${
          scrollable
            ? "max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-ink/15 [&::-webkit-scrollbar-thumb]:hover:bg-ink/30 [scrollbar-width:thin]"
            : ""
        }`}
      >
        <table className="w-full min-w-[560px] text-sm tabular-nums">
          <thead>
            <tr className="text-left text-ink/50">
              {columns.map((col) => (
                <th
                  key={col.label}
                  className={`${scrollable ? "sticky top-0 z-10" : ""} bg-paper px-3 py-2 font-normal text-xs border-b border-line ${
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
          {totalsRow && (
            <tfoot>
              <tr className={`font-medium text-ink ${scrollable ? "sticky bottom-0" : ""} bg-paper`}>
                {totalsRow.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2 border-t border-line ${
                      columns[i]?.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {scrollable && showFade && (
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-paper to-transparent" />
      )}
    </div>
  );
}