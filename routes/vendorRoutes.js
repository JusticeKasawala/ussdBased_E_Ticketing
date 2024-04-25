//routes/vendorRoutes.js

const express = require('express');
const router = express.Router();
const vendorController = require ('../controllers/vendorController');
const {validateToken} = require('../JWT');
const middleware = require('../middleware/middleware');

// define routes for vendor operations
router.post('/addvendor', validateToken, middleware.is_admin , vendorController.addVendor);
router.get('/',vendorController.getAllVendors, validateToken,middleware.is_admin); //get all vendors
router.delete('/remove', vendorController.deleteVendor, validateToken,middleware.is_admin);
router.get('/byid', vendorController.getVendorById, validateToken, middleware.is_admin);//get a specific vendor by id

module.exports = router;