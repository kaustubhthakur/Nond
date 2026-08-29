const Store = require("../models/Store");
const { db } = require("../firebase");

const BUSINESS_TYPES = [
  "retail",
  "wholesale",
  "manufacturing",
  "service",
  "restaurant",
  "online",
  "other",
];

const BUSINESS_CATEGORIES = [
  "grocery",
  "electronics",
  "fashion",
  "furniture",
  "automotive",
  "beauty",
  "food",
  "hardware",
  "sports",
  "books",
  "jewelry",
  "healthcare",
  "other",
];

const validateBusinessDetails = (
  businessType,
  businessTypeCustom,
  businessCategory,
  businessCategoryCustom
) => {
  if (!BUSINESS_TYPES.includes(businessType)) {
    return "Invalid business type";
  }

  if (
    businessType === "other" &&
    (!businessTypeCustom || !businessTypeCustom.trim())
  ) {
    return "Please specify your business type";
  }

  if (!BUSINESS_CATEGORIES.includes(businessCategory)) {
    return "Invalid business category";
  }

  if (
    businessCategory === "other" &&
    (!businessCategoryCustom || !businessCategoryCustom.trim())
  ) {
    return "Please specify your business category";
  }

  return null;
};

exports.createStore = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      storeName,
      businessType,
      businessTypeCustom,
      businessCategory,
      businessCategoryCustom,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
    } = req.body;

    if (!storeName || !storeName.trim()) {
      return res.status(400).json({
        error: "Store name is required",
      });
    }

    if (!businessType) {
      return res.status(400).json({
        error: "Business type is required",
      });
    }

    if (!businessCategory) {
      return res.status(400).json({
        error: "Business category is required",
      });
    }

    const validationError = validateBusinessDetails(
      businessType,
      businessTypeCustom,
      businessCategory,
      businessCategoryCustom
    );

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    const store = await Store.createStore({
      userId,

      storeName: storeName.trim(),

      businessType,

      businessTypeCustom:
        businessType === "other"
          ? businessTypeCustom.trim()
          : null,

      businessCategory,

      businessCategoryCustom:
        businessCategory === "other"
          ? businessCategoryCustom.trim()
          : null,

      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
    });

    return res.status(201).json({
      success: true,
      message: "Store created successfully",
      store,
    });
  } catch (err) {
    console.error("Create store error:", err);

    return res.status(500).json({
      error: "Failed to create store",
    });
  }
};

exports.getMyStores = async (req, res) => {
  try {
    const userId = req.user.id;

    const stores = await Store.getStoresByUserId(userId);

    return res.status(200).json({
      success: true,
      stores,
    });
  } catch (err) {
    console.error("Get stores error:", err);

    return res.status(500).json({
      error: "Failed to get stores",
    });
  }
};

exports.getStore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;

    const store = await Store.getStoreById(
      storeId,
      userId
    );

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (err) {
    console.error("Get store error:", err);

    return res.status(500).json({
      error: "Failed to get store",
    });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;

    const existingStore = await Store.getStoreById(
      storeId,
      userId
    );

    if (!existingStore) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    const {
      storeName,
      businessType,
      businessTypeCustom,
      businessCategory,
      businessCategoryCustom,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
    } = req.body;

    const finalBusinessType =
      businessType ?? existingStore.business_type;

    const finalBusinessTypeCustom =
      businessTypeCustom ??
      existingStore.business_type_custom;

    const finalBusinessCategory =
      businessCategory ??
      existingStore.business_category;

    const finalBusinessCategoryCustom =
      businessCategoryCustom ??
      existingStore.business_category_custom;

    const validationError = validateBusinessDetails(
      finalBusinessType,
      finalBusinessTypeCustom,
      finalBusinessCategory,
      finalBusinessCategoryCustom
    );

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    const store = await Store.updateStore(
      storeId,
      userId,
      {
        storeName:
          storeName !== undefined
            ? storeName.trim()
            : undefined,

        businessType: finalBusinessType,

        businessTypeCustom:
          finalBusinessType === "other"
            ? finalBusinessTypeCustom?.trim()
            : null,

        businessCategory: finalBusinessCategory,

        businessCategoryCustom:
          finalBusinessCategory === "other"
            ? finalBusinessCategoryCustom?.trim()
            : null,

        address,
        city,
        state,
        country,
        pincode,
        language,
        currency,
        timezone,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Store updated successfully",
      store,
    });
  } catch (err) {
    console.error("Update store error:", err);

    return res.status(500).json({
      error: "Failed to update store",
    });
  }
};

exports.uploadStoreLogo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;

    const existingStore = await Store.getStoreById(storeId, userId);

    if (!existingStore) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No logo file was uploaded",
      });
    }

    // TODO: confirm how Firebase Storage bucket is exposed from ../firebase
    // Expecting something like: const { bucket } = require("../firebase");
    const { bucket } = require("../firebase");

    const destination = `store-logos/${storeId}-${Date.now()}-${req.file.originalname}`;
    const fileRef = bucket.file(destination);

    await fileRef.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: true,
    });

    const logoUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    const updatedStore = await Store.updateStoreLogo(storeId, userId, logoUrl);

    return res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      store: updatedStore,
    });
  } catch (err) {
    console.error("Upload logo error:", err);

    return res.status(500).json({
      error: "Failed to upload logo",
    });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        error: "Store ID is required",
      });
    }

    const existingStore = await Store.getStoreById(
      storeId,
      userId
    );

    if (!existingStore) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    const firebaseStoreRef = db
      .collection("stores")
      .doc(String(storeId));

    const firebaseStore = await firebaseStoreRef.get();

    if (firebaseStore.exists) {
      await db.recursiveDelete(
        firebaseStoreRef
      );
    }

    const store = await Store.deleteStore(
      storeId,
      userId
    );

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Store and all associated data deleted successfully",
    });
  } catch (err) {
    console.error(
      "Delete store error:",
      err
    );

    return res.status(500).json({
      error:
        "Failed to delete store",
    });
  }
};

exports.getBusinessOptions = async (req, res) => {
  return res.status(200).json({
    success: true,
    businessTypes: BUSINESS_TYPES,
    businessCategories: BUSINESS_CATEGORIES,
  });
};