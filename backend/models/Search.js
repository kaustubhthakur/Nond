const { db } = require("../firebase");

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