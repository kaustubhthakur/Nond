const { db } = require("../firebase/index.js");

exports.searchProducts = async (storeId, queryText) => {
  const store = String(storeId || "").trim();
  const term = String(queryText || "").trim().toLowerCase();

  if (!store || !term) {
    return [];
  }

  const snapshot = await db
    .collectionGroup("products")
    .where("storeId", "==", store)
    .get();

  const matches = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const sku = String(product.sku || "").toLowerCase();

      const productId = String(
        product.productId || product.id || ""
      ).toLowerCase();

      return (
        name.includes(term) ||
        sku.includes(term) ||
        productId.includes(term)
      );
    });

  return matches;
};