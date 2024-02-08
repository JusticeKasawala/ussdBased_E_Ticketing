const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ussd",
  password: "Jexy@2021",
  port: 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
  };
