const express = require("express");
const logger = require('./logger');
const session = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const db = require("./db");
const path = require("path");
const crypto = require('crypto');
const app = express();
const http = require("http");
const server = http.createServer(app);
const ussdRouter = require("./ussdRouter");
require("./migrate");
const port = 3000;
const saltRounds = 10; 
const socketIO = require("socket.io");
const io = socketIO(server);
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "")));
app.use(express.static(path.join(__dirname, 'assets')));

// Session middleware
const generateSessionSecret = () => {
  // Generate a random string using crypto's randomBytes method
  const randomBytes = crypto.randomBytes(64).toString('hex');
  return randomBytes;
};
app.use(session({ secret: generateSessionSecret(), resave: true, saveUninitialized: true, cookie: { secure: false } }));

// Authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const { admin_id, admin_pin } = req.body;

    if (!admin_id || !admin_pin) {
      return res.status(400).json({ success: false, message: "Admin ID and PIN are required" });
    }

    // Retrieve the hashed PIN from the database based on the provided Admin ID
    const adminQuery = `
      SELECT admin_id, pin_hash FROM admin
      WHERE admin_id = $1;
    `;
    const adminResult = await db.query(adminQuery, [admin_id]);

    if (adminResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Admin ID not found" });
    }

    const { pin_hash } = adminResult.rows[0];

    // Compare the provided PIN with the hashed PIN in the database
    const pinMatch = await bcrypt.compare(admin_pin, pin_hash);

    if (!pinMatch) {
      return res.status(400).json({ success: false, message: "Invalid PIN" });
    }

    // Set admin_id in the session to indicate successful authentication
    req.session.admin_id = admin_id;

    // Admin authenticated, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error authenticating admin:", error);
    res.status(500).json({ success: false, message: "Failed to authenticate admin" });
  }
};

// Route for handling admin authentication
app.post('/authenticate-admin', authenticateAdmin, (req, res) => {
  res.status(200).json({ success: true, message: "Admin authenticated" });
});



app.use("/", ussdRouter(app, io)); 

app.get('/', (req, res) => {
  res.render('login', { title: 'Home Page' });
});
app.get('/login', (req, res) => {
  res.render('index', { title: 'Home Page' });
});
app.get('/index', (req, res) => {
  res.render('index', { title: 'homepage' });
});
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'sign up' });
});
app.get('/profile', (req, res) => {
  res.render('profile', { title: 'Profile' });
});
app.get('/register', (req, res) => {
  res.render('register', { title: 'register' });
});


app.get('/users', (req, res) => {
  res.render('users', { title: 'users' });
});
app.get('/suboffice', (req, res) => {
  res.render('suboffice', { title: 'sub offices' });
});
app.get('/statistics', (req, res) => {
  res.render('statistics', { title: 'statistics' });
});
app.get('/addVendor', (req, res) => {
  res.render('addVendor', { title: 'Register vendor' });
});

/*async function hashAndInsert() {
  try {
    // Hash the password "1234" with bcrypt
    const hashedPassword = await bcrypt.hash('1234', 10);

    // Insert the hashed password into the superAdmin table
    await db.query(`
      INSERT INTO superAdmin (username, superadminpassword_hash, district_id)
      VALUES ('Justice Kasawala', $1, 1);
    `, [hashedPassword]);

    console.log('Password hashed and inserted successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

hashAndInsert();*/

// Middleware to log requests
app.use((req, res, next) => {
  const { method, path } = req;
  let username = 'Unknown'; // Default username if not found

  // Check if username is available in query params or headers for GET requests
  if (method === 'GET' && (req.query.username || req.headers.username)) {
    username = req.query.username || req.headers.username;
  }

  // Check if username is available in request body for POST requests
  if (method === 'POST' && req.body.username) {
    username = req.body.username;
  }

  // Log the request details
  logger.info(`${username} has made a ${method} request to ${path}`);

  next(); // Call the next middleware in the chain
});



