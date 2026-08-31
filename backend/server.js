require("dotenv").config({ override: true });
const express = require("express");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");

const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const storeRouter = require("./routes/stores");
const warehouseRouter = require("./routes/warehouses");
const shelfRouter = require("./routes/shelfs");
const subShelfRouter = require("./routes/subshelf");
const searchRouter = require("./routes/search");
const boxRouter = require("./routes/box");
const path = require("path");
const PORT = process.env.PORT || 8081;
console.log("CWD:", process.cwd());
console.log("__dirname:", __dirname);
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/warehouse", warehouseRouter);
app.use("/shelf", shelfRouter);
app.use("/subshelf", subShelfRouter);
app.use("/box", boxRouter);
app.use("/search", searchRouter);
 


const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});