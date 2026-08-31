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

const getBoxRef = (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  boxId
) => {
  return getBoxesRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId
  ).doc(String(boxId));
};

const getSubShelfRef = (
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
    .doc(String(subShelfId));
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
  subShelfId,
  boxId
) => {
  return getBoxRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId,
    boxId
  ).collection("products");
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
  const now = new Date();

  const box = {
    id: boxRef.id,

    storeId: String(storeId),
    warehouseId: String(warehouseId),
    shelfId: String(shelfId),
    subShelfId: String(subShelfId),

    name: name.trim(),
    description: description
      ? description.trim()
      : null,

    capacity: MAX_PRODUCTS,
    productQuantity: 0,
    availableCapacity: MAX_PRODUCTS,

    createdAt: now,
    updatedAt: now,
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
  const doc = await getBoxRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId,
    boxId
  ).get();

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
  const boxRef = getBoxRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId,
    boxId
  );

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
  const boxRef = getBoxRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId,
    boxId
  );
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

  const doc = await boxRef.get();

  if (!doc.exists) {
    return null;
  }

  const boxData = doc.data();
  const reclaimedQuantity = boxData.productQuantity || 0;

  if (reclaimedQuantity > 0) {
    await db.runTransaction(async (transaction) => {
      const subShelfDoc = await transaction.get(subShelfRef);
      const shelfDoc = await transaction.get(shelfRef);

      if (subShelfDoc.exists) {
        const subShelfData = subShelfDoc.data();
        const subShelfCapacity = subShelfData.capacity || 0;
        const newSubShelfQuantity = Math.max(
          0,
          (subShelfData.productQuantity || 0) - reclaimedQuantity
        );

        transaction.update(subShelfRef, {
          productQuantity: newSubShelfQuantity,
          availableCapacity: subShelfCapacity - newSubShelfQuantity,
          updatedAt: new Date(),
        });
      }

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

  await db.recursiveDelete(boxRef);

  return {
    id: boxId,
  };
};


exports.addProduct = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  boxId,
  { name, sku, quantity }
) => {
  const boxRef = getBoxRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId,
    boxId
  );
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
    subShelfId,
    boxId
  ).doc();

  return await db.runTransaction(async (transaction) => {
    const boxDoc = await transaction.get(boxRef);

    if (!boxDoc.exists) {
      return null;
    }

    const subShelfDoc = await transaction.get(subShelfRef);

    if (!subShelfDoc.exists) {
      throw new Error("Parent sub-shelf not found");
    }

    const shelfDoc = await transaction.get(shelfRef);

    if (!shelfDoc.exists) {
      throw new Error("Parent shelf not found");
    }

    const boxData = boxDoc.data();
    const boxCurrentQuantity = boxData.productQuantity || 0;
    const boxCapacity = boxData.capacity || MAX_PRODUCTS;
    const newBoxQuantity = boxCurrentQuantity + quantity;

    if (newBoxQuantity > boxCapacity) {
      throw new Error(
        `Box only has ${
          boxCapacity - boxCurrentQuantity
        } unit(s) of space left`
      );
    }

    const subShelfData = subShelfDoc.data();
    const subShelfCapacity = subShelfData.capacity || 0;
    const subShelfCurrentQuantity = subShelfData.productQuantity || 0;
    const newSubShelfQuantity = subShelfCurrentQuantity + quantity;

    if (newSubShelfQuantity > subShelfCapacity) {
      throw new Error(
        `Sub-shelf only has ${
          subShelfCapacity - subShelfCurrentQuantity
        } unit(s) of space left overall`
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
      boxId: String(boxId),

      name,
      sku: sku || null,
      quantity,

      createdAt: now,
      updatedAt: now,
    };

    transaction.set(productRef, product);

    transaction.update(boxRef, {
      productQuantity: newBoxQuantity,
      availableCapacity: boxCapacity - newBoxQuantity,
      updatedAt: now,
    });

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

    return product;
  });
};

/**
 * Subtracts sold/removed stock from a product inside a box.
 * Runs in a transaction so concurrent sells can't push quantity
 * negative, and rolls the same amount back off the parent
 * sub-shelf and shelf aggregates in the same transaction.
 *
 * If the product's quantity hits 0, the product document is
 * deleted entirely (nothing left to track).
 *
 * Returns { id, remainingQuantity, soldQuantity, deleted }.
 */
exports.sellProduct = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId,
  boxId,
  productId,
  quantity
) => {
  const boxRef = getBoxRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId,
    boxId
  );
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
    subShelfId,
    boxId
  ).doc(String(productId));

  return await db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);

    if (!productDoc.exists) {
      throw new Error("Product not found in this box");
    }

    const boxDoc = await transaction.get(boxRef);

    if (!boxDoc.exists) {
      throw new Error("Box not found");
    }

    const subShelfDoc = await transaction.get(subShelfRef);

    if (!subShelfDoc.exists) {
      throw new Error("Parent sub-shelf not found");
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

    const boxData = boxDoc.data();
    const boxCapacity = boxData.capacity || MAX_PRODUCTS;
    const newBoxQuantity = Math.max(
      0,
      (boxData.productQuantity || 0) - quantity
    );

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

    transaction.update(boxRef, {
      productQuantity: newBoxQuantity,
      availableCapacity: boxCapacity - newBoxQuantity,
      updatedAt: now,
    });

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
  subShelfId,
  boxId
) => {
  const snapshot = await getProductsRef(
    storeId,
    warehouseId,
    shelfId,
    subShelfId,
    boxId
  )
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};