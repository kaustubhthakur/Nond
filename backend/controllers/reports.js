const PDFDocument = require("pdfkit");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const Report = require("../models/Report");
const Store = require("../models/Store");

const getStoreForUser = async (userId, storeId) => {
  return await Store.getStoreById(storeId, userId);
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const validatePeriod = (year, month) => {
  const y = Number(year);
  const m = Number(month);

  if (!Number.isInteger(y) || y < 2000 || y > 3000) {
    return { error: "A valid year query param is required (e.g. ?year=2026)" };
  }
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    return { error: "A valid month query param (1-12) is required (e.g. &month=9)" };
  }

  return { year: y, month: m };
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;
    const { year, month } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    const store = await getStoreForUser(userId, storeId);
    if (!store) {
      return res.status(403).json({ error: "You do not have access to this store" });
    }

    const period = validatePeriod(year, month);
    if (period.error) {
      return res.status(400).json({ error: period.error });
    }

    const report = await Report.generateMonthlyReport({
      storeId,
      year: period.year,
      month: period.month,
    });

    return res.status(200).json({ success: true, report });
  } catch (err) {
    console.error("Get monthly report error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate report" });
  }
};

// ---------------------------------------------------------------------------
// PDF export
// ---------------------------------------------------------------------------

async function fetchLogoBuffer(logoUrl) {
  if (!logoUrl) return null;

  try {
    if (/^https?:\/\//i.test(logoUrl)) {
      const response = await axios.get(logoUrl, {
        responseType: "arraybuffer",
        timeout: 8000,
      });
      return Buffer.from(response.data);
    }

    // Relative path served by express.static (e.g. "/uploads/store-logos/xxx.jpg").
    // Read it straight off disk instead of round-tripping over HTTP to ourselves.
    const localPath = path.join(__dirname, "..", logoUrl);
    return await fs.promises.readFile(localPath);
  } catch (err) {
    console.error("Failed to load store logo:", err.message);
    return null;
  }
}

const formatCurrency = (value) => `Rs. ${(Number(value) || 0).toFixed(2)}`;

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function drawTableHeader(doc, x, y, columns, fontSize = 9) {
  doc.font("Helvetica-Bold").fontSize(fontSize).fillColor("#000000");
  columns.forEach((col) => {
    doc.text(col.label, x + col.x, y, { width: col.width, align: col.align || "left" });
  });
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  doc.moveTo(x, y + 14).lineTo(x + totalWidth, y + 14).stroke();
  doc.font("Helvetica").fontSize(fontSize);
}

function drawTableRow(doc, x, y, columns, row, fontSize = 9) {
  doc.font("Helvetica").fontSize(fontSize);
  columns.forEach((col) => {
    doc.text(String(row[col.key] ?? "-"), x + col.x, y, { width: col.width, align: col.align || "left" });
  });
}

