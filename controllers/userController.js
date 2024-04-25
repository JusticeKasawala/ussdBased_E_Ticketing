// controllers/userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {createTokens,validateToken} = require('../JWT')
const adminMiddleware = require('../middleware/middleware');
const User = require('../models/user');

exports.register = async (req, res) => {
  try {
    // Logic for user registration
    // Extract username, email, password, and role from request body
    const { username, email, password, role } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const newUser = await User.create({ username, email, password, role });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
    
        // Find user by email
        const user = await User.findOne({ where: { email:email } });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid password' });
        }
        else{

         // call the generate  JWT token method
          const accessToken = createTokens(user)

          //cookie
          res.cookie("access-token", accessToken,{
            maxAge: 604800000,
            httpOnly: true,
          });
         // Authentication successful
         res.status(200).json({ message: 'Login successful', user , accessToken});
 
        }

      //login error
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// update profile
exports.updateProfile = async (req, res) => {
    try {
      const userId = req.params.userId; // Assuming you have middleware to attach user to req object
      const { username, email, role, password } = req.body;
  
      // Find the user by ID
      let user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // If the user is not an admin, ensure they cannot change the role
      if (req.user.role !== 'admin' && role) {
        return res.status(403).json({ message: 'Access forbidden' });
      }
  
      // Update user information
      user.username = username || user.username;
      user.email = email || user.email;
  
      // If the user is an admin, allow them to update the role
      if (req.user.role === 'admin' && role) {
        user.role = role;
      }
  
      // If password is provided, hash and update the password
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
      }
  
      // Save the updated user information
      await user.save();
  
      res.status(200).json({ message: 'User profile updated successfully', user });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

exports.getUserById = async (req, res) => {
  try {
    // Logic for fetching user by ID
    const userId = req.params.userId;

    // Find the user by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Logic for getting all users
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Logic for deleting user by ID
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.logout = async (req, res) => {
  try {
      // Clear any session-related data or invalidate access token
      // For example, you can clear the access token from cookies
      res.clearCookie('access-token');

      // Send a response indicating successful logout
      res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
      console.error('Error logging out user:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

