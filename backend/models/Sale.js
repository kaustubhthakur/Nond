const { db } = require("../firebase/index.js");

const getSalesRef = (storeId) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("sales");
};

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
}) => {
  const salesRef = getSalesRef(storeId);
  const saleRef = salesRef.doc();
  const now = new Date();

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
    soldAt: now,
  };

  await saleRef.set(sale);

  return sale;
};

exports.getSales = async (storeId, limitCount = 100) => {
  const snapshot = await getSalesRef(storeId)
    .orderBy("soldAt", "desc")
    .limit(limitCount)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};