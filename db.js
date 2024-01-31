const {Sequelize} = require('sequelize');

const sequelize = new Sequelize(
    'market_ticketing',
    'root',
    '',{
        dialect: 'mysql',
        host   : 'localhost'
    }


);

const connectToDb = async ()=>{
    try{
        await sequelize.authenticate();
        console.log("connected to db ")

    }
    catch(error){
        console.log(error);
    }
}

module.exports = {sequelize , connectToDb }
