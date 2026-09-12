const { db } = require("../firebase/index.js");

const getStockMovementsRef = (storeId) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("stockMovements");
};


exports.logStockMovement = (
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
    price,
    quantity,
    now,
  }
) => {
  const movementsRef = getStockMovementsRef(storeId);
  const movementRef = movementsRef.doc();

  const movement = {
    id: movementRef.id,
    storeId: String(storeId),
    warehouseId: warehouseId ? String(warehouseId) : null,
    shelfId: shelfId ? String(shelfId) : null,
    subShelfId: subShelfId ? String(subShelfId) : null,
    boxId: boxId ? String(boxId) : null,
    level,

    productId: productId || null,
    productName: productName || null,
    sku: sku || null,

    price: price ?? 0,
    quantity,
    totalCost: (price ?? 0) * quantity,

    createdAt: now || new Date(),
  };

  if (transaction) {
    transaction.set(movementRef, movement);
  } else {
    movementRef.set(movement);
  }

  return movement;
};

exports.getStockMovements = async (storeId, { start, end } = {}) => {
  let ref = getStockMovementsRef(storeId);

  if (start) {
    ref = ref.where("createdAt", ">=", start);
  }
  if (end) {
    ref = ref.where("createdAt", "<", end);
  }

  const snapshot = await ref.orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};