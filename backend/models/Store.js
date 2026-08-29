const pool = require("../pool");

exports.createStore = async ({
  userId,
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
}) => {
  const result = await pool.query(
    `
    INSERT INTO stores (
      user_id,
      store_name,
      business_type,
      business_type_custom,
      business_category,
      business_category_custom,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13,
      $14
    )
    RETURNING
      id,
      user_id,
      store_name,
      business_type,
      business_type_custom,
      business_category,
      business_category_custom,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      logo_url,
      created_at
    `,
    [
      userId,
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
    ]
  );

  return result.rows[0];
};

exports.getStoresByUserId = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      user_id,
      store_name,
      business_type,
      business_type_custom,
      business_category,
      business_category_custom,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      logo_url,
      created_at
    FROM stores
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

exports.getStoreById = async (storeId, userId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      user_id,
      store_name,
      business_type,
      business_type_custom,
      business_category,
      business_category_custom,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      logo_url,
      created_at
    FROM stores
    WHERE id = $1
      AND user_id = $2
    LIMIT 1
    `,
    [storeId, userId]
  );

  return result.rows[0];
};

exports.updateStore = async (
  storeId,
  userId,
  {
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
  }
) => {
  const result = await pool.query(
    `
    UPDATE stores
    SET
      store_name = COALESCE($1, store_name),
      business_type = COALESCE($2, business_type),
      business_type_custom = COALESCE($3, business_type_custom),
      business_category = COALESCE($4, business_category),
      business_category_custom = COALESCE($5, business_category_custom),
      address = COALESCE($6, address),
      city = COALESCE($7, city),
      state = COALESCE($8, state),
      country = COALESCE($9, country),
      pincode = COALESCE($10, pincode),
      language = COALESCE($11, language),
      currency = COALESCE($12, currency),
      timezone = COALESCE($13, timezone)
    WHERE id = $14
      AND user_id = $15
    RETURNING
      id,
      user_id,
      store_name,
      business_type,
      business_type_custom,
      business_category,
      business_category_custom,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      logo_url,
      created_at
    `,
    [
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
      storeId,
      userId,
    ]
  );

  return result.rows[0];
};

exports.updateStoreLogo = async (storeId, userId, logoUrl) => {
  const result = await pool.query(
    `
    UPDATE stores
    SET logo_url = $1
    WHERE id = $2
      AND user_id = $3
    RETURNING
      id,
      user_id,
      store_name,
      logo_url
    `,
    [logoUrl, storeId, userId]
  );

  return result.rows[0];
};

exports.deleteStore = async (storeId, userId) => {
  const result = await pool.query(
    `
    DELETE FROM stores
    WHERE id = $1
      AND user_id = $2
    RETURNING id
    `,
    [storeId, userId]
  );

  return result.rows[0];
};