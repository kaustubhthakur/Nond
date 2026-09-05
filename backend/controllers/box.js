const Box = require("../models/Box");
const Store = require("../models/Store");
const Warehouse = require("../models/Warehouse");
const Shelf = require("../models/Shelf");
const SubShelf = require("../models/SubShelf");

const MAX_PRODUCTS = 25;

const getStoreForUser = async (
  userId,
  storeId
) => {
  return await Store.getStoreById(
    storeId,
    userId
  );
};

const validateHierarchy = async (
  storeId,
  warehouseId,
  shelfId,
  subShelfId
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

  const subShelf =
    await SubShelf.getSubShelf(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    );

  if (!subShelf) {
    return {
      error: "Sub-shelf not found",
      status: 404,
    };
  }

  return {
    warehouse,
    shelf,
    subShelf,
  };
};

const validateName = (name) => {
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return "Box name is required";
  }

  if (name.trim().length > 100) {
    return "Box name cannot exceed 100 characters";
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

exports.createBox = async (
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
        shelfId,
        subShelfId
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
      await Box.getBoxes(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    if (existing.length >= 5) {
      return res.status(409).json({
        error:
          "Sub-shelf has reached maximum of 5 boxes",

        maxBoxes: 5,

        currentBoxes:
          existing.length,

        availableBoxes: 0,
      });
    }

    const box =
      await Box.createBox({
        storeId,
        warehouseId,
        shelfId,
        subShelfId,

        name: name.trim(),

        description:
          description !== undefined
            ? description.trim()
            : null,
      });

    return res.status(201).json({
      success: true,
      message:
        "Box created successfully",
      box,
    });
  } catch (err) {
    console.error(
      "Create box error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to create box",
    });
  }
};

exports.getBoxes = async (
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
        shelfId,
        subShelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const boxes =
      await Box.getBoxes(
        storeId,
        warehouseId,
        shelfId,
        subShelfId
      );

    return res.status(200).json({
      success: true,

      count: boxes.length,

      maxBoxes: 5,

      availableBoxes:
        Math.max(
          0,
          5 - boxes.length
        ),

      productsPerBox:
        MAX_PRODUCTS,

      boxes,
    });
  } catch (err) {
    console.error(
      "Get boxes error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get boxes",
    });
  }
};

exports.getBox = async (
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
      boxId,
    } = req.params;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId ||
      !boxId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID, sub-shelf ID and box ID are required",
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
        shelfId,
        subShelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const box =
      await Box.getBox(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
        boxId
      );

    if (!box) {
      return res.status(404).json({
        error: "Box not found",
      });
    }

    return res.status(200).json({
      success: true,
      box,
    });
  } catch (err) {
    console.error(
      "Get box error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get box",
    });
  }
};

exports.updateBox = async (
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
      boxId,
    } = req.params;

    const {
      name,
      description,
    } = req.body;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId ||
      !boxId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID, sub-shelf ID and box ID are required",
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
        shelfId,
        subShelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const existing =
      await Box.getBox(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
        boxId
      );

    if (!existing) {
      return res.status(404).json({
        error: "Box not found",
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

    const box =
      await Box.updateBox(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
        boxId,
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

    if (!box) {
      return res.status(404).json({
        error: "Box not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Box updated successfully",
      box,
    });
  } catch (err) {
    console.error(
      "Update box error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to update box",
    });
  }
};

exports.deleteBox = async (
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
      boxId,
    } = req.params;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId ||
      !boxId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID, sub-shelf ID and box ID are required",
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
        shelfId,
        subShelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const existing =
      await Box.getBox(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
        boxId
      );

    if (!existing) {
      return res.status(404).json({
        error: "Box not found",
      });
    }

    await Box.deleteBox(
      storeId,
      warehouseId,
      shelfId,
      subShelfId,
      boxId
    );

    return res.status(200).json({
      success: true,
      message:
        "Box and all products inside it deleted successfully",
    });
  } catch (err) {
    console.error(
      "Delete box error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to delete box",
    });
  }
};

exports.getBoxOptions = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,

    maxBoxesPerSubShelf: 5,

    maxProductsPerBox:
      MAX_PRODUCTS,
  });
};


/*
|--------------------------------------------------------------------------
| Product Validation
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Add Product To Box
|--------------------------------------------------------------------------
*/

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
      boxId,
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
      !subShelfId ||
      !boxId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID, sub-shelf ID and box ID are required",
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
        shelfId,
        subShelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const box =
      await Box.getBox(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
        boxId
      );

    if (!box) {
      return res.status(404).json({
        error: "Box not found",
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
      box.capacity -
      box.productQuantity;

    if (quantity > availableSpace) {
      return res.status(409).json({
        error: `Box only has ${availableSpace} unit(s) of space left`,
        capacity: box.capacity,
        currentQuantity:
          box.productQuantity,
        availableSpace,
      });
    }

    let product;

    try {
      product =
        await Box.addProduct(
          storeId,
          warehouseId,
          shelfId,
          subShelfId,
          boxId,
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
        error: "Box not found",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Product added to box successfully",
      product,
    });
  } catch (err) {
    console.error(
      "Add product to box error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to add product to box",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Sell Product
|--------------------------------------------------------------------------
*/

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
      boxId,
      productId,
    } = req.params;

    const { quantity } = req.body;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId ||
      !boxId ||
      !productId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID, sub-shelf ID, box ID and product ID are required",
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
        shelfId,
        subShelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const box =
      await Box.getBox(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
        boxId
      );

    if (!box) {
      return res.status(404).json({
        error: "Box not found",
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
        await Box.sellProduct(
          storeId,
          warehouseId,
          shelfId,
          subShelfId,
          boxId,
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
        ? "Product sold out and removed from box"
        : "Product quantity updated",
      ...result,
    });
  } catch (err) {
    console.error(
      "Sell product from box error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to sell product from box",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Get Box Products
|--------------------------------------------------------------------------
*/

exports.getBoxProducts = async (
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
      boxId,
    } = req.params;

    if (
      !storeId ||
      !warehouseId ||
      !shelfId ||
      !subShelfId ||
      !boxId
    ) {
      return res.status(400).json({
        error:
          "Store ID, warehouse ID, shelf ID, sub-shelf ID and box ID are required",
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
        shelfId,
        subShelfId
      );

    if (hierarchy.error) {
      return res.status(
        hierarchy.status
      ).json({
        error: hierarchy.error,
      });
    }

    const box =
      await Box.getBox(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
        boxId
      );

    if (!box) {
      return res.status(404).json({
        error: "Box not found",
      });
    }

    const products =
      await Box.getProducts(
        storeId,
        warehouseId,
        shelfId,
        subShelfId,
        boxId
      );

    return res.status(200).json({
      success: true,
      count: products.length,
      capacity: box.capacity,
      productQuantity:
        box.productQuantity,
      products,
    });
  } catch (err) {
    console.error(
      "Get box products error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get box products",
    });
  }
};