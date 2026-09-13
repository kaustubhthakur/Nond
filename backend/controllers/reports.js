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


const THEME = {
  colors: {
    band: "#16233A",        // header band background
    bandText: "#FFFFFF",
    bandSubtext: "#AEB9CC",
    text: "#1F2430",
    muted: "#6B7280",
    faint: "#9AA3AF",
    border: "#E3E6EA",
    tableHeaderBg: "#F3F4F6",
    tableHeaderText: "#374151",
    rowAlt: "#FAFAFB",
    positive: "#15803D",
    negative: "#B91C1C",
    accent: "#C1440E",
  },
  fonts: {
    regular: "Helvetica",
    bold: "Helvetica-Bold",
    italic: "Helvetica-Oblique",
  },
  page: { size: "A4", margin: 40 },
};

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

    const localPath = path.join(__dirname, "..", logoUrl);
    return await fs.promises.readFile(localPath);
  } catch (err) {
    console.error("Failed to load store logo:", err.message);
    return null;
  }
}

// Decimals default to 0: every value in this business is a round rupee amount,
// and keeping ".00" on every number was a big part of why cells overflowed.
// Pass { decimals: 2 } explicitly if a caller ever needs paise precision.
const formatCurrency = (value, { decimals = 0 } = {}) =>
  `Rs. ${(Number(value) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

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


const formatDateTimeCompact = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const timePart = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart}, ${timePart}`;
};


function drawTableHeader(doc, x, y, columns, fontSize = 9) {
  const { colors, fonts } = THEME;
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const rowHeight = fontSize + 10;

  doc.rect(x, y, totalWidth, rowHeight).fill(colors.tableHeaderBg);
  doc.font(fonts.bold).fontSize(fontSize).fillColor(colors.tableHeaderText);
  columns.forEach((col) => {
    doc.text(col.label, x + col.x + 6, y + 5, {
      width: col.width - 10,
      height: rowHeight - 4,
      align: col.align || "left",
      ellipsis: true,
    });
  });

  doc.fillColor(colors.text).font(fonts.regular).fontSize(fontSize);
  return rowHeight;
}

function drawTableRow(doc, x, y, columns, row, { fontSize = 9, striped = false, height, textColorKey } = {}) {
  const { colors, fonts } = THEME;
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const rowHeight = height || fontSize + 9;

  if (striped) {
    doc.rect(x, y, totalWidth, rowHeight).fill(colors.rowAlt);
  }

  doc.font(fonts.regular).fontSize(fontSize).fillColor(colors.text);
  columns.forEach((col) => {
    const cellColor = (textColorKey && row[`${col.key}Color`]) || null;
    doc.fillColor(cellColor || colors.text);
    // width + height + ellipsis keeps every cell to a single line: if a value is
    // still too long for its column it gets truncated with "…" instead of the
    // mid-number hard-wrap that was breaking row layout before.
    doc.text(String(row[col.key] ?? "-"), x + col.x + 6, y + 4, {
      width: col.width - 10,
      height: rowHeight - 6,
      align: col.align || "left",
      ellipsis: true,
    });
  });
  doc.fillColor(colors.text);

  return rowHeight;
}

function drawTotalsRow(doc, x, y, columns, totals, fontSize = 9) {
  const { colors, fonts } = THEME;
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const rowHeight = fontSize + 10;

  doc.moveTo(x, y).lineTo(x + totalWidth, y).lineWidth(1).strokeColor(colors.border).stroke();
  doc.font(fonts.bold).fontSize(fontSize).fillColor(colors.text);
  columns.forEach((col) => {
    const value = totals[col.key];
    if (value === undefined) return;
    doc.text(String(value), x + col.x + 6, y + 6, {
      width: col.width - 10,
      height: rowHeight,
      align: col.align || "left",
      ellipsis: true,
    });
  });
  doc.font(fonts.regular);

  return rowHeight + 6;
}


