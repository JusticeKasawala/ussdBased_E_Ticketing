const db = require('./db');
const pgp = require('pg-promise')();

// Run the migration script to create tables if they don't exist
async function createTables() {
  try {
    // district
    await db.query(`
      CREATE TABLE IF NOT EXISTS district (
        district_id SERIAL PRIMARY KEY,
        district_name VARCHAR(255) NOT NULL UNIQUE
      )
    `);

    await db.query(`
    INSERT INTO district (district_name)
    SELECT new_districts.district_name
    FROM (
        VALUES
            ('Dedza'), ('Dowa'), ('Kasungu'), ('Lilongwe'), ('Mchinji'),
            ('Nkhotakota'), ('Ntcheu'), ('Ntchisi'), ('Salima'),
            ('Chitipa'), ('Karonga'), ('Mzimba'), ('NkhataBay'), ('Rumphi'),
            ('Balaka'), ('Blantyre'), ('Chikhwawa'), ('Chiradzulu'), ('Machinga'),
            ('Mangochi'), ('Mulanje'), ('Mwanza'), ('Neno'), ('Nsanje'),
            ('Phalombe'), ('Thyolo'), ('Zomba'), ('Likoma')
    ) AS new_districts (district_name)
    LEFT JOIN district d ON new_districts.district_name = d.district_name
    WHERE d.district_name IS NULL;
    `);

    // my_table
    await db.query(`
      CREATE TABLE IF NOT EXISTS my_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        payment_status VARCHAR(255) NOT NULL,
        district_id INT REFERENCES district(district_id) ON DELETE CASCADE
      );
    `);

    // markets
    await db.query(`
      CREATE TABLE IF NOT EXISTS markets (
        id SERIAL PRIMARY KEY,
        market_name VARCHAR(255) NOT NULL,
        district_id INT REFERENCES district(district_id) ON DELETE CASCADE,
        markert_row_no INT NOT NULL,
        position VARCHAR(255) NOT NULL,
        neighbor_name VARCHAR(255) NOT NULL,
        market_id INT REFERENCES my_table(id) ON DELETE CASCADE
      );
    `);

    console.log('Tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    pgp.end();
  }
}

createTables();
