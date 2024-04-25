// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');


  const User = sequelize.define('User', {

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
   
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user'
    }
    
  });

  // Hash password before saving to database
  User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
  });


  module.exports = User;