// Shrinks the value font (down to a floor) until it fits the card's width,
// instead of letting PDFKit hard-wrap a long currency figure mid-digit.
function fitSingleLineFontSize(doc, text, font, maxWidth, startSize, minSize = 9) {
  doc.font(font);
  let size = startSize;
  while (size > minSize && doc.fontSize(size).widthOfString(text) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function drawStatCard(doc, x, y, w, h, label, value, { valueColor } = {}) {
  const { colors, fonts } = THEME;
  const labelWidth = w - 20;
  doc.roundedRect(x, y, w, h, 4).fillAndStroke("#FFFFFF", colors.border);

  doc.font(fonts.regular).fontSize(8.5);
  const labelHeight = doc.heightOfString(label.toUpperCase(), { width: labelWidth, characterSpacing: 0.3 });

  doc
    .fillColor(colors.muted)
    .text(label.toUpperCase(), x + 10, y + 9, { width: labelWidth, characterSpacing: 0.3 });

  const valueFontSize = fitSingleLineFontSize(doc, value, fonts.bold, labelWidth, 15, 9);
  const valueY = y + 9 + labelHeight + 3;

  doc
    .font(fonts.bold)
    .fontSize(valueFontSize)
    .fillColor(valueColor || colors.text)
    .text(value, x + 10, valueY, {
      width: labelWidth,
      height: Math.max(h - (valueY - y) - 4, valueFontSize + 2),
      ellipsis: true,
    });
}


function ensureSpace(doc, needed, bottomLimit) {
  if (doc.y + needed > bottomLimit) {
    doc.addPage();
    doc.y = doc.page.margins.top;
    return true;
  }
  return false;
}

function drawSectionTitle(doc, title) {
  const { colors, fonts } = THEME;

  doc.font(fonts.bold).fontSize(12.5).fillColor(colors.text).text(title, doc.page.margins.left, doc.y);
  doc.moveDown(0.5);
}

function drawHeaderBand(doc, { store, monthLabel, logoBuffer }) {
  const { colors, fonts } = THEME;
  const pageWidth = doc.page.width;
  const bandHeight = 92;

  doc.rect(0, 0, pageWidth, bandHeight).fill(colors.band);

  const left = doc.page.margins.left;
  let textX = left;

  if (logoBuffer) {
    const logoSize = 46;
    const logoY = (bandHeight - logoSize) / 2;
    try {

      doc.roundedRect(left, logoY, logoSize, logoSize, 6).fill("#FFFFFF");
      doc.image(logoBuffer, left + 3, logoY + 3, { fit: [logoSize - 6, logoSize - 6], align: "center", valign: "center" });
      textX = left + logoSize + 16;
    } catch (err) {
      console.error("Failed to embed logo image:", err.message);
    }
  }

  const textBlockHeight = 44;
  const textY = (bandHeight - textBlockHeight) / 2;

  doc
    .font(fonts.bold)
    .fontSize(18)
    .fillColor(colors.bandText)
    .text(store.store_name || "Store", textX, textY, { width: pageWidth - textX - doc.page.margins.right });

  doc
    .font(fonts.regular)
    .fontSize(10.5)
    .fillColor(colors.bandSubtext)
    .text(`Monthly Sales Report  \u2022  ${monthLabel}`, textX, textY + 22);

  doc.fillColor(colors.text);
  doc.y = bandHeight + 28;
}

function drawFooters(doc, { generatedAt }) {
  const { colors, fonts } = THEME;
  const range = doc.bufferedPageRange();
  const left = doc.page.margins.left;

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const y = doc.page.height - originalBottomMargin + 14;

    doc.moveTo(left, y).lineTo(left + pageWidth, y).lineWidth(0.5).strokeColor(colors.border).stroke();

    doc
      .font(fonts.italic)
      .fontSize(8)
      .fillColor(colors.faint)
      .text(`Generated on ${generatedAt}`, left, y + 6, { width: pageWidth / 2, align: "left", lineBreak: false });

    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor(colors.faint)
      .text(`Page ${i - range.start + 1} of ${range.count}`, left + pageWidth / 2, y + 6, {
        width: pageWidth / 2,
        align: "right",
        lineBreak: false,
      });

    doc.page.margins.bottom = originalBottomMargin;
  }
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

    const logoBuffer = await fetchLogoBuffer(store.logo_url);

    const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;
    const safeStoreName = (store.store_name || "store").replace(/[^a-z0-9]/gi, "_");
    const fileName = `${safeStoreName}_report_${y}_${String(m).padStart(2, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const { colors, fonts, page } = THEME;
    const doc = new PDFDocument({
      size: page.size,
      margin: page.margin,
      bufferPages: true,
      info: {
        Title: `${store.store_name || "Store"} - Monthly Report - ${monthLabel}`,
        Author: store.store_name || "Store",
      },
    });
    doc.pipe(res);
    doc.font(fonts.regular).fillColor(colors.text);

    const left = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 26; // leave room for the footer

    drawHeaderBand(doc, { store, monthLabel, logoBuffer });

    drawSectionTitle(doc, "Summary");

    const growthValue = Number(report.growth.growthPercent) || 0;
    const growthSign = growthValue >= 0 ? "+" : "";
    const growthColor = growthValue >= 0 ? colors.positive : colors.negative;

    const profitValue = report.sales.profitDataComplete
      ? formatCurrency(report.sales.totalProfit)
      : `${formatCurrency(report.sales.totalProfit)}*`;

    const stats = [
      { label: "Units Purchased", value: formatNumber(report.purchases.totalUnitsBought) },
      { label: "Purchase Cost", value: formatCurrency(report.purchases.totalPurchaseCost) },
      { label: "Units Sold", value: formatNumber(report.sales.totalUnitsSold) },
      { label: "Total Revenue", value: formatCurrency(report.sales.totalRevenue) },
      { label: "Total Profit", value: profitValue },
      { label: "Growth (MoM)", value: `${growthSign}${growthValue}%`, valueColor: growthColor },
      { label: "Stock On Hand", value: `${formatNumber(report.stock.totalUnitsAvailable)} units` },
    ];

    const cardGap = 10;
    const cardsPerRow = 4;
    const cardW = (pageWidth - cardGap * (cardsPerRow - 1)) / cardsPerRow;
    const cardH = 54;
    const startY = doc.y;

    stats.forEach((stat, i) => {
      const col = i % cardsPerRow;
      const row = Math.floor(i / cardsPerRow);
      const x = left + col * (cardW + cardGap);
      const cy = startY + row * (cardH + cardGap);
      drawStatCard(doc, x, cy, cardW, cardH, stat.label, stat.value, { valueColor: stat.valueColor });
    });

    const cardRows = Math.ceil(stats.length / cardsPerRow);
    doc.y = startY + cardRows * (cardH + cardGap) + 6;

    if (!report.sales.profitDataComplete) {
      doc
        .font(fonts.italic)
        .fontSize(8)
        .fillColor(colors.faint)
        .text("* Profit figure is based on partial cost data for this period.", left);
      doc.fillColor(colors.text);
    }

    doc.moveDown(1.2);

    drawSectionTitle(doc, "Products Purchased");

    const purchaseColumns = [
      { key: "date", label: "Bought On", x: 0, width: 75 },
      { key: "productName", label: "Product", x: 75, width: 125 },
      { key: "buyingPrice", label: "Buying Price", x: 200, width: 90, align: "right" },
      { key: "quantity", label: "Units", x: 290, width: 50, align: "right" },
      { key: "totalCost", label: "Total Cost", x: 340, width: 130, align: "right" },
    ];

    if (report.purchases.items.length === 0) {
      doc.font(fonts.regular).fontSize(9).fillColor(colors.faint).text("No purchases recorded this month.", left, doc.y);
      doc.fillColor(colors.text);
      doc.moveDown(1);
    } else {
      let rowY = doc.y;
      rowY += drawTableHeader(doc, left, rowY, purchaseColumns);

      let totalUnits = 0;
      let totalCost = 0;

      report.purchases.items.forEach((item, idx) => {
        if (rowY + 18 > bottomLimit) {
          doc.addPage();
          rowY = doc.page.margins.top;
          rowY += drawTableHeader(doc, left, rowY, purchaseColumns);
        }

        rowY += drawTableRow(doc, left, rowY, purchaseColumns, {
          date: formatDate(item.boughtAt || item.date),
          productName: item.productName,
          buyingPrice: formatCurrency(item.buyingPrice ?? item.price),
          quantity: formatNumber(item.quantity),
          totalCost: formatCurrency(item.totalCost),
        }, { striped: idx % 2 === 1 });

        totalUnits += Number(item.quantity) || 0;
        totalCost += Number(item.totalCost) || 0;
      });

      if (rowY + 20 > bottomLimit) {
        doc.addPage();
        rowY = doc.page.margins.top;
      }
      rowY += drawTotalsRow(doc, left, rowY, purchaseColumns, {
        productName: "Total",
        quantity: formatNumber(totalUnits),
        totalCost: formatCurrency(totalCost),
      });

      doc.y = rowY + 14;
    }

    // ---- Sales table ----
    ensureSpace(doc, 90, bottomLimit);

    drawSectionTitle(doc, "Products Sold");

    const saleFontSize = 8;
    const saleColumns = [
      { key: "soldOn", label: "Sold On", x: 0, width: 50 },
      { key: "boughtOn", label: "Bought On", x: 50, width: 48 },
      { key: "productName", label: "Product", x: 98, width: 110, align: "left" },
      { key: "buyingPrice", label: "Buy Price", x: 208, width: 65, align: "right" },
      { key: "sellingPrice", label: "Sell Price", x: 273, width: 65, align: "right" },
      { key: "quantity", label: "Units", x: 338, width: 27, align: "right" },
      { key: "subtotal", label: "Subtotal", x: 365, width: 75, align: "right" },
      { key: "profit", label: "Profit", x: 440, width: 75, align: "right" },
    ];

    if (report.sales.items.length === 0) {
      doc.font(fonts.regular).fontSize(9).fillColor(colors.faint).text("No sales recorded this month.", left, doc.y);
      doc.fillColor(colors.text);
    } else {
      let rowY = doc.y;
      rowY += drawTableHeader(doc, left, rowY, saleColumns, saleFontSize);

      let totalUnits = 0;
      let totalSubtotal = 0;
      let totalProfit = 0;
      let hasIncompleteProfit = false;

      report.sales.items.forEach((item, idx) => {
        if (rowY + 16 > bottomLimit) {
          doc.addPage();
          rowY = doc.page.margins.top;
          rowY += drawTableHeader(doc, left, rowY, saleColumns, saleFontSize);
        }

        const hasProfit = item.profit !== null && item.profit !== undefined;
        if (!hasProfit) hasIncompleteProfit = true;

        rowY += drawTableRow(
          doc,
          left,
          rowY,
          saleColumns,
          {
            soldOn: formatDateTimeCompact(item.soldAt || item.date),
            boughtOn: formatDateTimeCompact(item.boughtAt),
            productName: item.productName,
            buyingPrice:
              item.buyingPrice !== null && item.buyingPrice !== undefined
                ? formatCurrency(item.buyingPrice)
                : "-",
            sellingPrice: formatCurrency(item.sellingPrice ?? item.price),
            quantity: formatNumber(item.quantity),
            subtotal: formatCurrency(item.subtotal),
            profit: hasProfit ? formatCurrency(item.profit) : "-",
            profitColor: hasProfit ? (item.profit >= 0 ? colors.positive : colors.negative) : null,
          },
          { fontSize: saleFontSize, striped: idx % 2 === 1, textColorKey: "profit" }
        );

        totalUnits += Number(item.quantity) || 0;
        totalSubtotal += Number(item.subtotal) || 0;
        totalProfit += Number(item.profit) || 0;
      });

      if (rowY + 20 > bottomLimit) {
        doc.addPage();
        rowY = doc.page.margins.top;
      }
      rowY += drawTotalsRow(
        doc,
        left,
        rowY,
        saleColumns,
        {
          productName: "Total",
          quantity: formatNumber(totalUnits),
          subtotal: formatCurrency(totalSubtotal),
          profit: `${formatCurrency(totalProfit)}${hasIncompleteProfit ? "*" : ""}`,
        },
        saleFontSize
      );

      doc.y = rowY + 10;

      if (hasIncompleteProfit) {
        doc
          .font(fonts.italic)
          .fontSize(7.5)
          .fillColor(colors.faint)
          .text("* One or more sold items are missing cost data, so profit here is partial.", left);
        doc.fillColor(colors.text);
      }
    }

    drawFooters(doc, { generatedAt: new Date().toLocaleString("en-IN") });

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