const { db } = require("../firebase");

const MAX_BOXES = 5;
const MAX_PRODUCTS = 125;

const getSubShelvesRef = (
  storeId,
  warehouseId,
  shelfId
) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("warehouses")
    .doc(String(warehouseId))
    .collection("shelves")
    .doc(String(shelfId))
    .collection("subShelves");
};

exports.createSubShelf = async ({
  storeId,
  warehouseId,
  shelfId,
  name,
  description,
}) => {
  const subShelvesRef = getSubShelvesRef(
    storeId,
    warehouseId,
    shelfId
  );

  const existing = await subShelvesRef.get();

  if (existing.size >= 10) {
    throw new Error(
      "Shelf has reached maximum of 10 sub-shelves"
    );
  }

  const subShelfRef = subShelvesRef.doc();

  const subShelf = {
    id: subShelfRef.id,

    storeId: String(storeId),
    warehouseId: String(warehouseId),
    shelfId: String(shelfId),

    name,
    description: description || null,

    maxBoxes: MAX_BOXES,

    productQuantity: 0,
    capacity: MAX_PRODUCTS,
    availableCapacity: MAX_PRODUCTS,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await subShelfRef.set(subShelf);

  return subShelf;
};

exports.getSubShelves = async (
  storeId,
  warehouseId,
  shelfId
) => {
  const snapshot = await getSubShelvesRef(
    storeId,
    warehouseId,
    shelfId
  )
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

exports.getSubShelf = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
) => {
  const subShelfRef = getSubShelvesRef(
    storeId,
    warehouseId,
    shelfId
  ).doc(String(subShelfId));

  const doc = await subShelfRef.get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
};

exports.updateSubShelf = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  {
    name,
    description,
  }
) => {
  const subShelfRef = getSubShelvesRef(
    storeId,
    warehouseId,
    shelfId
  ).doc(String(subShelfId));

  const doc = await subShelfRef.get();

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

  await subShelfRef.update(updates);

  const updated = await subShelfRef.get();

  return {
    id: updated.id,
    ...updated.data(),
  };
};

exports.deleteSubShelf = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
) => {
  const subShelfRef = getSubShelvesRef(
    storeId,
    warehouseId,
    shelfId
  ).doc(String(subShelfId));

  const doc = await subShelfRef.get();

  if (!doc.exists) {
    return null;
  }

  await db.recursiveDelete(subShelfRef);

  return {
    id: subShelfId,
  };
};