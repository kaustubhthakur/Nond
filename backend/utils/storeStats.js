// utils/storeStats.js
const { db } = require("../firebase");

exports.getStoreStatsFromFirestore = async (storeId) => {
  const storeRef = db.collection("stores").doc(String(storeId));

  let warehouseCount = 0;
  let shelfCount = 0;
  let subshelfCount = 0;
  let boxCount = 0;

  const warehousesSnap = await storeRef.collection("warehouses").get();
  warehouseCount = warehousesSnap.size;

  // Walk each warehouse -> shelves -> subshelves -> boxes
  await Promise.all(
    warehousesSnap.docs.map(async (warehouseDoc) => {
      const shelvesSnap = await warehouseDoc.ref.collection("shelves").get();
      shelfCount += shelvesSnap.size;

      await Promise.all(
        shelvesSnap.docs.map(async (shelfDoc) => {
          const subshelvesSnap = await shelfDoc.ref
            .collection("subshelves")
            .get();
          subshelfCount += subshelvesSnap.size;

          await Promise.all(
            subshelvesSnap.docs.map(async (subshelfDoc) => {
              const boxesSnap = await subshelfDoc.ref
                .collection("boxes")
                .get();
              boxCount += boxesSnap.size;
            })
          );
        })
      );
    })
  );

  return {
    warehouses: warehouseCount,
    shelves: shelfCount,
    subshelves: subshelfCount,
    boxes: boxCount,
  };
};