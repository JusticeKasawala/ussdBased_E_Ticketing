const express = require("express");
const logger = require('./logger');
const { createTables } = require("./migrate");
const session = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const db = require("./db");
const path = require("path");
const crypto = require('crypto');
const app = express();
const fs=require('fs');
const http = require("http");
const server = http.createServer(app);
const ussdRouter = require("./ussdRouter");
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const cron = require('node-cron');
const port = 3000;
const saltRounds = 10; 
const socketIO = require("socket.io");
const io = socketIO(server);
const {createAndCaptureOrder}=require('./payment')
//id=100,,pin=1234
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "")));
app.use(express.static(path.join(__dirname, 'assets')));
app.use(bodyParser.json());

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
    const { email, admin_pin } = req.body;
   

    if (!email || !admin_pin) {
      return res.status(400).json({ success: false, message: "email and PIN are required" });
    }

    // Retrieve the hashed PIN from the database based on the provided Admin ID
    const adminQuery = `
      SELECT email, pin_hash FROM admin
      WHERE email = $1;
    `;
    const adminResult = await db.query(adminQuery, [email]);

    if (adminResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Admin email not found" });
    }

    const { pin_hash } = adminResult.rows[0];

    // Compare the provided PIN with the hashed PIN in the database
    const pinMatch = await bcrypt.compare(admin_pin, pin_hash);

    if (!pinMatch) {
      return res.status(400).json({ success: false, message: "Invalid PIN" });
    }

    // Set admin_id in the session to indicate successful authentication
    req.session.email = email;

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



 
function authenticate(req, res, next) {
  
  if (req.session && req.session.email) {
    // User is authenticated
    next();
  } else {
    
    res.redirect('/'); // Redirect to your login page
  }
}


app.get('/', (req, res) => {
  res.render('login', { title: 'Home Page' });
});
app.get('/login', (req, res) => {
  res.render('index', { title: 'Home Page' });
  
});
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'sign up page' });
  
});
app.get('/register', (req, res) => {
  res.render('register', { title: 'register' });
});
app.get('/index', (req, res) => {
  res.render('index', { title: 'homepage' });
});

app.get('/profile', authenticate, (req, res) => {
  res.render('profile', { title: 'Profile' });
});

app.get('/users', authenticate, (req, res) => {
  res.render('users', { title: 'users' });
});

app.get('/suboffice', authenticate, (req, res) => {
  res.render('suboffice', { title: 'sub offices' });
});

app.get('/report', authenticate, (req, res) => {
  res.render('report', { title: 'Report' });
});

app.get('/addVendor', authenticate, (req, res) => {
  res.render('addVendor', { title: 'Register vendor' });
});

app.use("/", ussdRouter(app, io));

