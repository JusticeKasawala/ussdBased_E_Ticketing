// migrate.js
const db = require('./db');
const { Pool } = require('pg');
require("dotenv").config();

async function createTables() {
  try {
    await db.query(`
    CREATE TABLE IF NOT EXISTS my_table(
      payment_id SERIAL PRIMARY KEY,
      payment_amount DECIMAL(10, 2) DEFAULT 0,
      pin VARCHAR(100) NOT NULL,
      payment_status VARCHAR(255) NOT NULL
    )
`);

// Create the users table with the foreign key constraint
await db.query(`
   CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     full_name VARCHAR(255) NOT NULL,
     district_name VARCHAR(100) NOT NULL,
     market_name VARCHAR(100) NOT NULL,
     business_description TEXT NOT NULL,
     market_row_no VARCHAR(20) NOT NULL,
     position VARCHAR(100) NOT NULL,
     national_id VARCHAR(20) NOT NULL,
     neighbor_name VARCHAR(100) NOT NULL,
     home_district VARCHAR(100) NOT NULL,
     home_village VARCHAR(100) NOT NULL,
     registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
     payment_id INT, 
     FOREIGN KEY (payment_id) REFERENCES my_table(payment_id)
   );
`);
    // Create the district table
    await db.query(`
      CREATE TABLE IF NOT EXISTS district (
        district_id SERIAL PRIMARY KEY,
        district_name VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    // Insert district names only if they don't already exist
    await db.query(`
      INSERT INTO district (district_name)
      SELECT new_districts.district_name
      FROM (
        VALUES
          ('Zomba'), ('Likangala'), ('Domasi'), ('Chingale'), ('Muluma'), ('Namilongo'), ('Forgottn(TODO)')
      ) AS new_districts (district_name)
      LEFT JOIN district d ON new_districts.district_name = d.district_name
      WHERE d.district_name IS NULL;
    `);

    // Create the superAdmin table
    await db.query(`
      CREATE TABLE IF NOT EXISTS superAdmin (
        sadmin_id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        superadminpassword_hash VARCHAR(255) NOT NULL,
        district_id INT,
        FOREIGN KEY (district_id) REFERENCES district(district_id)
      );
    `);
    // Create the suboffice table
    await db.query(`
      CREATE TABLE IF NOT EXISTS suboffice (
        suboffice_id SERIAL PRIMARY KEY,
        suboffice_name VARCHAR(255) UNIQUE NOT NULL,
        district_id INT NOT NULL,
        FOREIGN KEY (district_id) REFERENCES district(district_id)
      );
    `);

    // Insert suboffice names only if they don't already exist
    await db.query(`
      INSERT INTO suboffice (suboffice_name, district_id)
      SELECT new_suboffices.suboffice_name, new_suboffices.district_id
      FROM (
        VALUES
          ('Likangala', 1), ('Domasi', 1), ('Chingale', 1), ('Muluma', 1), ('Namilongo', 1), ('Forgottn(TODO)', 1)
      ) AS new_suboffices (suboffice_name, district_id)
      LEFT JOIN suboffice s ON new_suboffices.suboffice_name = s.suboffice_name
      WHERE s.suboffice_name IS NULL;
    `);

    // Create the market table
    await db.query(`
      CREATE TABLE IF NOT EXISTS market (
        market_id SERIAL PRIMARY KEY,
        market_name VARCHAR(255) UNIQUE NOT NULL,
        suboffice_id INT NOT NULL,
        FOREIGN KEY (suboffice_id) REFERENCES suboffice(suboffice_id)
      );
    `);

    // Insert market names only if they don't already exist
    await db.query(`
      INSERT INTO market (market_name, suboffice_id)
      SELECT new_markets.market_name, new_markets.suboffice_id
      FROM (
        VALUES
          ('Juliana', 2), ('Andrew', 2), ('Vin', 2), ('Justice', 2), ('Annie', 2), ('Evelyn', 2), ('Deborah', 2),
          ('Matias', 1), ('Amos', 1), ('Misheck', 1), ('Nafunesi', 1), ('Miracle', 1),
          ('Chikanda', 3), ('Mponda', 3), ('Chinamwali', 3), ('Kaluluma', 3), ('Msulira', 3),
          ('Yosefe', 4), ('Grace', 4), ('Joyce', 4), ('Maliko', 4), ('Geoffrey', 4),
          ('Kasawala', 5), ('Mbewe', 5), ('Abiton', 5), ('Steven', 5), ('Elia', 5), ('Chafika', 5),
          ('Thulawena', 6), ('Gracious', 6), ('Mary', 6), ('Billy', 6), ('Drake', 6), ('Honey', 6)
      ) AS new_markets (market_name, suboffice_id)
      LEFT JOIN market m ON new_markets.market_name = m.market_name
      WHERE m.market_name IS NULL;
    `);

    // Create the admin table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin (
        admin_id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        district_id INT,
        suboffice_id INT,
        market_id INT,
        pin_hash VARCHAR(255) NOT NULL,
        FOREIGN KEY (district_id) REFERENCES district(district_id),
        FOREIGN KEY (suboffice_id) REFERENCES suboffice(suboffice_id),
        FOREIGN KEY (market_id) REFERENCES market(market_id)
      );
    `);
    

   

    console.log('Tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } 
}
createTables();
;