const { db } = require("../firebase");

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
  const boxRef = getBoxesRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).doc();

  const box = {
    id: boxRef.id,
    storeId: String(storeId),
    warehouseId: String(warehouseId),
    shelfId: String(shelfId),
    subShelfId: String(subShelfId),
    name,
    description: description || null,
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

  const updatedDoc = await boxRef.get();

  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
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