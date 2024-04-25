//models/vendor.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vendor = sequelize.define('Vendor',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    vendor_name:{
        type:DataTypes.STRING,
        unique:true,
        allowNull:false,
        validate:{
            max:150
        }
    },
    vendor_pnum:{
        type:DataTypes.STRING,
        unique:true,
        allowNull:false,

    },
    vendor_market:{
        type:DataTypes.STRING,
        allowNull:false,
        validate:{
            max:100
        }
    }
});
module.exports = Vendor;