const SubShelf = require("../models/SubShelf");
const Store = require("../models/Store");
const Warehouse = require("../models/Warehouse");
const Shelf = require("../models/Shelf");

const MAX_BOXES = 5;
const MAX_PRODUCTS = 125;

const getStoreForUser = async (
  userId,
  storeId
) => {
  return await Store.getStoreById(
    storeId,
    userId
  );
};

const validateName = (name) => {
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return "Sub-shelf name is required";
  }

  if (name.trim().length > 100) {
    return "Sub-shelf name cannot exceed 100 characters";
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

const validateProductInput = (
  name,
  sku,
  logo,
  price,
  quantity
) => {
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return "Product name is required";
  }

  if (name.trim().length > 100) {
    return "Product name cannot exceed 100 characters";
  }

  if (
    sku !== undefined &&
    sku !== null &&
    typeof sku !== "string" &&
    typeof sku !== "number"
  ) {
    return "SKU must be a string or number";
  }

  if (
    logo !== undefined &&
    logo !== null &&
    typeof logo !== "string"
  ) {
    return "Logo must be a string";
  }

  if (
    price === undefined ||
    price === null ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return "Price must be a non-negative number";
  }

  if (
    quantity === undefined ||
    quantity === null ||
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return "Quantity must be a positive integer";
  }

  return null;
};

const validateHierarchy = async (
  storeId,
  warehouseId,
  shelfId
) => {
  const warehouse =
    await Warehouse.getWarehouse(
      storeId,
      warehouseId
    );

  if (!warehouse) {
    return {
      error: "Warehouse not found",
      status: 404,
    };
  }

  const shelf =
    await Shelf.getShelf(
      storeId,
      warehouseId,
      shelfId
    );

  if (!shelf) {
    return {
      error: "Shelf not found",
      status: 404,
    };
  }

  return {
    warehouse,
    shelf,
  };
};

exports.createSubShelf = async (
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

    if (!shelfId) {
      return res.status(400).json({
        error: "Shelf ID is required",
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

    const hierarchy =
      await validateHierarchy(
        storeId,
        warehouseId,
        shelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
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

    const existing =
      await SubShelf.getSubShelves(
        storeId,
        warehouseId,
        shelfId
      );

    if (existing.length >= 10) {
      return res.status(409).json({
        error:
          "Shelf has reached maximum of 10 sub-shelves",
        maxSubShelves: 10,
        currentSubShelves:
          existing.length,
        availableSubShelves: 0,
      });
    }

    const subShelf =
      await SubShelf.createSubShelf({
        storeId,
        warehouseId,
        shelfId,
        name: name.trim(),
        description:
          description !== undefined
            ? description.trim()
            : null,
      });

    return res.status(201).json({
      success: true,
      message:
        "Sub-shelf created successfully",
      subShelf,
    });
  } catch (err) {
    console.error(
      "Create sub-shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to create sub-shelf",
    });
  }
};

exports.getSubShelves = async (
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

    const hierarchy =
      await validateHierarchy(
        storeId,
        warehouseId,
        shelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const subShelves =
      await SubShelf.getSubShelves(
        storeId,
        warehouseId,
        shelfId
      );

    return res.status(200).json({
      success: true,
      count: subShelves.length,
      maxSubShelves: 10,
      availableSubShelves:
        Math.max(
          0,
          10 - subShelves.length
        ),
      maxBoxesPerSubShelf:
        MAX_BOXES,
      maxProductsPerSubShelf:
        MAX_PRODUCTS,
      subShelves,
    });
  } catch (err) {
    console.error(
      "Get sub-shelves error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get sub-shelves",
    });
  }
};

exports.getSubShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
      subShelfId,
    } = req.params;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID and sub-shelf ID are required",
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

    const hierarchy =
      await validateHierarchy(
        storeId,
        warehouseId,
        shelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const subShelf =
      await SubShelf.getSubShelf(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    if (!subShelf) {
      return res.status(404).json({
        error: "Sub-shelf not found",
      });
    }

    return res.status(200).json({
      success: true,
      subShelf,
    });
  } catch (err) {
    console.error(
      "Get sub-shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get sub-shelf",
    });
  }
};

