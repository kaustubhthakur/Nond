const { db } = require("../firebase/index.js");
const { Timestamp } = require("firebase-admin/firestore");

const getSalesRef = (storeId) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("sales");
};

// Convert a Firestore Timestamp (or already-a-Date, or string) into an ISO string
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

exports.createSale = async ({
  storeId,
  warehouseId,
  warehouseName,
  level, // "shelf" | "subShelf" | "box"
  shelfId,
  shelfName,
  subShelfId,
  subShelfName,
  boxId,
  boxName,
  productId,
  productName,
  sku,
  price,
  quantity,
  soldBy,
  soldAt, // <-- now accepted from the controller
}) => {
  const salesRef = getSalesRef(storeId);
  const saleRef = salesRef.doc();

  // Use the caller-supplied date if given and valid, otherwise fall back to now
  let resolvedSoldAt = new Date();
  if (soldAt) {
    const parsed = soldAt instanceof Date ? soldAt : new Date(soldAt);
    if (!isNaN(parsed.getTime())) {
      resolvedSoldAt = parsed;
    }
  }

  const sale = {
    id: saleRef.id,
    storeId: String(storeId),
    warehouseId: String(warehouseId),
    warehouseName: warehouseName || null,
    level,
    shelfId: shelfId || null,
    shelfName: shelfName || null,
    subShelfId: subShelfId || null,
    subShelfName: subShelfName || null,
    boxId: boxId || null,
    boxName: boxName || null,
    productId: productId || null,
    productName,
    sku: sku || null,
    price: Number(price),
    quantity: Number(quantity),
    total: Number(price) * Number(quantity),
    soldBy: soldBy || null,
    soldAt: Timestamp.fromDate(resolvedSoldAt), // store as a real Firestore Timestamp
  };

  await saleRef.set(sale);

  // Return a JSON-safe version (ISO string) to the controller/frontend
  return serializeSale(sale);
};

exports.getSales = async (storeId, limitCount = 100) => {
  const snapshot = await getSalesRef(storeId)
    .orderBy("soldAt", "desc")
    .limit(limitCount)
    .get();

  return snapshot.docs.map((doc) => serializeSale({ id: doc.id, ...doc.data() }));
};