const pool = require("../pool");

exports.createUser = async ({
  username,
  email,
  password,
  phone,
}) => {
  const result = await pool.query(
    `
    INSERT INTO users (
      username,
      email,
      password,
      phone,
      avatar,
      is_online,
      email_verified,
      phone_verified,
      onboarding_completed
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      NULL,
      FALSE,
      FALSE,
      FALSE,
      FALSE
    )
    RETURNING
      id,
      username,
      email,
      phone,
      avatar,
      is_online,
      email_verified,
      phone_verified,
      onboarding_completed,
      created_at
    `,
    [username, email, password, phone]
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

exports.findUserByPhone = async (phone) => {
  const result = await pool.query(
    `
    SELECT *
    FROM users
    WHERE phone = $1
    `,
    [phone]
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
      phone,
      avatar,
      is_online,
      email_verified,
      phone_verified,
      onboarding_completed,
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
      phone,
      avatar,
      is_online,
      email_verified,
      phone_verified,
      onboarding_completed,
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
    phone,
  }
) => {
  const result = await pool.query(
    `
    UPDATE users
    SET
      username = COALESCE($1, username),
      avatar = COALESCE($2, avatar),
      phone = COALESCE($3, phone)
    WHERE id = $4
    RETURNING
      id,
      username,
      email,
      phone,
      avatar,
      is_online,
      email_verified,
      phone_verified,
      onboarding_completed,
      created_at
    `,
    [username, avatar, phone, id]
  );

  return result.rows[0];
};

exports.updateOnlineStatus = async (
  userId,
  isOnline
) => {
  const result = await pool.query(
    `
    UPDATE users
    SET is_online = $1
    WHERE id = $2
    RETURNING
      id,
      username,
      email,
      phone,
      avatar,
      is_online,
      email_verified,
      phone_verified,
      onboarding_completed,
      created_at
    `,
    [isOnline, userId]
  );

  return result.rows[0];
};

exports.verifyEmail = async (userId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET email_verified = TRUE
    WHERE id = $1
    RETURNING
      id,
      username,
      email,
      phone,
      email_verified,
      phone_verified,
      onboarding_completed
    `,
    [userId]
  );

  return result.rows[0];
};

exports.verifyPhone = async (userId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET phone_verified = TRUE
    WHERE id = $1
    RETURNING
      id,
      username,
      email,
      phone,
      email_verified,
      phone_verified,
      onboarding_completed
    `,
    [userId]
  );

  return result.rows[0];
};

exports.completeOnboarding = async (userId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET onboarding_completed = TRUE
    WHERE id = $1
    RETURNING
      id,
      username,
      email,
      phone,
      email_verified,
      phone_verified,
      onboarding_completed
    `,
    [userId]
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

  const lastSentAt = new Date(
    result.rows[0].created_at
  );

  const elapsedSeconds =
    (Date.now() - lastSentAt.getTime()) / 1000;

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

  const lastSentAt = new Date(
    result.rows[0].created_at
  );

  const elapsedSeconds =
    (Date.now() - lastSentAt.getTime()) / 1000;

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