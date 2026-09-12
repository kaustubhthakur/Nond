const { db } = require("../firebase/index.js");
const { Timestamp } = require("firebase-admin/firestore");

const getSalesRef = (storeId) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("sales");
};
 

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

function serializeSale(sale) {
  return {
    ...sale,
    soldAt: toIso(sale.soldAt),
  };
}
exports.recordSale = (
  transaction,
  {
    storeId,
    warehouseId,
    shelfId,
    subShelfId,
    boxId,
    level,
    productId,
    productName,
    sku,
    costPrice,
    sellingPrice,
    quantity,
    boughtAt,
    soldAt,
  }
) => {
  const salesRef = getSalesRef(storeId);
  const saleRef = salesRef.doc();
 
  const cost = Number(costPrice) || 0;
  const sell = Number(sellingPrice) || 0;
 
  const subtotal = sell * quantity;
  const profit = (sell - cost) * quantity;
 
  const soldAtDate = soldAt || new Date();
 
  const sale = {
    id: saleRef.id,
    storeId: String(storeId),
 
    soldAt: soldAtDate,
    total: subtotal,
 
    items: [
      {
        productId: productId || null,
        productName: productName || null,
        sku: sku || null,
 
        warehouseId: warehouseId ? String(warehouseId) : null,
        shelfId: shelfId ? String(shelfId) : null,
        subShelfId: subShelfId ? String(subShelfId) : null,
        boxId: boxId ? String(boxId) : null,
        level,
 
        costPrice: cost,
        sellingPrice: sell,
       
        price: sell,
 
        quantity,
        subtotal,
        profit,
 
        boughtAt: boughtAt || null,
        soldAt: soldAtDate,
      },
    ],
  };
 
  if (transaction) {
    transaction.set(saleRef, sale);
  } else {
    saleRef.set(sale);
  }
 
  return sale;
};
 
exports.createSale = async ({ storeId, items, soldBy, soldAt }) => {
  const salesRef = getSalesRef(storeId);
  const saleRef = salesRef.doc();

  let resolvedSoldAt = new Date();
  if (soldAt) {
    const parsed = soldAt instanceof Date ? soldAt : new Date(soldAt);
    if (!isNaN(parsed.getTime())) resolvedSoldAt = parsed;
  }

  const normalizedItems = items.map((item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    const costPrice =
      typeof item.costPrice === "number" && Number.isFinite(item.costPrice)
        ? Number(item.costPrice)
        : null;

    return {
      warehouseId: String(item.warehouseId),
      warehouseName: item.warehouseName || null,
      level: item.level,
      shelfId: item.shelfId || null,
      shelfName: item.shelfName || null,
      subShelfId: item.subShelfId || null,
      subShelfName: item.subShelfName || null,
      boxId: item.boxId || null,
      boxName: item.boxName || null,
      productId: item.productId || null,
      productName: item.productName,
      sku: item.sku || null,
      price,
      costPrice,
      quantity,
      subtotal: price * quantity,
      profit: costPrice !== null ? (price - costPrice) * quantity : null,
    };
  });

  const total = normalizedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const totalUnits = normalizedItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalProfit = normalizedItems.reduce(
    (sum, i) => sum + (i.profit ?? 0),
    0
  );
  const profitDataComplete = normalizedItems.every((i) => i.profit !== null);

  const sale = {
    id: saleRef.id,
    storeId: String(storeId),
    items: normalizedItems,
    itemCount: normalizedItems.length,
    totalUnits,
    total,
    totalProfit,
    profitDataComplete,
    soldBy: soldBy || null,
    soldAt: Timestamp.fromDate(resolvedSoldAt),
  };

  await saleRef.set(sale);
  return serializeSale(sale);
};

exports.getSales = async (storeId, limitCount = 100) => {
  const snapshot = await getSalesRef(storeId)
    .orderBy("soldAt", "desc")
    .limit(limitCount)
    .get();
  return snapshot.docs.map((doc) => serializeSale({ id: doc.id, ...doc.data() }));
};