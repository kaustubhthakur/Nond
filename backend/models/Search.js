const { db } = require("../firebase");

/**
 * Searches every "products" subcollection in the store — whether the
 * product lives on a shelf directly, on a sub-shelf, or inside a box —
 * using a Firestore collectionGroup query. Matching is done by name,
 * sku, or the product's own ID, case-insensitively, as a substring.
 *
 * NOTE: this requires a Firestore composite/collection-group index on
 * the "products" collection group for the "storeId" field. Firestore
 * will prompt you (with a direct console link) to create it the first
 * time this query runs if it doesn't already exist.
 *
 * Returns the raw product documents (each one already carries its own
 * warehouseId/shelfId/subShelfId/boxId, since every level stamps those
 * onto the product when it's created).
 */
exports.searchProducts = async (
  storeId,
  queryText
) => {
  const snapshot = await db
    .collectionGroup("products")
    .where("storeId", "==", String(storeId))
    .get();

  const term = queryText.trim().toLowerCase();

  if (!term) {
    return [];
  }

  const matches = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((product) => {
      const name = (
        product.name || ""
      ).toLowerCase();

      const sku = (
        product.sku || ""
      ).toLowerCase();

      const productId = (
        product.productId ||
        product.id ||
        ""
      ).toLowerCase();

      return (
        name.includes(term) ||
        sku.includes(term) ||
        productId.includes(term)
      );
    });

  return matches;
};