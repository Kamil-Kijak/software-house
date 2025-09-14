
require("dotenv").config();


const express = require("express");
const http = require("http");

const app = express();


const server = http.createServer(app);

server.listen(process.env.PORT || 3000, process.env.HOSTNAME || "0.0.0.0", () => {
    console.log(`Server is listening on port ${process.env.PORT || 3000}`);
});