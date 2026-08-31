const Shelf = require("../models/Shelf");
const Store = require("../models/Store");
const Warehouse = require("../models/Warehouse");

const MAX_SUBSHELVES = 10;
const MAX_PRODUCTS = 1250;

const getStoreForUser = async (
  userId,
  storeId
) => {
  const store =
    await Store.getStoreById(
      storeId,
      userId
    );

  return store;
};

const getWarehouse = async (
  storeId,
  warehouseId
) => {
  return await Warehouse.getWarehouse(
    storeId,
    warehouseId
  );
};

const validateName = (name) => {
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return "Shelf name is required";
  }

  if (name.trim().length > 100) {
    return "Shelf name cannot exceed 100 characters";
  }

  return null;
};

const validateDescription = (
  description
) => {
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return "Description must be a string";
  }

  if (
    description &&
    description.length > 500
  ) {
    return "Description cannot exceed 500 characters";
  }

  return null;
};

exports.createShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
    } = req.params;

    const {
      name,
      description,
    } = req.body;

    if (!storeId) {
      return res.status(400).json({
        error: "Store ID is required",
      });
    }

    if (!warehouseId) {
      return res.status(400).json({
        error:
          "Warehouse ID is required",
      });
    }

    const store =
      await getStoreForUser(
        userId,
        storeId
      );

    if (!store) {
      return res.status(403).json({
        error:
          "You do not have access to this store",
      });
    }

    const warehouse =
      await getWarehouse(
        storeId,
        warehouseId
      );

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const nameError =
      validateName(name);

    if (nameError) {
      return res.status(400).json({
        error: nameError,
      });
    }

    const descriptionError =
      validateDescription(
        description
      );

    if (descriptionError) {
      return res.status(400).json({
        error: descriptionError,
      });
    }

    const shelves =
      await Shelf.getShelves(
        storeId,
        warehouseId
      );

    if (
      shelves.length >=
      warehouse.shelfCapacity
    ) {
      return res.status(409).json({
        error:
          "Warehouse has reached its maximum shelf capacity",
        shelfCapacity:
          warehouse.shelfCapacity,
        currentShelves:
          shelves.length,
        availableShelves: 0,
      });
    }

    const shelf =
      await Shelf.createShelf({
        storeId,
        warehouseId,

        name: name.trim(),

        description:
          description !== undefined
            ? description.trim()
            : null,
      });

    return res.status(201).json({
      success: true,
      message:
        "Shelf created successfully",
      shelf,
    });
  } catch (err) {
    console.error(
      "Create shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to create shelf",
    });
  }
};

exports.getShelves = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
    } = req.params;

    if (!storeId) {
      return res.status(400).json({
        error: "Store ID is required",
      });
    }

    if (!warehouseId) {
      return res.status(400).json({
        error:
          "Warehouse ID is required",
      });
    }

    const store =
      await getStoreForUser(
        userId,
        storeId
      );

    if (!store) {
      return res.status(403).json({
        error:
          "You do not have access to this store",
      });
    }

    const warehouse =
      await getWarehouse(
        storeId,
        warehouseId
      );

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const shelves =
      await Shelf.getShelves(
        storeId,
        warehouseId
      );

    return res.status(200).json({
      success: true,

      count: shelves.length,

      shelfCapacity:
        warehouse.shelfCapacity,

      availableShelves:
        Math.max(
          0,
          warehouse.shelfCapacity -
            shelves.length
        ),

      shelves,
    });
  } catch (err) {
    console.error(
      "Get shelves error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get shelves",
    });
  }
};

exports.getShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
    } = req.params;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID and shelf ID are required",
      });
    }

    const store =
      await getStoreForUser(
        userId,
        storeId
      );

    if (!store) {
      return res.status(403).json({
        error:
          "You do not have access to this store",
      });
    }

    const warehouse =
      await getWarehouse(
        storeId,
        warehouseId
      );

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const shelf =
      await Shelf.getShelf(
        storeId,
        warehouseId,
        shelfId
      );

    if (!shelf) {
      return res.status(404).json({
        error: "Shelf not found",
      });
    }

    return res.status(200).json({
      success: true,
      shelf,
    });
  } catch (err) {
    console.error(
      "Get shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get shelf",
    });
  }
};

