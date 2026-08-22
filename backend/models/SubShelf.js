const { db } = require("../firebase");

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
  const subShelfRef = getSubShelvesRef(
    storeId,
    warehouseId,
    shelfId
  ).doc();

  const subShelf = {
    id: subShelfRef.id,
    storeId: String(storeId),
    warehouseId: String(warehouseId),
    shelfId: String(shelfId),
    name,
    description: description || null,
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

  const updatedDoc = await subShelfRef.get();

  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
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