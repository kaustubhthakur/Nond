const { db } = require("../firebase");

const MAX_SUBSHELVES = 10;
const MAX_PRODUCTS = 1250;

const getShelvesRef = (
  storeId,
  warehouseId
) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("warehouses")
    .doc(String(warehouseId))
    .collection("shelves");
};

exports.createShelf = async ({
  storeId,
  warehouseId,
  name,
  description,
}) => {
  const shelvesRef = getShelvesRef(
    storeId,
    warehouseId
  );

  const existing = await shelvesRef.get();

  const warehouseRef = db
    .collection("stores")
    .doc(String(storeId))
    .collection("warehouses")
    .doc(String(warehouseId));

  const warehouse = await warehouseRef.get();

  if (!warehouse.exists) {
    throw new Error("Warehouse not found");
  }

  const warehouseData = warehouse.data();

  if (existing.size >= warehouseData.shelfCapacity) {
    throw new Error(
      "Warehouse has reached its maximum shelf capacity"
    );
  }

  const shelfRef = shelvesRef.doc();

  const shelf = {
    id: shelfRef.id,

    storeId: String(storeId),
    warehouseId: String(warehouseId),

    name,
    description: description || null,

    maxSubShelves: MAX_SUBSHELVES,

    productQuantity: 0,
    capacity: MAX_PRODUCTS,
    availableCapacity: MAX_PRODUCTS,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await shelfRef.set(shelf);

  return shelf;
};

exports.getShelves = async (
  storeId,
  warehouseId
) => {
  const snapshot = await getShelvesRef(
    storeId,
    warehouseId
  )
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

exports.getShelf = async (
  storeId,
  warehouseId,
  shelfId
) => {
  const shelfRef = getShelvesRef(
    storeId,
    warehouseId
  ).doc(String(shelfId));

  const doc = await shelfRef.get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
};

exports.updateShelf = async (
  storeId,
  warehouseId,
  shelfId,
  {
    name,
    description,
  }
) => {
  const shelfRef = getShelvesRef(
    storeId,
    warehouseId
  ).doc(String(shelfId));

  const doc = await shelfRef.get();

  if (!doc.exists) {
    return null;
  }

  const updates = {
    updatedAt: new Date(),
  };

  if (name !== undefined) {
    updates.name = name;
  }

  if (description !== undefined) {
    updates.description = description;
  }

  await shelfRef.update(updates);

  const updated = await shelfRef.get();

  return {
    id: updated.id,
    ...updated.data(),
  };
};

exports.deleteShelf = async (
  storeId,
  warehouseId,
  shelfId
) => {
  const shelfRef = getShelvesRef(
    storeId,
    warehouseId
  ).doc(String(shelfId));

  const doc = await shelfRef.get();

  if (!doc.exists) {
    return null;
  }

  await db.recursiveDelete(shelfRef);

  return {
    id: shelfId,
  };
};