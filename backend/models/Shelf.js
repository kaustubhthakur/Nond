const { db } = require("../firebase/index.js");

const MAX_SUBSHELVES = 10;
const MAX_PRODUCTS = 1250;

const getShelvesRef = (storeId, warehouseId) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("warehouses")
    .doc(String(warehouseId))
    .collection("shelves");
};

const getProductsRef = (storeId, warehouseId, shelfId) => {
  return db
    .collection("stores")
    .doc(String(storeId))
    .collection("warehouses")
    .doc(String(warehouseId))
    .collection("shelves")
    .doc(String(shelfId))
    .collection("products");
};

exports.createShelf = async ({
  storeId,
  warehouseId,
  name,
  description,
}) => {
  const shelvesRef = getShelvesRef(storeId, warehouseId);
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

  if (existing.size >= Number(warehouseData.shelfCapacity || 0)) {
    throw new Error(
      "Warehouse has reached its maximum shelf capacity"
    );
  }

  const shelfRef = shelvesRef.doc();
  const now = new Date();

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
    createdAt: now,
    updatedAt: now,
  };

  await shelfRef.set(shelf);

  return shelf;
};

exports.getShelves = async (storeId, warehouseId) => {
  const snapshot = await getShelvesRef(storeId, warehouseId)
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
  { name, description }
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

exports.addProductToShelf = async ({
  storeId,
  warehouseId,
  shelfId,
  productId,
  quantity,
  logo,
  price,
}) => {
  const shelfRef = getShelvesRef(
    storeId,
    warehouseId
  ).doc(String(shelfId));

  const shelf = await shelfRef.get();

  if (!shelf.exists) {
    throw new Error("Shelf not found");
  }

  const shelfData = shelf.data();

  const productsRef = getProductsRef(
    storeId,
    warehouseId,
    shelfId
  );

  const productRef = productsRef.doc(String(productId));
  const existing = await productRef.get();

  const addQuantity = Number(quantity);

  if (
    !Number.isInteger(addQuantity) ||
    addQuantity <= 0
  ) {
    throw new Error(
      "Quantity must be a positive integer"
    );
  }

  const productPrice = Number(price);

  if (
    !Number.isFinite(productPrice) ||
    productPrice < 0
  ) {
    throw new Error(
      "Price must be a valid non-negative number"
    );
  }

  const currentQuantity =
    Number(shelfData.productQuantity) || 0;

  const existingQuantity = existing.exists
    ? Number(existing.data().quantity || 0)
    : 0;

  const newQuantity =
    currentQuantity + addQuantity;

  if (newQuantity > MAX_PRODUCTS) {
    throw new Error(
      `Shelf can contain maximum ${MAX_PRODUCTS} products`
    );
  }

  const now = new Date();

  const product = {
    id: String(productId),
    productId: String(productId),
    storeId: String(storeId),
    warehouseId: String(warehouseId),
    shelfId: String(shelfId),
    logo: logo || null,
    price: productPrice,
    quantity: existingQuantity + addQuantity,
    createdAt: existing.exists
      ? existing.data().createdAt
      : now,
    updatedAt: now,
  };

  await productRef.set(product);

  await shelfRef.update({
    productQuantity: newQuantity,
    availableCapacity: MAX_PRODUCTS - newQuantity,
    updatedAt: now,
  });

  return product;
};

exports.getShelfProducts = async (
  storeId,
  warehouseId,
  shelfId
) => {
  const snapshot = await getProductsRef(
    storeId,
    warehouseId,
    shelfId
  ).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

exports.getShelfProduct = async (
  storeId,
  warehouseId,
  shelfId,
  productId
) => {
  const productRef = getProductsRef(
    storeId,
    warehouseId,
    shelfId
  ).doc(String(productId));

  const doc = await productRef.get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
};

exports.sellProductFromShelf = async ({
  storeId,
  warehouseId,
  shelfId,
  productId,
  quantity,
}) => {
  const shelfRef = getShelvesRef(
    storeId,
    warehouseId
  ).doc(String(shelfId));

  const productsRef = getProductsRef(
    storeId,
    warehouseId,
    shelfId
  );

  const productRef = productsRef.doc(String(productId));

  const sellQuantity = Number(quantity);

  if (
    !Number.isInteger(sellQuantity) ||
    sellQuantity <= 0
  ) {
    throw new Error(
      "Quantity must be a positive integer"
    );
  }

  return await db.runTransaction(async (transaction) => {
    const productDoc =
      await transaction.get(productRef);

    if (!productDoc.exists) {
      throw new Error(
        "Product not found on this shelf"
      );
    }

    const shelfDoc =
      await transaction.get(shelfRef);

    if (!shelfDoc.exists) {
      throw new Error("Shelf not found");
    }

    const productData = productDoc.data();

    const currentProductQuantity =
      Number(productData.quantity) || 0;

    if (sellQuantity > currentProductQuantity) {
      throw new Error(
        `Only ${currentProductQuantity} unit(s) of this product available to sell`
      );
    }

    const newProductQuantity =
      currentProductQuantity - sellQuantity;

    const shelfData = shelfDoc.data();

    const shelfCapacity =
      Number(shelfData.capacity) || MAX_PRODUCTS;

    const currentShelfQuantity =
      Number(shelfData.productQuantity) || 0;

    const newShelfQuantity = Math.max(
      0,
      currentShelfQuantity - sellQuantity
    );

    const now = new Date();

    if (newProductQuantity === 0) {
      transaction.delete(productRef);
    } else {
      transaction.update(productRef, {
        quantity: newProductQuantity,
        updatedAt: now,
      });
    }

    transaction.update(shelfRef, {
      productQuantity: newShelfQuantity,
      availableCapacity:
        shelfCapacity - newShelfQuantity,
      updatedAt: now,
    });

    return {
      id: productRef.id,
      remainingQuantity: newProductQuantity,
      soldQuantity: sellQuantity,
      deleted: newProductQuantity === 0,
    };
  });
};