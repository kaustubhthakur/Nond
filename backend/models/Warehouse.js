const { db } = require("../firebase/firebase");

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
  const warehousesRef = getWarehousesRef(storeId);

  const warehouseRef = warehousesRef.doc();

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

exports.getWarehousesByStoreId = async (storeId) => {
  const snapshot = await getWarehousesRef(storeId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

exports.getWarehouseById = async (
  storeId,
  warehouseId
) => {
  const warehouseRef = getWarehousesRef(storeId)
    .doc(warehouseId);

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
    .doc(warehouseId);

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

  const updatedDoc = await warehouseRef.get();

  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
  };
};

exports.deleteWarehouse = async (
  storeId,
  warehouseId
) => {
  const warehouseRef = getWarehousesRef(storeId)
    .doc(warehouseId);

  const doc = await warehouseRef.get();

  if (!doc.exists) {
    return null;
  }

  await warehouseRef.delete();

  return {
    id: warehouseId,
  };
};