exports.downloadMonthlyReportPdf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;
    const { year, month } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    const store = await getStoreForUser(userId, storeId);
    if (!store) {
      return res.status(403).json({ error: "You do not have access to this store" });
    }

    const period = validatePeriod(year, month);
    if (period.error) {
      return res.status(400).json({ error: period.error });
    }

    const { year: y, month: m } = period;

    const report = await Report.generateMonthlyReport({ storeId, year: y, month: m });

    // Adjust these field names if your Store model differs.
    const logoBuffer = await fetchLogoBuffer(store.logo_url);

    const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;
    const safeStoreName = (store.store_name || "store").replace(/[^a-z0-9]/gi, "_");
    const fileName = `${safeStoreName}_report_${y}_${String(m).padStart(2, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    const left = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const bottomLimit = doc.page.height - doc.page.margins.bottom;

    // ---- Header: logo + store name + period ----
    const headerY = doc.y;
    const textX = left + (logoBuffer ? 65 : 0);

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, left, headerY, { fit: [50, 50] });
      } catch (err) {
        console.error("Failed to embed logo image:", err.message);
      }
    }

    doc.font("Helvetica-Bold").fontSize(18).text(store.store_name || "Store", textX, headerY);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#555555")
      .text(`Monthly Report - ${monthLabel}`, textX, doc.y + 2);

    doc.fillColor("#000000");
    doc.y = headerY + 60;
    doc.moveTo(left, doc.y).lineTo(left + pageWidth, doc.y).stroke();
    doc.moveDown(1);

    // ---- Summary ----
    doc.font("Helvetica-Bold").fontSize(13).text("Summary");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10);

    const profitLine = report.sales.profitDataComplete
      ? formatCurrency(report.sales.totalProfit)
      : `${formatCurrency(report.sales.totalProfit)} (incomplete cost data)`;

    const growthSign = report.growth.growthPercent >= 0 ? "+" : "";

    const summaryLines = [
      ["Total units purchased", report.purchases.totalUnitsBought],
      ["Total purchase cost", formatCurrency(report.purchases.totalPurchaseCost)],
      ["Total units sold", report.sales.totalUnitsSold],
      ["Total revenue", formatCurrency(report.sales.totalRevenue)],
      ["Total profit", profitLine],
      ["Sales growth vs previous month", `${growthSign}${report.growth.growthPercent}%`],
      ["Current stock available", `${report.stock.totalUnitsAvailable} units`],
    ];

    summaryLines.forEach(([label, value]) => {
      doc.font("Helvetica").text(`${label}: `, { continued: true });
      doc.font("Helvetica-Bold").text(String(value));
    });

    doc.moveDown(1.5);

    // ---- Purchases table ----
    doc.font("Helvetica-Bold").fontSize(13).text("Products Purchased");
    doc.moveDown(0.5);

    const purchaseColumns = [
      { key: "date", label: "Bought On", x: 0, width: 80 },
      { key: "productName", label: "Product", x: 80, width: 145 },
      { key: "buyingPrice", label: "Buying Price", x: 225, width: 80, align: "right" },
      { key: "quantity", label: "Units", x: 305, width: 55, align: "right" },
      { key: "totalCost", label: "Total Cost", x: 360, width: 90, align: "right" },
    ];

    if (report.purchases.items.length === 0) {
      doc.font("Helvetica").fontSize(9).fillColor("#777777").text("No purchases recorded this month.");
      doc.fillColor("#000000");
      doc.moveDown(1);
    } else {
      let rowY = doc.y;
      drawTableHeader(doc, left, rowY, purchaseColumns);
      rowY += 20;

      report.purchases.items.forEach((item) => {
        if (rowY > bottomLimit - 40) {
          doc.addPage();
          rowY = doc.page.margins.top;
          drawTableHeader(doc, left, rowY, purchaseColumns);
          rowY += 20;
        }

        drawTableRow(doc, left, rowY, purchaseColumns, {
          date: formatDate(item.boughtAt || item.date),
          productName: item.productName,
          buyingPrice: formatCurrency(item.buyingPrice ?? item.price),
          quantity: item.quantity,
          totalCost: formatCurrency(item.totalCost),
        });
        rowY += 18;
      });

      doc.y = rowY + 10;
    }

    // ---- Sales table ----
    if (doc.y > bottomLimit - 100) {
      doc.addPage();
    }

    doc.font("Helvetica-Bold").fontSize(13).text("Products Sold");
    doc.moveDown(0.5);

    const saleFontSize = 8;

    const saleColumns = [
      { key: "soldOn", label: "Sold On", x: 0, width: 60 },
      { key: "boughtOn", label: "Bought On", x: 60, width: 60 },
      { key: "productName", label: "Product", x: 120, width: 100 },
      { key: "buyingPrice", label: "Buy Price", x: 220, width: 55, align: "right" },
      { key: "sellingPrice", label: "Sell Price", x: 275, width: 55, align: "right" },
      { key: "quantity", label: "Units", x: 330, width: 35, align: "right" },
      { key: "subtotal", label: "Subtotal", x: 365, width: 65, align: "right" },
      { key: "profit", label: "Profit", x: 430, width: 65, align: "right" },
    ];

    if (report.sales.items.length === 0) {
      doc.font("Helvetica").fontSize(9).fillColor("#777777").text("No sales recorded this month.");
      doc.fillColor("#000000");
    } else {
      let rowY = doc.y;
      drawTableHeader(doc, left, rowY, saleColumns, saleFontSize);
      rowY += 18;

      report.sales.items.forEach((item) => {
        if (rowY > bottomLimit - 40) {
          doc.addPage();
          rowY = doc.page.margins.top;
          drawTableHeader(doc, left, rowY, saleColumns, saleFontSize);
          rowY += 18;
        }

        drawTableRow(doc, left, rowY, saleColumns, {
          soldOn: formatDateTime(item.soldAt || item.date),
          boughtOn: formatDateTime(item.boughtAt),
          productName: item.productName,
          buyingPrice:
            item.buyingPrice !== null && item.buyingPrice !== undefined
              ? formatCurrency(item.buyingPrice)
              : "-",
          sellingPrice: formatCurrency(item.sellingPrice ?? item.price),
          quantity: item.quantity,
          subtotal: formatCurrency(item.subtotal),
          profit:
            item.profit !== null && item.profit !== undefined
              ? formatCurrency(item.profit)
              : "-",
        }, saleFontSize);
        rowY += 16;
      });

      doc.y = rowY + 10;
    }

    // ---- Footer ----
    doc.moveDown(2);
    doc
      .font("Helvetica-Oblique")
      .fontSize(8)
      .fillColor("#999999")
      .text(`Generated on ${new Date().toLocaleString("en-IN")}`, { align: "right" });

    doc.end();
  } catch (err) {
    console.error("Download monthly report PDF error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Failed to generate PDF report" });
    } else {
      res.end();
    }
  }
};