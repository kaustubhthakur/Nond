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

const getSubShelfRef = (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
) => {
  return getSubShelvesRef(
    storeId,
    warehouseId,
    shelfId
  ).doc(String(subShelfId));
};

const getShelfRef = (
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
    .doc(String(shelfId));
};

const getProductsRef = (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
) => {
  return getSubShelfRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).collection("products");
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
    boxCount: 0,

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
  const doc = await getSubShelfRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).get();

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
  const subShelfRef = getSubShelfRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  );

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

/**
 * Deletes a sub-shelf and gives back whatever product-space it was
 * consuming on the parent shelf, in a single transaction.
 */
exports.deleteSubShelf = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
) => {
  const subShelfRef = getSubShelfRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  );
  const shelfRef = getShelfRef(
    storeId,
    warehouseId,
    shelfId
  );

  const doc = await subShelfRef.get();

  if (!doc.exists) {
    return null;
  }

  const subShelfData = doc.data();
  const reclaimedQuantity = subShelfData.productQuantity || 0;

  if (reclaimedQuantity > 0) {
    await db.runTransaction(async (transaction) => {
      const shelfDoc = await transaction.get(shelfRef);

      if (shelfDoc.exists) {
        const shelfData = shelfDoc.data();
        const shelfCapacity = shelfData.capacity || 0;
        const newShelfQuantity = Math.max(
          0,
          (shelfData.productQuantity || 0) - reclaimedQuantity
        );

        transaction.update(shelfRef, {
          productQuantity: newShelfQuantity,
          availableCapacity: shelfCapacity - newShelfQuantity,
          updatedAt: new Date(),
        });
      }
    });
  }

  await db.recursiveDelete(subShelfRef);

  return {
    id: subShelfId,
  };
};

/**
 * Adds a product straight onto a sub-shelf (no box involved).
 * Runs in a transaction so concurrent adds can't push productQuantity
 * past capacity — and rolls the same quantity up onto the parent
 * shelf's own productQuantity/availableCapacity in the same
 * transaction, so shelf-level and sub-shelf-level numbers can never
 * drift apart.
 */
exports.addProduct = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  { name, sku, quantity }
) => {
  const subShelfRef = getSubShelfRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  );

  const shelfRef = getShelfRef(
    storeId,
    warehouseId,
    shelfId
  );

  const productRef = getProductsRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).doc();

  return await db.runTransaction(async (transaction) => {
    const subShelfDoc = await transaction.get(subShelfRef);

    if (!subShelfDoc.exists) {
      return null;
    }

    const shelfDoc = await transaction.get(shelfRef);

    if (!shelfDoc.exists) {
      throw new Error("Parent shelf not found");
    }

    const subShelfData = subShelfDoc.data();

    const currentQuantity = subShelfData.productQuantity || 0;
    const capacity = subShelfData.capacity || MAX_PRODUCTS;
    const newQuantity = currentQuantity + quantity;

    if (newQuantity > capacity) {
      throw new Error(
        `Sub-shelf only has ${
          capacity - currentQuantity
        } unit(s) of space left`
      );
    }

    const shelfData = shelfDoc.data();
    const shelfCapacity = shelfData.capacity || 0;
    const shelfCurrentQuantity = shelfData.productQuantity || 0;
    const newShelfQuantity = shelfCurrentQuantity + quantity;

    if (newShelfQuantity > shelfCapacity) {
      throw new Error(
        `Shelf only has ${
          shelfCapacity - shelfCurrentQuantity
        } unit(s) of space left overall`
      );
    }

    const now = new Date();

    const product = {
      id: productRef.id,

      storeId: String(storeId),
      warehouseId: String(warehouseId),
      shelfId: String(shelfId),
      subShelfId: String(subShelfId),

      name,
      sku: sku || null,
      quantity,

      createdAt: now,
      updatedAt: now,
    };

    transaction.set(productRef, product);

    transaction.update(subShelfRef, {
      productQuantity: newQuantity,
      availableCapacity: capacity - newQuantity,
      updatedAt: now,
    });

    transaction.update(shelfRef, {
      productQuantity: newShelfQuantity,
      availableCapacity: shelfCapacity - newShelfQuantity,
      updatedAt: now,
    });

    return product;
  });
};

/**
 * Subtracts sold/removed stock from a product that lives directly
 * on a sub-shelf (no box). Mirrors Box.sellProduct but one level
 * shallower — rolls the amount back off the parent shelf too.
 *
 * If the product's quantity hits 0, the product document is
 * deleted entirely.
 *
 * Returns { id, remainingQuantity, soldQuantity, deleted }.
 */
exports.sellProduct = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  productId,
  quantity
) => {
  const subShelfRef = getSubShelfRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  );
  const shelfRef = getShelfRef(
    storeId,
    warehouseId,
    shelfId
  );
  const productRef = getProductsRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).doc(String(productId));

  return await db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);

    if (!productDoc.exists) {
      throw new Error("Product not found on this sub-shelf");
    }

    const subShelfDoc = await transaction.get(subShelfRef);

    if (!subShelfDoc.exists) {
      throw new Error("Sub-shelf not found");
    }

    const shelfDoc = await transaction.get(shelfRef);

    if (!shelfDoc.exists) {
      throw new Error("Parent shelf not found");
    }

    const productData = productDoc.data();
    const currentProductQuantity = productData.quantity || 0;

    if (quantity > currentProductQuantity) {
      throw new Error(
        `Only ${currentProductQuantity} unit(s) of this product available to sell`
      );
    }

    const newProductQuantity =
      currentProductQuantity - quantity;

    const subShelfData = subShelfDoc.data();
    const subShelfCapacity = subShelfData.capacity || 0;
    const newSubShelfQuantity = Math.max(
      0,
      (subShelfData.productQuantity || 0) - quantity
    );

    const shelfData = shelfDoc.data();
    const shelfCapacity = shelfData.capacity || 0;
    const newShelfQuantity = Math.max(
      0,
      (shelfData.productQuantity || 0) - quantity
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

    transaction.update(subShelfRef, {
      productQuantity: newSubShelfQuantity,
      availableCapacity: subShelfCapacity - newSubShelfQuantity,
      updatedAt: now,
    });

    transaction.update(shelfRef, {
      productQuantity: newShelfQuantity,
      availableCapacity: shelfCapacity - newShelfQuantity,
      updatedAt: now,
    });

    return {
      id: productRef.id,
      remainingQuantity: newProductQuantity,
      soldQuantity: quantity,
      deleted: newProductQuantity === 0,
    };
  });
};

exports.getProducts = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
) => {
  const snapshot = await getProductsRef(
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