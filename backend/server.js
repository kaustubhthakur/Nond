const express = require("express");
require("dotenv").config();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");

const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const storeRouter = require("./routes/stores");
const warehouseRouter = require("./routes/warehouses");
const shelfRouter = require("./routes/shelfs");
const subShelfRouter = require("./routes/subshelf");
const boxRouter = require("./routes/box");

const PORT = process.env.PORT || 8081;

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", userRouter);

app.use("/store", storeRouter);

app.use("/warehouse", warehouseRouter);
app.use("/shelf", shelfRouter);
app.use("/subshelf", subShelfRouter);
app.use("/box", boxRouter);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});