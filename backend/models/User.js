const pool = require("../pool");

exports.createUser = async ({
  username,
  email,
  password,
  storeName,
  businessType,
  businessCategory,
  phone,
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
    INSERT INTO users (
      username,
      email,
      password,
      avatar,
      is_online,
      store_name,
      business_type,
      business_category,
      phone,
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
      $1, $2, $3, NULL, FALSE,
      $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15
    )
    RETURNING
      id,
      username,
      email,
      avatar,
      is_online,
      store_name,
      business_type,
      business_category,
      phone,
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
      username,
      email,
      password,
      storeName,
      businessType,
      businessCategory,
      phone,
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

exports.findUserByEmail = async (email) => {
  const result = await pool.query(
    `
    SELECT *
    FROM users
    WHERE email = $1
    `,
    [email]
  );

  return result.rows[0];
};

exports.findUserByUsername = async (username) => {
  const result = await pool.query(
    `
    SELECT *
    FROM users
    WHERE username = $1
    `,
    [username]
  );

  return result.rows[0];
};

exports.findUserById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

exports.getUser = async (id) => {
  const result = await pool.query(
    `
    SELECT
      id,
      username,
      email,
      avatar,
      is_online,
      store_name,
      business_type,
      business_category,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      created_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

exports.getAllUsers = async () => {
  const result = await pool.query(
    `
    SELECT
      id,
      username,
      email,
      avatar,
      is_online,
      store_name,
      business_type,
      business_category,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      created_at
    FROM users
    ORDER BY created_at DESC
    `
  );

  return result.rows;
};

exports.updateUser = async (
  id,
  {
    username,
    avatar,
    storeName,
    businessType,
    businessCategory,
    phone,
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
    UPDATE users
    SET
      username = COALESCE($1, username),
      avatar = COALESCE($2, avatar),
      store_name = COALESCE($3, store_name),
      business_type = COALESCE($4, business_type),
      business_category = COALESCE($5, business_category),
      phone = COALESCE($6, phone),
      address = COALESCE($7, address),
      city = COALESCE($8, city),
      state = COALESCE($9, state),
      country = COALESCE($10, country),
      pincode = COALESCE($11, pincode),
      language = COALESCE($12, language),
      currency = COALESCE($13, currency),
      timezone = COALESCE($14, timezone)
    WHERE id = $15
    RETURNING
      id,
      username,
      email,
      avatar,
      is_online,
      store_name,
      business_type,
      business_category,
      phone,
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
      username,
      avatar,
      storeName,
      businessType,
      businessCategory,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      language,
      currency,
      timezone,
      id,
    ]
  );

  return result.rows[0];
};

exports.updateOnlineStatus = async (userId, isOnline) => {
  const result = await pool.query(
    `
    UPDATE users
    SET is_online = $1
    WHERE id = $2
    RETURNING
      id,
      username,
      email,
      avatar,
      is_online,
      store_name,
      business_type,
      business_category,
      phone,
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
    [isOnline, userId]
  );

  return result.rows[0];
};

exports.saveOtp = async (
  userId,
  otp,
  expiresAt,
  method
) => {
  await pool.query(
    `
    INSERT INTO login_otps (
      user_id,
      otp,
      expires_at,
      method
    )
    VALUES ($1, $2, $3, $4)
    `,
    [userId, otp, expiresAt, method]
  );
};

exports.getLatestOtp = async (
  userId,
  method
) => {
  const result = await pool.query(
    `
    SELECT *
    FROM login_otps
    WHERE user_id = $1
      AND method = $2
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId, method]
  );

  return result.rows[0];
};

exports.canResendOtp = async (
  userId,
  method
) => {
  const result = await pool.query(
    `
    SELECT created_at
    FROM login_otps
    WHERE user_id = $1
      AND method = $2
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId, method]
  );

  if (!result.rows[0]) {
    return true;
  }

  const lastSentAt = new Date(result.rows[0].created_at);
  const now = new Date();

  const elapsedSeconds =
    (now.getTime() - lastSentAt.getTime()) / 1000;

  return elapsedSeconds >= 90;
};

exports.getResendTime = async (
  userId,
  method
) => {
  const result = await pool.query(
    `
    SELECT created_at
    FROM login_otps
    WHERE user_id = $1
      AND method = $2
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId, method]
  );

  if (!result.rows[0]) {
    return 0;
  }

  const lastSentAt = new Date(result.rows[0].created_at);
  const now = new Date();

  const elapsedSeconds =
    (now.getTime() - lastSentAt.getTime()) / 1000;

  return Math.max(
    0,
    Math.ceil(90 - elapsedSeconds)
  );
};

exports.deleteOtp = async (
  userId,
  method
) => {
  await pool.query(
    `
    DELETE FROM login_otps
    WHERE user_id = $1
      AND method = $2
    `,
    [userId, method]
  );
};