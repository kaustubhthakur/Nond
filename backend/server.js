const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const PORT = process.env.PORT || 8081;
const app = express();
const path = require("path");
const authrouter = require('./routes/auth')
const userrouter = require('./routes/users')
const storerouter = require('./routes/stores')
const warehouserouter = require('./routes/warehouses')
const shelfrouter = require('./routes/shelfs')

app.use(cors({origin: process.env.FRONTEND_URL || "http://localhost:3000",credentials: true, }));
app.use(express.json());
app.use(cookieParser());
app.use('/auth',authrouter);
app.use('/user',userrouter);
app.use('/store',storerouter);
app.use('/warehouse',warehouserouter)
const server = http.createServer(app);

server.listen(PORT, () => {console.log(`Server running on port ${PORT}...`);});