// POST endpoint to add an admin
app.post("/add-admin", async (req, res) => {
  const { username, password, district_name, market_name } = req.body;

  try {
    // Generate a default PIN (e.g., a 4-digit random number)
    const defaultPIN = Math.floor(1000 + Math.random() * 9000);

    // Hash the default PIN using bcrypt
    const pinHash = await bcrypt.hash(defaultPIN.toString(), 10); // Use appropriate salt rounds

    // Check if the user is a super admin
    const superAdminQuery = `
      SELECT superadminpassword_hash, district_id FROM superAdmin
      WHERE username = 'Justice Kasawala'; 
    `;
    const superAdminResult = await db.query(superAdminQuery);

    if (superAdminResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Super admin not found" });
    }

    const { superadminpassword_hash, district_id } = superAdminResult.rows[0];

    // Compare the provided password with the super admin's hashed password
    const passwordMatch = await bcrypt.compare(password, superadminpassword_hash);

    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Get the market_id based on the selected market_name
    const marketQuery = `SELECT market_id FROM market WHERE market_name = $1`;
    const marketResult = await db.query(marketQuery, [market_name]);

    if (marketResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Market not found" });
    }

    const market_id = marketResult.rows[0].market_id;

    // Get the suboffice_id based on the selected district_name
    const subofficeQuery = `SELECT suboffice_id FROM suboffice WHERE suboffice_name = $1`;
    const subofficeResult = await db.query(subofficeQuery, [district_name]);

    if (subofficeResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Suboffice not found" });
    }

    const suboffice_id = subofficeResult.rows[0].suboffice_id;

    // Hash the admin's password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10); // Use appropriate salt rounds

    // Insert the admin record into the database
    const insertQuery = `
      INSERT INTO admin (username, password_hash, pin_hash, district_id, suboffice_id, market_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING admin_id, username, pin_hash;
    `;
    const values = [
      username,
      passwordHash,
      pinHash,
      1, // Assuming district_id is not used in admin table
      suboffice_id,
      market_id,
    ];
    const result = await db.query(insertQuery, values);

    // Send a success response with the newly created admin details and default PIN
    res.status(201).json({ success: true, admin: result.rows[0], defaultPIN });
  } catch (error) {
    console.error("Error adding admin:", error);
    res.status(500).json({ success: false, message: "Failed to add admin" });
  }
});




// Get routes
const DATABASE_NAME = process.env.DB_DATABASE; // Add this line to fetch the database name

