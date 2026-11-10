
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

const VALID_SLOTS = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
];

function validateReading(body) {
  const { reading_date, time_slot, glucose_value } = body;

  if (
    typeof reading_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)
  ) {
    return "Please provide a valid date in YYYY-MM-DD format.";
  }

  const date = new Date(`${reading_date}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== reading_date
  ) {
    return "Please provide a valid date.";
  }

  if (!VALID_SLOTS.includes(time_slot)) {
    return "Please select a valid time slot.";
  }

  if (
    glucose_value === undefined ||
    glucose_value === null ||
    glucose_value === ""
  ) {
    return "Please enter a glucose value.";
  }

  const value = Number(glucose_value);

  if (!Number.isInteger(value) || value < 40 || value > 600) {
    return "Value must be a whole number between 40 and 600 mg/dL.";
  }

  return null;
}

async function isFutureDate(date) {
  const result = await pool.query(
    "SELECT $1::date > CURRENT_DATE AS future",
    [date]
  );

  return result.rows[0].future;
}

// GET /api/readings
// View the logged-in user's readings, newest first.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         time_slot,
         glucose_value,
         created_at
       FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, id DESC`,
      [req.user.id]
    );

    res.set("Cache-Control", "no-store");
    res.json({ readings: result.rows });
  } catch (error) {
    console.error("Fetch readings failed:", error.message);
    res.status(500).json({ message: "Unable to fetch readings." });
  }
});

// POST /api/readings
// Add a reading.
router.post("/", async (req, res) => {
  try {
    const validationError = validateReading(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { reading_date, time_slot } = req.body;
    const glucose_value = Number(req.body.glucose_value);

    if (await isFutureDate(reading_date)) {
      return res.status(400).json({
        message: "Date cannot be in the future.",
      });
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [req.user.id, reading_date]
    );

    if (countResult.rows[0].count >= 4) {
      return res.status(400).json({
        message: "You can add only 4 readings per day.",
      });
    }

    const result = await pool.query(
      `INSERT INTO readings
         (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reading_date, time_slot, glucose_value, created_at`,
      [req.user.id, reading_date, time_slot, glucose_value]
    );

    res.status(201).json({
      message: "Reading added successfully.",
      reading: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: `You already have an ${req.body.time_slot} reading for this date.`,
      });
    }

    console.error("Add reading failed:", error.message);
    res.status(500).json({ message: "Unable to add reading." });
  }
});

// PUT /api/readings/:id
// Update only a reading owned by the logged-in user.
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid reading ID." });
    }

    const validationError = validateReading(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { reading_date, time_slot } = req.body;
    const glucose_value = Number(req.body.glucose_value);

    if (await isFutureDate(reading_date)) {
      return res.status(400).json({
        message: "Date cannot be in the future.",
      });
    }

    const existing = await pool.query(
      "SELECT id FROM readings WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Reading not found." });
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1 AND reading_date = $2 AND id <> $3`,
      [req.user.id, reading_date, id]
    );

    if (countResult.rows[0].count >= 4) {
      return res.status(400).json({
        message: "You can add only 4 readings per day.",
      });
    }

    const result = await pool.query(
      `UPDATE readings
       SET reading_date = $1, time_slot = $2, glucose_value = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, reading_date, time_slot, glucose_value, created_at`,
      [reading_date, time_slot, glucose_value, id, req.user.id]
    );

    res.json({
      message: "Reading updated successfully.",
      reading: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A reading already exists for this time slot and date.",
      });
    }

    console.error("Update reading failed:", error.message);
    res.status(500).json({ message: "Unable to update reading." });
  }
});

// DELETE /api/readings/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid reading ID." });
    }

    const result = await pool.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Reading not found." });
    }

    res.json({ message: "Reading deleted successfully." });
  } catch (error) {
    console.error("Delete reading failed:", error.message);
    res.status(500).json({ message: "Unable to delete reading." });
  }
});

module.exports = router;