exports.updateSubShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
      subShelfId,
    } = req.params;

    const {
      name,
      description,
    } = req.body;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID and sub-shelf ID are required",
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

    const hierarchy =
      await validateHierarchy(
        storeId,
        warehouseId,
        shelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const existing =
      await SubShelf.getSubShelf(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    if (!existing) {
      return res.status(404).json({
        error: "Sub-shelf not found",
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

    const subShelf =
      await SubShelf.updateSubShelf(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
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

    if (!subShelf) {
      return res.status(404).json({
        error: "Sub-shelf not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Sub-shelf updated successfully",
      subShelf,
    });
  } catch (err) {
    console.error(
      "Update sub-shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to update sub-shelf",
    });
  }
};

exports.deleteSubShelf = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
      subShelfId,
    } = req.params;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID and sub-shelf ID are required",
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

    const hierarchy =
      await validateHierarchy(
        storeId,
        warehouseId,
        shelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const existing =
      await SubShelf.getSubShelf(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    if (!existing) {
      return res.status(404).json({
        error: "Sub-shelf not found",
      });
    }

    await SubShelf.deleteSubShelf(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    );

    return res.status(200).json({
      success: true,
      message:
        "Sub-shelf and all boxes/products inside it deleted successfully",
    });
  } catch (err) {
    console.error(
      "Delete sub-shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to delete sub-shelf",
    });
  }
};

// Add a product directly onto a sub-shelf (no box).
exports.addProduct = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
      subShelfId,
    } = req.params;

    const {
      name,
      sku,
      logo,
      price,
      quantity,
    } = req.body;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID and sub-shelf ID are required",
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

    const hierarchy =
      await validateHierarchy(
        storeId,
        warehouseId,
        shelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const subShelf =
      await SubShelf.getSubShelf(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    if (!subShelf) {
      return res.status(404).json({
        error: "Sub-shelf not found",
      });
    }

    const inputError =
      validateProductInput(
        name,
        sku,
        logo,
        price,
        quantity
      );

    if (inputError) {
      return res.status(400).json({
        error: inputError,
      });
    }

    const availableSpace =
      subShelf.capacity -
      subShelf.productQuantity;

    if (quantity > availableSpace) {
      return res.status(409).json({
        error: `Sub-shelf only has ${availableSpace} unit(s) of space left`,
        capacity: subShelf.capacity,
        currentQuantity:
          subShelf.productQuantity,
        availableSpace,
      });
    }

    let product;

    try {
      product =
        await SubShelf.addProduct(
          storeId,
          warehouseId,
          shelfId,
          subShelfId,
          {
            name: name.trim(),

            sku:
              sku !== undefined &&
              sku !== null
                ? String(sku).trim()
                : null,

            logo:
              logo !== undefined &&
              logo !== null
                ? String(logo).trim()
                : null,

            price,
            quantity,
          }
        );
    } catch (err) {
      return res.status(409).json({
        error: err.message,
      });
    }

    if (!product) {
      return res.status(404).json({
        error: "Sub-shelf not found",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Product added to sub-shelf successfully",
      product,
    });
  } catch (err) {
    console.error(
      "Add product to sub-shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to add product to sub-shelf",
    });
  }
};

// Subtract stock from a product on this sub-shelf — e.g. when it's sold.
exports.sellProduct = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
      subShelfId,
      productId,
    } = req.params;

    const { quantity } = req.body;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId ||
      !productId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID, sub-shelf ID and product ID are required",
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

    const hierarchy =
      await validateHierarchy(
        storeId,
        warehouseId,
        shelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const subShelf =
      await SubShelf.getSubShelf(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    if (!subShelf) {
      return res.status(404).json({
        error: "Sub-shelf not found",
      });
    }

    const qty = Number(quantity);

    if (
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      return res.status(400).json({
        error:
          "Quantity must be a positive integer",
      });
    }

    let result;

    try {
      result =
        await SubShelf.sellProduct(
          storeId,
          warehouseId,
          shelfId,
          subShelfId,
          productId,
          qty
        );
    } catch (err) {
      return res.status(409).json({
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.deleted
        ? "Product sold out and removed from sub-shelf"
        : "Product quantity updated",
      ...result,
    });
  } catch (err) {
    console.error(
      "Sell product from sub-shelf error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to sell product from sub-shelf",
    });
  }
};

exports.getSubShelfProducts = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
      shelfId,
      subShelfId,
    } = req.params;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID and sub-shelf ID are required",
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

    const hierarchy =
      await validateHierarchy(
        storeId,
        warehouseId,
        shelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const subShelf =
      await SubShelf.getSubShelf(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    if (!subShelf) {
      return res.status(404).json({
        error: "Sub-shelf not found",
      });
    }

    const products =
      await SubShelf.getProducts(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    return res.status(200).json({
      success: true,
      count: products.length,
      capacity: subShelf.capacity,
      productQuantity:
        subShelf.productQuantity,
      products,
    });
  } catch (err) {
    console.error(
      "Get sub-shelf products error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get sub-shelf products",
    });
  }
};

exports.getSubShelfOptions = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,

    maxSubShelvesPerShelf: 10,

    maxBoxesPerSubShelf:
      MAX_BOXES,

    maxProductsPerSubShelf:
      MAX_PRODUCTS,

    productsPerBox: 25,
  });
};