exports.updateShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
    } = req.params;

    const {
      name,
      description,
    } = req.body;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID and shelf ID are required",
      });
    }

    const store =
      await getStoreForUser(
        userId,
        storeId
      );

    if (!store) {
      return res.status(403).json({
        error:
          "You do not have access to this store",
      });
    }

    const warehouse =
      await getWarehouse(
        storeId,
        warehouseId
      );

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const existingShelf =
      await Shelf.getShelf(
        storeId,
        warehouseId,
        shelfId
      );

    if (!existingShelf) {
      return res.status(404).json({
        error: "Shelf not found",
      });
    }

    if (name !== undefined) {
      const nameError =
        validateName(name);

      if (nameError) {
        return res.status(400).json({
          error: nameError,
        });
      }
    }

    const descriptionError =
      validateDescription(
        description
      );

    if (descriptionError) {
      return res.status(400).json({
        error: descriptionError,
      });
    }

    const shelf =
      await Shelf.updateShelf(
        storeId,
        warehouseId,
        shelfId,
        {
          name:
            name !== undefined
              ? name.trim()
              : undefined,

          description:
            description !== undefined
              ? description.trim()
              : undefined,
        }
      );

    if (!shelf) {
      return res.status(404).json({
        error: "Shelf not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Shelf updated successfully",
      shelf,
    });
  } catch (err) {
    console.error(
      "Update shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to update shelf",
    });
  }
};

exports.deleteShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
    } = req.params;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID and shelf ID are required",
      });
    }

    const store =
      await getStoreForUser(
        userId,
        storeId
      );

    if (!store) {
      return res.status(403).json({
        error:
          "You do not have access to this store",
      });
    }

    const warehouse =
      await getWarehouse(
        storeId,
        warehouseId
      );

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const existingShelf =
      await Shelf.getShelf(
        storeId,
        warehouseId,
        shelfId
      );

    if (!existingShelf) {
      return res.status(404).json({
        error: "Shelf not found",
      });
    }

    await Shelf.deleteShelf(
      storeId,
      warehouseId,
      shelfId
    );

    return res.status(200).json({
      success: true,
      message:
        "Shelf and all data inside it deleted successfully",
    });
  } catch (err) {
    console.error(
      "Delete shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to delete shelf",
    });
  }
};

exports.getShelfOptions = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,

    maxSubShelves:
      MAX_SUBSHELVES,

    maxProducts:
      MAX_PRODUCTS,
  });
};

exports.addProductToShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
    } = req.params;

    const {
      productId,
      quantity,
    } = req.body;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID and shelf ID are required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        error: "Product ID is required",
      });
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        error:
          "Quantity must be a positive integer",
      });
    }

    const store =
      await getStoreForUser(
        userId,
        storeId
      );

    if (!store) {
      return res.status(403).json({
        error:
          "You do not have access to this store",
      });
    }

    const warehouse =
      await getWarehouse(
        storeId,
        warehouseId
      );

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const shelf =
      await Shelf.getShelf(
        storeId,
        warehouseId,
        shelfId
      );

    if (!shelf) {
      return res.status(404).json({
        error: "Shelf not found",
      });
    }

    const product =
      await Shelf.addProductToShelf({
        storeId,
        warehouseId,
        shelfId,
        productId,
        quantity: Number(quantity),
      });

    return res.status(201).json({
      success: true,
      message:
        "Product added to shelf successfully",
      product,
    });
  } catch (err) {
    console.error(
      "Add product to shelf error:",
      err
    );

    return res.status(400).json({
      error:
        err.message ||
        "Failed to add product to shelf",
    });
  }
};

// Subtract stock from a product on this shelf — e.g. when it's sold.
exports.sellProductFromShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
      productId,
    } = req.params;

    const { quantity } = req.body;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !productId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID and product ID are required",
      });
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        error:
          "Quantity must be a positive integer",
      });
    }

    const store =
      await getStoreForUser(
        userId,
        storeId
      );

    if (!store) {
      return res.status(403).json({
        error:
          "You do not have access to this store",
      });
    }

    const warehouse =
      await getWarehouse(
        storeId,
        warehouseId
      );

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const shelf =
      await Shelf.getShelf(
        storeId,
        warehouseId,
        shelfId
      );

    if (!shelf) {
      return res.status(404).json({
        error: "Shelf not found",
      });
    }

    let result;

    try {
      result =
        await Shelf.sellProductFromShelf({
          storeId,
          warehouseId,
          shelfId,
          productId,
          quantity: Number(quantity),
        });
    } catch (err) {
      return res.status(409).json({
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.deleted
        ? "Product sold out and removed from shelf"
        : "Product quantity updated",
      ...result,
    });
  } catch (err) {
    console.error(
      "Sell product from shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to sell product from shelf",
    });
  }
};