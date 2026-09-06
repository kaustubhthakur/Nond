const { db } = require("../firebase/index.js");
const { Timestamp } = require("firebase-admin/firestore");

const getSalesRef = (storeId) => {
  return db.collection("stores").doc(String(storeId)).collection("sales");
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
      quantity,
      subtotal: price * quantity,
    };
  });

  const total = normalizedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const totalUnits = normalizedItems.reduce((sum, i) => sum + i.quantity, 0);

  const sale = {
    id: saleRef.id,
    storeId: String(storeId),
    items: normalizedItems,
    itemCount: normalizedItems.length,
    totalUnits,
    total,
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