app.get("/data", async (req, res) => {
  try {
    // Fetch markets and suboffices from your database
    const markets = await db.query("SELECT market_name FROM market");
    const suboffices = await db.query("SELECT suboffice_name FROM suboffice");

    // Send the fetched data as JSON response
    res.json({ markets: markets.rows, suboffices: suboffices.rows });
  } catch (err) {
    // Check if the error is related to a missing relation or table
    if (err.code === "42P01") {
      // Extract the missing relation or table name from the error message
      const missingEntity = err.message.match(/relation "(.*?)"/)[1];
      // Include more specific error information in the response
      console.error(
        `Error fetching data: Relation "${missingEntity}" not found in database "${DATABASE_NAME}"`
      );
      res
        .status(500)
        .json({
          error: `Relation "${missingEntity}" not found in database "${DATABASE_NAME}"`,
        });
    } else {
      // Handle other errors
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});
// Get user details for a specific sub office
app.get("/api/users", async (req, res) => {

  try {
    const usersResult = await db.query(`
    SELECT u.*, m.market_name, my.payment_amount, s.suboffice_name
    FROM users u
    JOIN market m ON u.market_name = m.market_name
    JOIN suboffice s ON m.suboffice_id = s.suboffice_id
    JOIN my_table my ON u.payment_id = my.payment_id;
     
    `);

    const formattedUsers = usersResult.rows.map((user) => ({
      ...user,
      registration_date: new Date(user.registration_date).toLocaleString(
        "en-US",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      ),
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle the search request
app.get("/search", async (req, res) => {
  try {
    // Extract the suboffice name from the query parameters
    const subofficeName = req.query.suboffice;

    // Query to fetch user details based on the suboffice name
    const query = `
      SELECT *
      FROM users
      WHERE market_name IN (
        SELECT market_name
        FROM market
        WHERE suboffice_id IN (
          SELECT suboffice_id
          FROM suboffice
          WHERE suboffice_name ILIKE $1
        )
      )
    `;

    // Execute the query with the suboffice name as a parameter
    const result = await db.query(query, [subofficeName]);

    // Format the date in each user object
    const formattedUsers = result.rows.map((user) => ({
      ...user, // Spread the user object
      registration_date: new Date(user.registration_date).toLocaleString(
        "en-US",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      ),
    }));

    // Send the formatted users as JSON response
    res.json(formattedUsers);
  } catch (error) {
    console.error("Error searching users by suboffice:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/register", async (req, res) => {
  const {
    name,
    position,
    district_name,
    market_name,
    market_row_no,
    National_Id,
    business_description,
    neighbor_name,
    home_district,
    home_village,
  } = req.body;

  try {
    // Generate a 4-digit random PIN
    const pin = Math.floor(1000 + Math.random() * 9000);
    // Hash the PIN using bcrypt
    const hashedPin = await bcrypt.hash(pin.toString(), saltRounds);

    // Insert into my_table instead of users table
    const newUserResult = await db.query(
      "INSERT INTO my_table (payment_amount, pin, payment_status) VALUES ($1, $2, $3) RETURNING payment_id",
      [0, hashedPin, "pending"]
    );

    if (newUserResult.rows.length === 0) {
      // Handle the case where the user insertion failed
      return res.status(500).send("Failed to create a new user");
    }

    const paymentId = newUserResult.rows[0].payment_id;

    // Insert the remaining data into the users table
    const userIdResult = await db.query(
      "INSERT INTO users (full_name, district_name, market_name, business_description, market_row_no, position, national_id, neighbor_name, home_district, home_village, registration_date, payment_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11) RETURNING id",
      [
        name,
        district_name,
        market_name,
        business_description,
        market_row_no,
        position,
        National_Id,
        neighbor_name,
        home_district,
        home_village,
        paymentId,
      ]
    );

    if (userIdResult.rows.length === 0) {
      // Handle the case where the user insertion failed
      return res.status(500).send("Failed to create a new user");
    }

    const userId = userIdResult.rows[0].id;

    // After inserting data into the database
    res.json({
      success: true,
      message: "User registered successfully",
      userId,
      pin, // Include the PIN in the response for user reference
    });
  } catch (error) {
    console.error("Error processing registration:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
//top markerts
app.get("/top-markets", async (req, res) => {
  try {
    const topMarketsQuery = `
      SELECT
        m.market_name AS market_name,
        s.suboffice_name AS sub_office,
        SUM(mt.payment_amount) AS total_revenue
      FROM users u
      JOIN market m ON u.market_name = m.market_name
      JOIN suboffice s ON m.suboffice_id = s.suboffice_id
      JOIN my_table mt ON u.payment_id = mt.payment_id
      GROUP BY m.market_name, s.suboffice_name
      ORDER BY total_revenue DESC
      LIMIT 10;
    `;

    const topMarketsResult = await db.query(topMarketsQuery);

    res.json({ success: true, data: topMarketsResult.rows });
  } catch (error) {
    console.error("Error fetching top markets:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
//admin list
const getAdminListData = async () => {
  try {
    const adminDataQuery = `
      SELECT
        a.admin_id,
        a.username,
        m.market_name AS Market,
        s.suboffice_name AS Suboffice,
        d.district_name AS District
      FROM admin a
      JOIN market m ON a.market_id = m.market_id
      JOIN suboffice s ON a.suboffice_id = s.suboffice_id
      JOIN district d ON s.district_id = d.district_id
    `;
    
    const adminDataResult = await db.query(adminDataQuery);
   

    return adminDataResult.rows; // Return the fetched admin data results directly
  } catch (error) {
    console.error("Error fetching admin data:", error);
    throw new Error("Failed to fetch admin data");
  }
};

// Define the Express endpoint to handle the admin list data request
app.get("/admin-list-data", async (req, res) => {
  try {
    // Call the getAdminListData function to fetch admin data
    const adminData = await getAdminListData();

    // Send the fetched admin data as JSON response
    res.json({ success: true, data: adminData });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});





// Route to handle changing admin's pin
app.post('/admin/change-pin', async (req, res) => {
  const { adminId, oldPin, newPin } = req.body;

  try {
  

    // Check if adminId, oldPin, and newPin are present in the request body
    if (!adminId || !oldPin || !newPin) {
      return res.status(400).json({ error: 'Admin ID, old pin, and new pin are required' });
    }

    // Check if the admin exists
    const admin = await db.query('SELECT * FROM admin WHERE admin_id = $1', [adminId]);
  
    if (!admin.rows.length) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if the old pin matches the stored hash
    const isMatch = await bcrypt.compare(oldPin, admin.rows[0].pin_hash);
  
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect old pin' });
    }

    // Hash the new pin
    const pinHash = await bcrypt.hash(newPin, saltRounds);

    // Update the admin's pin in the database
    await db.query('UPDATE admin SET pin_hash = $1 WHERE admin_id = $2', [pinHash, adminId]);

    res.status(200).json({ message: 'Pin updated successfully' });
  } catch (error) {
    console.error('Error changing pin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to handle admin login

app.post('/admin/login', async (req, res) => {
  const { adminId, pin } = req.body;

  try {
    // Check if admin ID and PIN are provided
    if (!adminId || !pin) {
      return res.status(400).json({ error: 'Admin ID and PIN are required' });
    }

    // Check if the admin exists
    const admin = await db.query('SELECT * FROM admin WHERE admin_id = $1', [adminId]);
    if (!admin.rows.length) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Compare the provided PIN with the stored hash
    const isMatch = await bcrypt.compare(pin, admin.rows[0].pin_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect PIN' });
    }

    // If login is successful, set session or cookies if needed
    // Example using session:
    req.session.adminId = adminId;

    // Redirect to homepage (index.ejs)
    res.redirect('/index'); // Assuming your homepage route is /index

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/statistics', async (req, res) => {
  try {
      const usersData = await db.query('SELECT * FROM users');
      const paymentsData = await db.query('SELECT * FROM my_table');
      res.json({ usersData, paymentsData });
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

