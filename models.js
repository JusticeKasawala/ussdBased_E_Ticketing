const {sequelize}= require ('./db')
const {DataTypes}= require('sequelize');

//define a model of users in the db
const User = sequelize.define('User',{
    name:{ 
        type: DataTypes.STRING,
        validate:{
            max:150
        }
    },

    p_number:{ 
        type: DataTypes.INTEGER,
    
    },
    market:{ 
        type: DataTypes.STRING,
    },

    has_paid:{ 
        type: DataTypes.BOOLEAN,
        defaultValue :false
    },
})
// sequelize.sync()
module.exports = User