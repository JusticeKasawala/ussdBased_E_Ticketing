const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const pgp = require('pg-promise')();
const ussdRoute = require("./index");
require('./migrate');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// Pass the express app and socket.io instance to the ussdRoute
app.use("/", ussdRoute(app, io));

// Start the server
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Server is shutting down.');
  pgp.end(); // Close the database connection
  process.exit();
});
