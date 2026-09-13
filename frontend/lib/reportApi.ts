import type { MonthlyReport } from "@/types/report";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

async function parseErrorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export const reportApi = {
  async getMonthlyReport(
    storeId: string,
    year: number,
    month: number
  ): Promise<MonthlyReport> {
    const res = await fetch(
      `${API_BASE_URL}/stores/${storeId}/reports/monthly?year=${year}&month=${month}`,
      { credentials: "include" }
    );

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Failed to load report"));
    }

    const data = await res.json();
    return data.report as MonthlyReport;
  },


  async downloadMonthlyReportPdf(
    storeId: string,
    year: number,
    month: number,
    fileNameHint?: string
  ): Promise<void> {
    const res = await fetch(
      `${API_BASE_URL}/stores/${storeId}/reports/monthly/pdf?year=${year}&month=${month}`,
      { credentials: "include" }
    );

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Failed to download report"));
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

  
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const fileName = match?.[1] || fileNameHint || `report_${year}_${String(month).padStart(2, "0")}.pdf`;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  },
};