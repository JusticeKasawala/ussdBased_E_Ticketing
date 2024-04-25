// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateToken } = require('../JWT');
const middleware = require('../middleware/middleware');

// Define routes for user operations
router.post('/register', userController.register);
router.post('/login', userController.login);
router.put('/:userId', validateToken, userController.updateProfile);
 
router.get('/:userId', userController.getUserById); 
router.get('/', validateToken,middleware.is_admin, userController.getAllUsers); 
router.delete('/:userId', validateToken,middleware.is_admin, userController.deleteUser); 


router.post('/logout', validateToken, userController.logout);
module.exports = router;
 