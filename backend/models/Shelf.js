const { db } = require("../firebase");

const getShelvesRef = (storeId, warehouseId) => {
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

  const shelfRef = shelvesRef.doc();

  const shelf = {
    id: shelfRef.id,
    storeId: String(storeId),
    warehouseId: String(warehouseId),
    name,
    description: description || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await shelfRef.set(shelf);

  return shelf;
};

exports.getShelvesByWarehouseId = async (
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

exports.getShelfById = async (
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

  const updatedDoc = await shelfRef.get();

  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
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

  await shelfRef.delete();

  return {
    id: shelfId,
  };
};