async function hashAndInsert() {
  try {
    // Check if the super admin already exists
    const superAdminCheckQuery = `SELECT * FROM superAdmin WHERE username = 'Justice Kasawala'`;
    const superAdminCheckResult = await db.query(superAdminCheckQuery);

    if (superAdminCheckResult.rows.length > 0) {
      console.log('Admin already active.');
      return;
    }

    
    const hashedPassword = await bcrypt.hash('1234', 10);

    // Insert the hashed password into the superAdmin table
    await db.query(`
      INSERT INTO superAdmin (username, superadminpassword_hash, district_id)
      VALUES ('Justice Kasawala', $1, 1);
    `, [hashedPassword]);

    console.log('one default superAdmin privillages elevated successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}




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
  const { username, email, password, district_name, market_name } = req.body;
  console.log(req.body);

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
      INSERT INTO admin (username, email, password_hash, pin_hash, district_id, suboffice_id, market_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING admin_id, username, email, pin_hash;
    `;
    const values = [
      username,
      email,
      passwordHash,
      pinHash,
      1, // Assuming district_id is not used in admin table
      suboffice_id,
      market_id,
    ];
    const result = await db.query(insertQuery, values);

    // Send a success response with the newly created admin details and default PIN
    res.status(201).json({
      success: true,
      username: username,
      email: email,
      defaultPIN: defaultPIN
    });
    
  } catch (error) {
    console.error("Error adding admin:", error);
    res.status(500).json({ success: false, message: "Failed to add admin" });
  }
});
app.get('/chartData', async (req, res) => {
  try {
    // Fetch dynamic data from the database based on your business logic
    const salesData = [31, 40, 28, 51, 42, 82, 56]; // Example dynamic data for 'Sales'
    const ticketsData = [11, 32, 45, 32, 34, 52, 41]; // Example dynamic data for 'Tickets'
    const vendorsData = [15, 11, 32, 18, 9, 24, 11]; // Example dynamic data for 'Vendors'

    // Format data for ApexCharts
    const chartData = {
      categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"],
      series: [
        { name: 'Sales', data: salesData },
        { name: 'Tickets', data: ticketsData },
        { name: 'Vendors', data: vendorsData }
      ]
    };

    res.json(chartData); // Send formatted data as JSON response
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/radarChartData', async (req, res) => {
  try {
    // Fetch dynamic data from the database based on your business logic
    const totalTicketsData = [4200, 3000, 20000, 35000, 50000, 18000]; // Example dynamic data for 'Total Tickets'
    const soldTicketsData = [5000, 14000, 28000, 26000, 42000, 21000]; // Example dynamic data for 'Sold tickets'

    // Format data for ECharts radar chart
    const radarChartData = {
      categories: ['Tickets sold', 'Muluma', 'Likangala', 'Domasi', 'Chingale', 'Namilongo'],
      totalTicketsData,
      soldTicketsData,
    };

    res.json(radarChartData); // Send formatted data as JSON response
  } catch (error) {
    console.error('Error fetching radar chart data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




async function addDefaultAdmin() {
  try {
    const adminIdToCheck = 100;
    const hardcodedPIN = '1234'; 
    const hardcodedDistrict = 'zomba'; 
    const hardcodedMarket = 'mponda'; 
    const hardcodedEmail = 'justicekasawala265@gmail.com'; // Hardcoded email

    // Check if the admin with the specified ID already exists
    const adminCheckQuery = `
      SELECT * FROM admin 
      WHERE admin_id = $1
    `;
    const adminCheckResult = await db.query(adminCheckQuery, [adminIdToCheck]);

    if (adminCheckResult.rows.length > 0) {
      console.log(`Default Admin already exists.`);
      return;
    }

    // Hash the hardcoded default PIN using bcrypt
    const pinHash = await bcrypt.hash(hardcodedPIN, 10); // Use appropriate salt rounds

    // Hash the admin's password using bcrypt
    const passwordHash = await bcrypt.hash('default_password', 10); // Use appropriate salt rounds

    // Insert the default admin record into the database with hardcoded values
    const insertQuery = `
      INSERT INTO admin (admin_id, username, password_hash, pin_hash, district_id, market_id, email)
      VALUES ($1, 'default_admin', $2, $3, (SELECT suboffice_id FROM suboffice WHERE suboffice_name = $4), (SELECT market_id FROM market WHERE market_name = $5), $6)
      RETURNING admin_id, username, pin_hash;
    `;
    const values = [adminIdToCheck, passwordHash, pinHash, hardcodedDistrict, hardcodedMarket, hardcodedEmail];
    const result = await db.query(insertQuery, values);

    console.log(`Default admin  added successfully.`);
    
  } catch (error) {
    console.error("Error adding default admin:", error);
  }
}



async function initializeDatabase() {
  try {
    // Create database tables first
    await createTables();
    
    // Tables created successfully, proceed to hash and insert data
    await hashAndInsert();
    // Call the function to add the default admin
addDefaultAdmin();

    // Start your Express server or perform other actions here
    console.log('Database initialization complete.');
  } catch (error) {
    // Error occurred during database initialization
    console.error('Error initializing database:', error);
  }
}

// Call the initializeDatabase function to start database initialization
initializeDatabase();


// Get routes
const DATABASE_NAME = process.env.DB_DATABASE; 

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
app.get("/customers-data", async (req, res) => {
  try {
    const countQuery = "SELECT COUNT(*) AS userCount FROM users";
    const result = await db.query(countQuery);
    console.log("Query Result:", result.rows);
    const userCount = parseInt(result.rows[0].usercount); // Parse the count as an integer
    res.json({ userCount });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




//total tickets

app.get('/sales-data', async (req, res) => {
  try {
    // Fetch the total sales amount from the database
    const result = await db.query('SELECT SUM(payment_amount) AS total_sales FROM my_table');
    const totalSales = result.rows[0].total_sales; // Extract the total sales amount

    res.send({ totalSales }); // Send the total sales amount as JSON response
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching data');
  }
});

// Get user details for a specific sub office
app.get("/api/users", async (req, res) => {

  try {
    const usersResult = await db.query(`
    SELECT 
    u.*, 
    m.market_name, 
    my.payment_amount, 
    my.payment_status, -- Added payment_status column
    s.suboffice_name
FROM 
    users u
JOIN 
    market m ON u.market_name = m.market_name
JOIN 
    suboffice s ON m.suboffice_id = s.suboffice_id
JOIN 
    my_table my ON u.payment_id = my.payment_id;

     
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
    full_name,
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
  console.log("data Received:", req.body);

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
        full_name,
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
      full_name,
      userId,
      pin, // Include the PIN in the response for user reference
    });
  } catch (error) {
    console.error("Error processing registration:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
//delete endpoints
// Edit endpoint
app.put('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  const {
    full_name,
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
    const updateUserResult = await db.query(
      "UPDATE users SET full_name = $1, position = $2, district_name = $3, market_name = $4, market_row_no = $5, national_id = $6, business_description = $7, neighbor_name = $8, home_district = $9, home_village = $10 WHERE id = $11 RETURNING *",
      [
        full_name,
        position,
        district_name,
        market_name,
        market_row_no,
        National_Id,
        business_description,
        neighbor_name,
        home_district,
        home_village,
        userId
      ]
    );

    if (updateUserResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: updateUserResult.rows[0]
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Delete endpoint
app.delete('/api/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const deleteUserResult = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [userId]
    );

    if (deleteUserResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Fetch users endpoint (for demonstration)
app.get('/api/users', async (req, res) => {
  try {
    const usersResult = await db.query("SELECT * FROM users");
    res.json(usersResult.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
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
  const { email, oldPin, newPin } = req.body;

  try {
  

    // Check if adminId, oldPin, and newPin are present in the request body
    if (!email || !oldPin || !newPin) {
      return res.status(400).json({ error: 'email, old pin, and new pin are required' });
    }

    // Check if the admin exists
    const admin = await db.query('SELECT * FROM admin WHERE email = $1', [email]);
  
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
    await db.query('UPDATE admin SET pin_hash = $1 WHERE email = $2', [pinHash, email]);

    res.status(200).json({ message: 'Pin updated successfully' });
  } catch (error) {
    console.error('Error changing pin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to handle admin login

app.post('/admin/login', async (req, res) => {
  const { email, pin } = req.body;

  console.log('Received Form Data:', { email, pin });

  try {
    if (!email || !pin) {
      return res.status(400).json({ message: 'Admin Email and PIN are required' });
    }

    const admin = await db.query('SELECT * FROM admin WHERE email = $1', [email]);
    if (!admin.rows.length) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(pin, admin.rows[0].pin_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect PIN' });
    }

    req.session.email = email;
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
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
//payment
// Create an Express route to handle incoming requests
app.post('/create-order', async (req, res) => {
  try {
      // Get the purchase_units data from the request body
      const purchaseUnits = req.body.purchase_units;

      // Call the function to create and capture an order
      await createAndCaptureOrder(purchaseUnits);

      // Send a success response to the client
      res.status(200).send({ message: 'Order created and payment captured successfully.' });
  } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
      // Send an error response to the client
      res.status(500).send({ error: 'Internal server error' });
  }
});
// Function to get unpaid vendors from the database

// Function to get unpaid vendors from the database
async function getUnpaidVendors() {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.full_name,
        u.district_name,
        u.market_name,
        u.business_description,
        u.market_row_no,
        u.position,
        u.national_id,
        u.neighbor_name,
        u.home_district,
        u.home_village
      FROM users u
      JOIN my_table p ON u.payment_id = p.payment_id
      WHERE p.payment_status != 'paid'
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching unpaid vendors:', error);
    throw error;
  }
}
// Endpoint to get unpaid vendors data
app.get('/api/unpaid-vendors', async (req, res) => {
  try {
    const vendors = await getUnpaidVendors();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unpaid vendors' });
  }
});

// Function to generate PDF report
function generatePDF(vendors) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    try {
      doc.text('Unpaid Vendors', { align: 'center' });
      doc.moveDown();

      // Table header
      const headers = [
        'ID', 'Full Name', 'District Name', 'Market Name', 'Business Description',
        'Market Row No', 'Position', 'National ID', 'Neighbor Name', 'Home District',
        'Home Village'
      ];
      const columnWidths = [40, 80, 80, 80, 120, 80, 80, 80, 80, 80, 80];

      let x = doc.page.margins.left;
      let y = doc.y;

      headers.forEach((header, i) => {
        doc.text(header, x, y, { width: columnWidths[i], align: 'left' });
        x += columnWidths[i];
      });
      doc.moveDown(1.5);

      // Table rows
      vendors.forEach(vendor => {
        x = doc.page.margins.left;
        y = doc.y;

        [
          vendor.id, vendor.full_name, vendor.district_name, vendor.market_name,
          vendor.business_description, vendor.market_row_no, vendor.position,
          vendor.national_id, vendor.neighbor_name, vendor.home_district, vendor.home_village
        ].forEach((text, i) => {
          doc.text(text, x, y, { width: columnWidths[i], align: 'left' });
          x += columnWidths[i];
        });
        doc.moveDown();
      });

      doc.end();
    } catch (error) {
      doc.end();
      reject(error);
    }
  });
}

// Function to send email with PDF attachment
async function sendEmail(pdfData) {
  try {
    const mailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailDetails = {
      from: process.env.EMAIL,
      to: 'justicekasawala265@gmail.com',
      subject: 'Weekly Unpaid Vendors Report',
      text: 'Attached is the PDF report of unpaid vendors for this week.',
      attachments: [
        {
          filename: 'unpaid_vendors.pdf',
          content: pdfData,
          contentType: 'application/pdf'
        },
      ],
    };

    const info = await mailTransporter.sendMail(mailDetails);
    console.log('Email sent successfully:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Schedule task to run every week on Sunday at midnight
cron.schedule('0 0 * * 0', async () => { // This will run at midnight on Sunday
  try {
    const vendors = await getUnpaidVendors();
    if (vendors.length > 0) {
      const pdfData = await generatePDF(vendors); // Wait for PDF generation
      await sendEmail(pdfData);
    } else {
      console.log('No unpaid vendors found.');
    }
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});