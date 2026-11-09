
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        message: "Name must be 100 characters or fewer.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and at most 72 bytes.",
      });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: "Account created successfully.",
      user,
      token: createToken(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Signup failed:", error.message);
    return res.status(500).json({
      message: "Unable to create account right now.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: createToken(user),
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({
      message: "Unable to log in right now.",
    });
  }
});
// PATCH /api/auth/change-password
const authenticateToken = require("../middleware/auth");

// GET /api/auth/profile
// Load the logged-in user's profile from PostgreSQL.
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Load profile failed:", error.message);

    return res.status(500).json({
      message: "Unable to load profile.",
    });
  }
});

// PATCH /api/auth/profile
// Save name, email, and optionally password in PostgreSQL.
router.patch("/profile", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      email,
      currentPassword,
      newPassword,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      !email.trim() ||
      email.trim().length > 255
    ) {
      return res.status(400).json({
        message: "Enter a valid name and email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const changingPassword =
      currentPassword !== undefined ||
      newPassword !== undefined;

    if (changingPassword) {
      if (
        typeof currentPassword !== "string" ||
        !currentPassword ||
        typeof newPassword !== "string" ||
        !newPassword
      ) {
        return res.status(400).json({
          message: "Enter both your current and new passwords.",
        });
      }

      if (
        newPassword.length < 8 ||
        Buffer.byteLength(newPassword, "utf8") > 72
      ) {
        return res.status(400).json({
          message:
            "New password must be at least 8 characters and at most 72 bytes.",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          message: "Choose a password different from your current one.",
        });
      }
    }

    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id, password_hash
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "User account not found.",
      });
    }

    if (changingPassword) {
      const matches = await bcrypt.compare(
        currentPassword,
        existing.rows[0].password_hash
      );

      if (!matches) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Current password is incorrect.",
        });
      }
    }

    let query;
    let values;

    if (changingPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 12);

      query = `
        UPDATE users
        SET name = $1, email = $2, password_hash = $3
        WHERE id = $4
        RETURNING id, name, email
      `;

      values = [
        name.trim(),
        normalizedEmail,
        passwordHash,
        req.user.id,
      ];
    } else {
      query = `
        UPDATE users
        SET name = $1, email = $2
        WHERE id = $3
        RETURNING id, name, email
      `;

      values = [
        name.trim(),
        normalizedEmail,
        req.user.id,
      ];
    }

    const updated = await client.query(query, values);

    await client.query("COMMIT");

    return res.json({
      message: "Profile updated successfully.",
      user: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(409).json({
        message: "That email address is already registered.",
      });
    }

    console.error("Update profile failed:", error.message);

    return res.status(500).json({
      message: "Unable to update profile.",
    });
  } finally {
    client.release();
  }
});
module.exports = router;
