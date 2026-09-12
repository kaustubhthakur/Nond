const { db } = require("../firebase/index.js");
const { Timestamp } = require("firebase-admin/firestore");


const getMonthRange = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
};

const getPreviousMonth = (year, month) => {
  const d = new Date(Date.UTC(year, month - 2, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
};


const toIso = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
};


const getStoreStockSnapshot = async (storeId) => {
  const warehousesSnap = await db
    .collection("stores")
    .doc(String(storeId))
    .collection("warehouses")
    .get();

  let totalUnitsAvailable = 0;
  const warehouses = [];

  for (const wDoc of warehousesSnap.docs) {
    const warehouseData = wDoc.data();
    const shelvesSnap = await wDoc.ref.collection("shelves").get();

    let warehouseUnits = 0;
    const shelves = shelvesSnap.docs.map((sDoc) => {
      const shelfData = sDoc.data();
      const qty = shelfData.productQuantity || 0;
      warehouseUnits += qty;

      return {
        id: sDoc.id,
        name: shelfData.name,
        productQuantity: qty,
        capacity: shelfData.capacity || 0,
      };
    });

    totalUnitsAvailable += warehouseUnits;

    warehouses.push({
      id: wDoc.id,
      name: warehouseData.name,
      productQuantity: warehouseUnits,
      shelves,
    });
  }

  return { totalUnitsAvailable, warehouses };
};

/**
 * Builds the full monthly report for a store.
 *
 * @param {Object} params
 * @param {string} params.storeId
 * @param {number} params.year
 * @param {number} params.month  1-12
 */
exports.generateMonthlyReport = async ({ storeId, year, month }) => {
  const { start, end } = getMonthRange(year, month);
  const prev = getPreviousMonth(year, month);
  const { start: prevStart, end: prevEnd } = getMonthRange(
    prev.year,
    prev.month
  );

  const salesRef = db
    .collection("stores")
    .doc(String(storeId))
    .collection("sales");

  const stockMovementsRef = db
    .collection("stores")
    .doc(String(storeId))
    .collection("stockMovements");

  const [salesSnap, prevSalesSnap, movementsSnap, stockSnapshot] =
    await Promise.all([
      salesRef
        .where("soldAt", ">=", Timestamp.fromDate(start))
        .where("soldAt", "<", Timestamp.fromDate(end))
        .get(),
      salesRef
        .where("soldAt", ">=", Timestamp.fromDate(prevStart))
        .where("soldAt", "<", Timestamp.fromDate(prevEnd))
        .get(),
      stockMovementsRef
        .where("createdAt", ">=", Timestamp.fromDate(start))
        .where("createdAt", "<", Timestamp.fromDate(end))
        .get(),
      getStoreStockSnapshot(storeId),
    ]);

  // ---- Sales side (units sold, revenue, profit) ----
  const soldItems = [];
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalUnitsSold = 0;
  let profitDataComplete = true;

  salesSnap.docs.forEach((doc) => {
    const sale = doc.data();

    if (!sale.soldAt || typeof sale.soldAt.toDate !== "function") {
      console.warn(`Sale ${doc.id} is missing a valid soldAt timestamp — skipping`);
      return;
    }

    if (!Array.isArray(sale.items)) {
      console.warn(`Sale ${doc.id} has no items array — skipping`);
      return;
    }

    const soldAtIso = sale.soldAt.toDate().toISOString();

    sale.items.forEach((item) => {
  
      const sellingPrice =
        item.sellingPrice !== undefined && item.sellingPrice !== null
          ? item.sellingPrice
          : item.price;

      const hasCostPrice =
        item.costPrice !== undefined && item.costPrice !== null;

      soldItems.push({
        date: soldAtIso, // kept for backwards compatibility
        soldAt: item.soldAt ? toIso(item.soldAt) : soldAtIso,
        boughtAt: toIso(item.boughtAt),

        productId: item.productId,
        productName: item.productName,
        sku: item.sku,

        buyingPrice: hasCostPrice ? item.costPrice : null,
        sellingPrice,
        price: sellingPrice, // kept for backwards compatibility

        quantity: item.quantity,
        subtotal: item.subtotal,
        profit: item.profit,
      });

      totalRevenue += item.subtotal;
      totalUnitsSold += item.quantity;

      if (item.profit !== null && item.profit !== undefined) {
        totalProfit += item.profit;
      } else {
        profitDataComplete = false;
      }

      if (!hasCostPrice) {
        profitDataComplete = false;
      }
    });
  });

  // ---- Previous month revenue, for % growth ----
  let prevRevenue = 0;
  prevSalesSnap.docs.forEach((doc) => {
    prevRevenue += doc.data().total || 0;
  });

  const growthPercent =
    prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : totalRevenue > 0
      ? 100
      : 0;

  // ---- Purchases side (units bought, cost, date & time bought) ----
  const boughtItems = [];
  let totalPurchaseCost = 0;
  let totalUnitsBought = 0;

  movementsSnap.docs.forEach((doc) => {
    const m = doc.data();

    if (!m.createdAt) {
      console.warn(`Stock movement ${doc.id} is missing createdAt — skipping`);
      return;
    }

    const createdAtIso = toIso(m.createdAt);

    boughtItems.push({
      date: createdAtIso,
      boughtAt: createdAtIso,
      productId: m.productId,
      productName: m.productName,
      sku: m.sku,
      buyingPrice: m.price,
      price: m.price, // kept for backwards compatibility
      quantity: m.quantity,
      totalCost: m.totalCost,
      level: m.level,
      warehouseId: m.warehouseId,
    });

    totalPurchaseCost += m.totalCost;
    totalUnitsBought += m.quantity;
  });

  return {
    storeId: String(storeId),
    period: {
      year,
      month,
      start: start.toISOString(),
      end: end.toISOString(),
    },
    purchases: {
      items: boughtItems,
      totalUnitsBought,
      totalPurchaseCost,
    },
    sales: {
      items: soldItems,
      totalUnitsSold,
      totalRevenue,
      totalProfit,
      profitDataComplete, // false if any sale item had no costPrice recorded
    },
    growth: {
      previousMonthRevenue: prevRevenue,
      currentMonthRevenue: totalRevenue,
      growthPercent: Number(growthPercent.toFixed(2)),
    },
    stock: stockSnapshot, // current snapshot, not historical to end-of-month
    generatedAt: new Date().toISOString(),
  };
};

exports.getStoreStockSnapshot = getStoreStockSnapshot;
exports.getMonthRange = getMonthRange;