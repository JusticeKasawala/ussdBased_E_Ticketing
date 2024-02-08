const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const db = require("./db");
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 5000;

// Middleware
app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", async (req, res) => {
  try {
    const usersResult = await db.query(`
      SELECT my_table.id, my_table.name, my_table.payment_status, markets.market_name, markets.markert_row_no, markets.position, markets.neighbor_name
      FROM my_table
      JOIN markets ON my_table.id = markets.market_id
      ORDER BY my_table.id;
    `);

    const districtsResult = await db.query("SELECT * FROM district");
    const districts = districtsResult.rows;

    const users = usersResult.rows;
    res.render("dashboard", { users, districts });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});
// Add this route after your existing routes
app.get("/api/search", async (req, res) => {
  const { query } = req.query;

  try {
    const searchResult = await db.query(`
      SELECT my_table.id, my_table.name, my_table.payment_status, markets.market_name, markets.markert_row_no, markets.position, markets.neighbor_name
      FROM my_table
      JOIN markets ON my_table.id = markets.market_id
      WHERE my_table.name ILIKE $1 OR CAST(my_table.id AS VARCHAR) ILIKE $1
      ORDER BY my_table.id;
    `, ['%' + query + '%']);

    const users = searchResult.rows;
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/register", async (req, res) => {
  try {
    const districts = await db.query("SELECT * FROM district");
    res.render("register", { districts: districts.rows });
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/districts", async (req, res) => {
  try {
    const districtsResult = await db.query("SELECT * FROM district");
    const districts = districtsResult.rows.map(row => row.district_name); // Extract district names
    res.json({ districts });
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/markets", async (req, res) => {
  const { district } = req.query;

  try {
    const marketsResult = await db.query("SELECT market_name FROM markets WHERE district_id = (SELECT district_id FROM district WHERE district_name = $1)", [district]);

    const markets = marketsResult.rows.map(row => row.market_name);
    res.json({ markets });
  } catch (error) {
    console.error("Error fetching markets:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/users", async (req, res) => {
  const { district, market } = req.query;

  try {
    const usersResult = await db.query(`
      SELECT my_table.id, my_table.name, my_table.payment_status, markets.market_name, markets.markert_row_no, markets.position, markets.neighbor_name
      FROM my_table
      JOIN markets ON my_table.id = markets.market_id
      WHERE my_table.district_id = (SELECT district_id FROM district WHERE district_name = $1)
        AND markets.market_name = $2
      ORDER BY my_table.id;
    `, [district, market]);

    const users = usersResult.rows;
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/register", async (req, res) => {
  const { name, district_name, market_name, markert_row_no, position, neighbor_name } = req.body;

  try {
    // Fetch the district_id based on the selected district_name
    const districtResult = await db.query("SELECT district_id FROM district WHERE district_name = $1", [district_name]);

    if (districtResult.rows.length === 0) {
      // Handle the case where the district is not found
      return res.status(400).send("Invalid district selected");
    }

    const district_id = districtResult.rows[0].district_id;

    // Insert into my_table and retrieve the user ID
    const newUserResult = await db.query(
      "INSERT INTO my_table (name, payment_status, district_id) VALUES ($1, $2, $3) RETURNING id",
      [name, 'unpaid', district_id]
    );

    if (newUserResult.rows.length === 0) {
      // Handle the case where the user insertion failed
      return res.status(500).send("Failed to create a new user");
    }

    const userId = newUserResult.rows[0].id;

    // Insert into markets with the retrieved user ID and markert_row_no
    const result = await db.query(
      "INSERT INTO markets (market_name, markert_row_no, position, neighbor_name, market_id, district_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [market_name, markert_row_no, position, neighbor_name, userId, district_id]
    );

    if (result.rows && result.rows.length > 0) {
      io.emit("paymentUpdate", { serialNumber: userId, paymentStatus: 'unpaid' });
    }

    res.redirect("/");
  } catch (error) {
    console.error("Error processing registration:", error);
    res.status(500).send("Internal Server Error");
  }
});

// WebSocket connections
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
