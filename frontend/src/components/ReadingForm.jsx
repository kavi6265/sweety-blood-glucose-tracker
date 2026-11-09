
import { useState } from "react";
import api from "../services/api";
import "./ReadingForm.css";

const SLOTS = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
];

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ReadingForm({ onSaved }) {
  const [form, setForm] = useState({
    reading_date: getToday(),
    time_slot: SLOTS[0],
    glucose_value: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.glucose_value.trim()) {
      setError("Please enter a glucose value.");
      return;
    }

    const value = Number(form.glucose_value);

    if (
      !Number.isInteger(value) ||
      value < 40 ||
      value > 600
    ) {
      setError("Value must be a whole number between 40 and 600 mg/dl.");
      return;
    }

    if (form.reading_date > getToday()) {
      setError("Date cannot be in the future.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/readings", {
        reading_date: form.reading_date,
        time_slot: form.time_slot,
        glucose_value: value,
      });

      setSuccess("Reading added successfully.");

      setForm({
        reading_date: getToday(),
        time_slot: SLOTS[0],
        glucose_value: "",
      });

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to save reading. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="reading-form-card">
      <h2>Add glucose reading</h2>
      <p className="reading-form-description">
        Record your blood glucose level in mg/dL.
      </p>

      {error && (
        <div className="reading-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="reading-success" role="status">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="reading-field">
          <label htmlFor="reading_date">Reading date</label>
          <input
            id="reading_date"
            name="reading_date"
            type="date"
            max={getToday()}
            value={form.reading_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="reading-field">
          <label htmlFor="time_slot">Time slot</label>
          <select
            id="time_slot"
            name="time_slot"
            value={form.time_slot}
            onChange={handleChange}
            required
          >
            {SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="reading-field">
          <label htmlFor="glucose_value">
            Glucose value (mg/dL)
          </label>
          <input
            id="glucose_value"
            name="glucose_value"
            type="number"
            min="40"
            max="600"
            step="1"
            placeholder="Example: 105"
            value={form.glucose_value}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save reading"}
        </button>
      </form>
    </section>
  );
}
