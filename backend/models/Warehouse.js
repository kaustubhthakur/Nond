const { db } = require("../firebase");

const getWarehousesRef = (storeId) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("warehouses");
};

exports.createWarehouse = async ({
  storeId,
  name,
  description,
  address,
}) => {
  const warehouseRef = getWarehousesRef(storeId).doc();

  const warehouse = {
    id: warehouseRef.id,
    storeId: String(storeId),
    name,
    description: description || null,
    address: address || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await warehouseRef.set(warehouse);

  return warehouse;
};

exports.getWarehouses = async (storeId) => {
  const snapshot = await getWarehousesRef(storeId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

exports.getWarehouse = async (
  storeId,
  warehouseId
) => {
  const warehouseRef = getWarehousesRef(storeId)
    .doc(String(warehouseId));

  const doc = await warehouseRef.get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
};

exports.updateWarehouse = async (
  storeId,
  warehouseId,
  {
    name,
    description,
    address,
  }
) => {
  const warehouseRef = getWarehousesRef(storeId)
    .doc(String(warehouseId));

  const doc = await warehouseRef.get();

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

  if (address !== undefined) {
    updates.address = address;
  }

  await warehouseRef.update(updates);

  const updated = await warehouseRef.get();

  return {
    id: updated.id,
    ...updated.data(),
  };
};

exports.deleteWarehouse = async (
  storeId,
  warehouseId
) => {
  const warehouseRef = getWarehousesRef(storeId)
    .doc(String(warehouseId));

  const doc = await warehouseRef.get();

  if (!doc.exists) {
    return null;
  }

  await db.recursiveDelete(warehouseRef);

  return {
    id: warehouseId,
  };
};