
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const authenticateToken = require("./middleware/auth");
const readingsRoutes = require("./routes/readings");
const reportsRoutes = require("./routes/reports");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/readings", readingsRoutes);
app.use("/api/reports", reportsRoutes);

// API home route
app.get("/", (req, res) => {
  res.json({
    message: "Sweety Blood Glucose Tracker API is running",
    status: "OK",
  });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS database_time"
    );

    res.json({
      status: "OK",
      database: "connected",
      time: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      status: "ERROR",
      database: "disconnected",
      message: "Unable to connect to the database.",
    });
  }
});

// Signup and login routes
app.use("/api/auth", authRoutes);

// Protected route: verify logged-in user
app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({
    message: "Authentication successful.",
    user: req.user,
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
  });
});

// Handle invalid JSON and other request errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON request body.",
    });
  }

  console.error("Server error:", err.message);

  res.status(500).json({
    message: "Internal server error.",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sweety API running at http://localhost:${PORT}`);
});
