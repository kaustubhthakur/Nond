const pool = require("../pool");

exports.createStore = async ({
  userId,
  storeName,
  businessType,
  businessCategory,
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
      business_category,
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
      $12
    )
    RETURNING
      id,
      user_id,
      store_name,
      business_type,
      business_category,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      created_at
    `,
    [
      userId,
      storeName,
      businessType,
      businessCategory,
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

exports.getStoreByUserId = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      user_id,
      store_name,
      business_type,
      business_category,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      created_at
    FROM stores
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0];
};

exports.updateStore = async (
  storeId,
  {
    storeName,
    businessType,
    businessCategory,
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
      business_category = COALESCE($3, business_category),
      address = COALESCE($4, address),
      city = COALESCE($5, city),
      state = COALESCE($6, state),
      country = COALESCE($7, country),
      pincode = COALESCE($8, pincode),
      language = COALESCE($9, language),
      currency = COALESCE($10, currency),
      timezone = COALESCE($11, timezone)
    WHERE id = $12
    RETURNING
      id,
      user_id,
      store_name,
      business_type,
      business_category,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      created_at
    `,
    [
      storeName,
      businessType,
      businessCategory,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      storeId,
    ]
  );

  return result.rows[0];
};

exports.deleteStore = async (storeId) => {
  const result = await pool.query(
    `
    DELETE FROM stores
    WHERE id = $1
    RETURNING id
    `,
    [storeId]
  );

  return result.rows[0];
};