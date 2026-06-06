const { Pool } = require("pg");

// Check if PG_URI environment variable is provided
if (!process.env.PG_URI) {
  console.error(
    "Error: PG_URI is missing in your environment configuration (.env file).",
  );
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.PG_URI,
  // SSL is disabled for local connections, and enabled for Cloud hosting (Render/AWS)
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: isProduction ? 20 : 10, // Fewer connections needed during local testing
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection function
const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL: Successfully connected to the database.");
    client.release();
  } catch (error) {
    console.error(
      "PostgreSQL: Connection failed. Check if your local Postgres service is running.",
    );
    console.error(`Error Details: ${error.message}`);
    process.exit(1);
  }
};

// Helper function for running queries safely
const query = (text, params) => pool.query(text, params);

// Export everything using standard CommonJS syntax
module.exports = {
  pool,
  query,
  connectPostgres,
};
