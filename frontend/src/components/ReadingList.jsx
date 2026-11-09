
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "./ReadingList.css";

export default function ReadingList({ refreshKey = 0 }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadReadings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/readings");
      const data = response.data;

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.readings)
          ? data.readings
          : [];

      setReadings(items);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load readings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReadings();
  }, [loadReadings, refreshKey]);

  async function handleDelete(reading) {
    const id = reading.id;

    if (id == null) {
      setError("This reading has no ID and cannot be deleted.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      await api.delete(`/readings/${id}`);
      await loadReadings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete this reading."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = String(value).slice(0, 10);
    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return (
    <section className="reading-list-card">
      <div className="reading-list-header">
        <div>
          <h2>Reading History</h2>
          <p>View your recorded glucose readings.</p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadReadings}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="reading-list-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="reading-list-message">Loading readings...</p>
      ) : readings.length === 0 ? (
        <div className="reading-list-empty">
          <h3>No readings yet</h3>
          <p>Add your first glucose reading using the form above.</p>
        </div>
      ) : (
        <div className="reading-table-wrapper">
          <table className="reading-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time slot</th>
                <th>Glucose (mg/dL)</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {readings.map((reading) => (
                <tr key={reading.id}>
                  <td>{formatDate(reading.reading_date)}</td>
                  <td>{reading.time_slot}</td>
                  <td>
                    <strong>{reading.glucose_value}</strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="delete-reading-button"
                      onClick={() => handleDelete(reading)}
                      disabled={deletingId === reading.id}
                    >
                      {deletingId === reading.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="reading-count">
        Total readings: {readings.length}
      </p>
    </section>
  );
}
