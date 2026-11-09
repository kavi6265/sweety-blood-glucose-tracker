
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

async function getReport(userId, startDate, endDate) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS reading_count,
       MAX(glucose_value)::int AS highest,
       MIN(glucose_value)::int AS lowest,
       ROUND(AVG(glucose_value), 1) AS average
     FROM readings
     WHERE user_id = $1
       AND reading_date >= $2::date
       AND reading_date < $3::date`,
    [userId, startDate, endDate]
  );

  const row = result.rows[0];

  return {
    reading_count: row.reading_count,
    highest: row.highest,
    lowest: row.lowest,
    average: row.average === null ? null : Number(row.average),
  };
}

// GET /api/reports/daily?date=2026-11-09
router.get("/daily", async (req, res) => {
  try {
    const date = req.query.date;

    if (!isValidDate(date)) {
      return res.status(400).json({
        message: "Provide a valid date using YYYY-MM-DD.",
      });
    }

    const nextDate = new Date(`${date}T00:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const endDate = nextDate.toISOString().slice(0, 10);

    const summary = await getReport(req.user.id, date, endDate);

    const result = await pool.query(
      `SELECT id, reading_date, time_slot, glucose_value
       FROM readings
       WHERE user_id = $1 AND reading_date = $2::date
       ORDER BY
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
         END`,
      [req.user.id, date]
    );

    res.json({
      report: "daily",
      start_date: date,
      end_date: date,
      ...summary,
      readings: result.rows,
    });
  } catch (error) {
    console.error("Daily report failed:", error.message);
    res.status(500).json({
      message: "Unable to generate daily report.",
    });
  }
});

// GET /api/reports/month-to-date?date=2026-11-09
router.get("/month-to-date", async (req, res) => {
  try {
    const date = req.query.date;

    if (!isValidDate(date)) {
      return res.status(400).json({
        message: "Provide a valid date using YYYY-MM-DD.",
      });
    }

    const today = new Date();
    const currentDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    if (date > currentDate) {
      return res.status(400).json({
        message: "Date cannot be in the future.",
      });
    }

    const startDate = `${date.slice(0, 7)}-01`;
    const nextDate = new Date(`${date}T00:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const endDate = nextDate.toISOString().slice(0, 10);

    const summary = await getReport(req.user.id, startDate, endDate);

    res.json({
      report: "month-to-date",
      start_date: startDate,
      end_date: date,
      ...summary,
    });
  } catch (error) {
    console.error("Month-to-date report failed:", error.message);
    res.status(500).json({
      message: "Unable to generate month-to-date report.",
    });
  }
});

// GET /api/reports/previous-month?date=2026-11-09
router.get("/previous-month", async (req, res) => {
  try {
    const date = req.query.date;

    if (!isValidDate(date)) {
      return res.status(400).json({
        message: "Provide a valid date using YYYY-MM-DD.",
      });
    }

    const selected = new Date(`${date}T00:00:00.000Z`);

    const start = new Date(Date.UTC(
      selected.getUTCFullYear(),
      selected.getUTCMonth() - 1,
      1
    ));

    const end = new Date(Date.UTC(
      selected.getUTCFullYear(),
      selected.getUTCMonth(),
      1
    ));

    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const summary = await getReport(req.user.id, startDate, endDate);

    res.json({
      report: "previous-month",
      start_date: startDate,
      end_date: new Date(end.getTime() - 86400000)
        .toISOString()
        .slice(0, 10),
      ...summary,
    });
  } catch (error) {
    console.error("Previous-month report failed:", error.message);
    res.status(500).json({
      message: "Unable to generate previous-month report.",
    });
  }
});

module.exports = router;
