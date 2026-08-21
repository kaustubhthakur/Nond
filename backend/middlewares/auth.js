const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

  try {

    let token = null;

    if (req.cookies?.access_token) {

      token = req.cookies.access_token;
    }

    else if (req.headers.authorization) {

      token =
        req.headers.authorization.split(" ")[1];
    }

    if (!token) {

      return res.status(401).json({
        error: "You are not logged in"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(401).json({
      error: "Session expired or invalid token"
    });
  }
};

module.exports = verifyToken;