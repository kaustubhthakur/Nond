const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const PORT = process.env.PORT || 8081;
const app = express();
const path = require("path");

app.use(cors({origin: process.env.FRONTEND_URL || "http://localhost:3000",credentials: true, }));
app.use(express.json());
app.use(cookieParser());


const server = http.createServer(app);

server.listen(PORT, () => {console.log(`Server running on port ${PORT}...`);});