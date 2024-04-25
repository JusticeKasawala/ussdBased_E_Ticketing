const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const sequelize = require('./config/database'); // Require the database.js file
require('dotenv').config();
const cookieParser = require('cookie-parser')




//# import models
const User = require('./models/user');
const Vendor = require('./models/vendor')



const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');

//Create Your Express Application: 
//Initialize your Express application by calling the express() function.
const app = express();

//Configure Middleware: Set up middleware to handle various aspects of incoming requests and responses.
// Middleware like body-parser is used to parse JSON data in request bodies,
// cors is used for enabling Cross-Origin Resource Sharing,
// and morgan is used for logging HTTP requests.
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser())



//# Register routes

app.use('/api/users', userRoutes);
app.use('/api/vendors',vendorRoutes);

app.get('/',(request,response)=>{
    response.status(200).json({message:"hello world"})
})
//Start the Server: Finally, 
//start the Express server and specify the port number to listen on.
const PORT = process.env.PORT || 3000; // Use the provided port or default to 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

sequelize.sync({ force: false }) // Set force: true to drop existing tables and recreate them
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });