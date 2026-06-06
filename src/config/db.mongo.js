const mongoose = require("mongoose");

// Check if MONGO_URI is provided
if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is missing in your .env file.");
  process.exit(1);
}

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };
