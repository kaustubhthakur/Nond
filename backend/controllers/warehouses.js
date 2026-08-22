const Warehouse = require("../models/Warehouse");
const Store = require("../models/Store");

const SHELF_CAPACITY_OPTIONS = [
  15,
  25,
  40,
  60,
  80,
  100,
];

const MAX_SUBSHELVES_PER_SHELF = 10;
const MAX_BOXES_PER_SUBSHELF = 5;
const MAX_PRODUCTS_PER_BOX = 25;

const getStoreForUser = async (
  userId,
  storeId
) => {
  const store =
    await Store.getStoreByUserId(userId);

  if (!store) {
    return null;
  }

  if (
    String(store.id) !==
    String(storeId)
  ) {
    return null;
  }

  return store;
};

const validateStoreAccess = async (
  userId,
  storeId
) => {
  if (!storeId) {
    return {
      valid: false,
      status: 400,
      error: "Store ID is required",
    };
  }

  const store =
    await getStoreForUser(
      userId,
      storeId
    );

  if (!store) {
    return {
      valid: false,
      status: 403,
      error:
        "You do not have access to this store",
    };
  }

  return {
    valid: true,
    store,
  };
};

const validateWarehouseName = (
  name
) => {
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return "Warehouse name is required";
  }

  if (name.trim().length > 100) {
    return "Warehouse name cannot exceed 100 characters";
  }

  return null;
};

const validateOptionalText = (
  value,
  field,
  maxLength = 500
) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return `${field} must be a string`;
  }

  if (value.length > maxLength) {
    return `${field} cannot exceed ${maxLength} characters`;
  }

  return null;
};

const createWarehouse = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      name,
      description,
      address,
      shelfCapacity,
    } = req.body;

    const access =
      await validateStoreAccess(
        userId,
        storeId
      );

    if (!access.valid) {
      return res
        .status(access.status)
        .json({
          error: access.error,
        });
    }

    const nameError =
      validateWarehouseName(name);

    if (nameError) {
      return res.status(400).json({
        error: nameError,
      });
    }

    const descriptionError =
      validateOptionalText(
        description,
        "Description"
      );

    if (descriptionError) {
      return res.status(400).json({
        error: descriptionError,
      });
    }

    const addressError =
      validateOptionalText(
        address,
        "Address"
      );

    if (addressError) {
      return res.status(400).json({
        error: addressError,
      });
    }

    if (shelfCapacity === undefined) {
      return res.status(400).json({
        error:
          "Shelf capacity is required",
      });
    }

    const capacity =
      Number(shelfCapacity);

    if (
      !Number.isInteger(capacity) ||
      !SHELF_CAPACITY_OPTIONS.includes(
        capacity
      )
    ) {
      return res.status(400).json({
        error:
          "Invalid warehouse shelf capacity",
        allowedValues:
          SHELF_CAPACITY_OPTIONS,
      });
    }

    const warehouse =
      await Warehouse.createWarehouse({
        storeId: String(storeId),

        name: name.trim(),

        description:
          description !== undefined
            ? description.trim()
            : null,

        address:
          address !== undefined
            ? address.trim()
            : null,

        shelfCapacity: capacity,
      });

    return res.status(201).json({
      success: true,
      message:
        "Warehouse created successfully",
      warehouse,
    });
  } catch (err) {
    console.error(
      "Create warehouse error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to create warehouse",
    });
  }
};

const getWarehouses = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;

    const access =
      await validateStoreAccess(
        userId,
        storeId
      );

    if (!access.valid) {
      return res
        .status(access.status)
        .json({
          error: access.error,
        });
    }

    const warehouses =
      await Warehouse.getWarehouses(
        String(storeId)
      );

    return res.status(200).json({
      success: true,
      count: warehouses.length,
      warehouses,
    });
  } catch (err) {
    console.error(
      "Get warehouses error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get warehouses",
    });
  }
};

