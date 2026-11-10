
const bcrypt = require("bcrypt");
const pool = require("./db");

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create or update the demo user.
    const passwordHash = await bcrypt.hash("SweetyDemo123!", 12);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email`,
      ["Sweety Demo", "demo@sweety.com", passwordHash]
    );

    const user = userResult.rows[0];

    // Sample readings for today and yesterday.
    const readings = [
      [0, "Morning (fasting)", 108],
      [0, "After breakfast", 112],
      [0, "After lunch", 125],
      [0, "After dinner", 136],
      [1, "Morning (fasting)", 105],
      [1, "After breakfast", 118],
      [1, "After lunch", 130],
      [1, "After dinner", 140],
    ];

    for (const [daysAgo, timeSlot, glucoseValue] of readings) {
      await client.query(
        `INSERT INTO readings
           (user_id, reading_date, time_slot, glucose_value)
         VALUES ($1, CURRENT_DATE - $2::integer, $3, $4)
         ON CONFLICT (user_id, reading_date, time_slot)
         DO NOTHING`,
        [user.id, daysAgo, timeSlot, glucoseValue]
      );
    }

    await client.query("COMMIT");

    console.log("Database seeded successfully!");
    console.log("Demo email: demo@sweety.com");
    console.log("Demo password: SweetyDemo123!");
    console.log("Sample glucose readings are ready.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
