const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("../src/config/db.mongo");
const { connectPostgres } = require("../src/config/db.pg");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();
connectPostgres();

// Health Check
app.get("/health", (req, res) => {
  return res.send("Server is running fine");
});

// Self-ping to prevent Render free tier spin-down
// Pings every 14 minutes (Render spins down after 15 min of inactivity)
// const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

// const pingServer = () => {
//   const serverUrl =
//     process.env.RENDER_EXTERNAL_URL ||
//     `http://localhost:${process.env.PORT || 5000}`;

//   setInterval(async () => {
//     try {
//       const response = await fetch(`${serverUrl}/health`);
//       console.log(
//         `[Self-Ping] ${new Date().toISOString()} — Status: ${response.status}`,
//       );
//     } catch (error) {
//       console.error(`[Self-Ping] Failed:`, error.message);
//     }
//   }, PING_INTERVAL_MS);
// };

// pingServer();

module.exports = { app };
