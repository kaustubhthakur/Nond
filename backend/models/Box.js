const { db } = require("../firebase");

const MAX_PRODUCTS = 25;

const getBoxesRef = (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("warehouses")
    .doc(String(warehouseId))
    .collection("shelves")
    .doc(String(shelfId))
    .collection("subShelves")
    .doc(String(subShelfId))
    .collection("boxes");
};

exports.createBox = async ({
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  name,
  description,
}) => {
  const boxesRef = getBoxesRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  );

  const existing = await boxesRef.get();

  if (existing.size >= 5) {
    throw new Error(
      "Sub-shelf has reached maximum of 5 boxes"
    );
  }

  const boxRef = boxesRef.doc();

  const box = {
    id: boxRef.id,

    storeId: String(storeId),
    warehouseId: String(warehouseId),
    shelfId: String(shelfId),
    subShelfId: String(subShelfId),

    name,
    description: description || null,

    capacity: MAX_PRODUCTS,
    productQuantity: 0,
    availableCapacity: MAX_PRODUCTS,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await boxRef.set(box);

  return box;
};

exports.getBoxes = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
) => {
  const snapshot = await getBoxesRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  )
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

exports.getBox = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  boxId
) => {
  const boxRef = getBoxesRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).doc(String(boxId));

  const doc = await boxRef.get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
};

exports.updateBox = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  boxId,
  {
    name,
    description,
  }
) => {
  const boxRef = getBoxesRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).doc(String(boxId));

  const doc = await boxRef.get();

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

  await boxRef.update(updates);

  const updated = await boxRef.get();

  return {
    id: updated.id,
    ...updated.data(),
  };
};

exports.deleteBox = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  boxId
) => {
  const boxRef = getBoxesRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).doc(String(boxId));

  const doc = await boxRef.get();

  if (!doc.exists) {
    return null;
  }

  await db.recursiveDelete(boxRef);

  return {
    id: boxId,
  };
};