const getWarehouse = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
    } = req.params;

    const access =
      await validateStoreAccess(
        userId,
        storeId
      );

    if (!access.valid) {
      return res
        .status(access.status)
        .json({
          error: access.error,
        });
    }

    if (!warehouseId) {
      return res.status(400).json({
        error:
          "Warehouse ID is required",
      });
    }

    const warehouse =
      await Warehouse.getWarehouse(
        String(storeId),
        String(warehouseId)
      );

    if (!warehouse) {
      return res.status(404).json({
        error:
          "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      warehouse,
    });
  } catch (err) {
    console.error(
      "Get warehouse error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to get warehouse",
    });
  }
};

const updateWarehouse = async (
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
      address,
    } = req.body;

    const access =
      await validateStoreAccess(
        userId,
        storeId
      );

    if (!access.valid) {
      return res
        .status(access.status)
        .json({
          error: access.error,
        });
    }

    if (!warehouseId) {
      return res.status(400).json({
        error:
          "Warehouse ID is required",
      });
    }

    const existingWarehouse =
      await Warehouse.getWarehouse(
        String(storeId),
        String(warehouseId)
      );

    if (!existingWarehouse) {
      return res.status(404).json({
        error:
          "Warehouse not found",
      });
    }

    if (name !== undefined) {
      const nameError =
        validateWarehouseName(name);

      if (nameError) {
        return res.status(400).json({
          error: nameError,
        });
      }
    }

    const descriptionError =
      validateOptionalText(
        description,
        "Description"
      );

    if (descriptionError) {
      return res.status(400).json({
        error: descriptionError,
      });
    }

    const addressError =
      validateOptionalText(
        address,
        "Address"
      );

    if (addressError) {
      return res.status(400).json({
        error: addressError,
      });
    }

    const warehouse =
      await Warehouse.updateWarehouse(
        String(storeId),
        String(warehouseId),
        {
          name:
            name !== undefined
              ? name.trim()
              : undefined,

          description:
            description !== undefined
              ? description.trim()
              : undefined,

          address:
            address !== undefined
              ? address.trim()
              : undefined,
        }
      );

    if (!warehouse) {
      return res.status(404).json({
        error:
          "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Warehouse updated successfully",
      warehouse,
    });
  } catch (err) {
    console.error(
      "Update warehouse error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to update warehouse",
    });
  }
};

const deleteWarehouse = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      storeId,
      warehouseId,
    } = req.params;

    const access =
      await validateStoreAccess(
        userId,
        storeId
      );

    if (!access.valid) {
      return res
        .status(access.status)
        .json({
          error: access.error,
        });
    }

    if (!warehouseId) {
      return res.status(400).json({
        error:
          "Warehouse ID is required",
      });
    }

    const existingWarehouse =
      await Warehouse.getWarehouse(
        String(storeId),
        String(warehouseId)
      );

    if (!existingWarehouse) {
      return res.status(404).json({
        error:
          "Warehouse not found",
      });
    }

    await Warehouse.deleteWarehouse(
      String(storeId),
      String(warehouseId)
    );

    return res.status(200).json({
      success: true,
      message:
        "Warehouse and all its storage hierarchy deleted successfully",
    });
  } catch (err) {
    console.error(
      "Delete warehouse error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to delete warehouse",
    });
  }
};

const getWarehouseOptions = async (
  req,
  res
) => {
  try {
    return res.status(200).json({
      success: true,

      shelfCapacityOptions:
        SHELF_CAPACITY_OPTIONS,

      maxSubShelvesPerShelf:
        MAX_SUBSHELVES_PER_SHELF,

      maxBoxesPerSubShelf:
        MAX_BOXES_PER_SUBSHELF,

      maxProductsPerBox:
        MAX_PRODUCTS_PER_BOX,
    });
  } catch (err) {
    console.error(
      "Get warehouse options error:",
      err
    );

    return res.status(500).json({
      error:
        "Failed to get warehouse options",
    });
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseOptions,
};