const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const globalErrorHandler = require("./middlewares/error.middleware.js");
const rootRouter = require("./routes/index.routes.js");
const AppError = require("./utils/errors/AppError.js");

require("dotenv").config();

const { connectDB } = require("../src/config/db.mongo");
const { connectPostgres } = require("../src/config/db.pg");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow only your frontend URL
    credentials: true,
  }),
);

app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.use(
  express.json({
    limit: "10kb",
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith("/api/v1/webhooks")) {
        req.rawBody = buf; // Preserve raw body buffer for Stripe
      }
    },
  }),
);

app.use(express.urlencoded({ extended: true }));
connectDB();
connectPostgres();

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend server is healthy and running.",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", rootRouter);

app.use((req, res, next) => {
  next(
    new AppError(`Cannot find path ${req.originalUrl} on this server.`, 404),
  );
});

app.use(globalErrorHandler);

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
