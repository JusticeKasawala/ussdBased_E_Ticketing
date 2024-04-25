const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: '2003',
  database: 'market_ticketing',
});

module.exports = sequelize;
