
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "./ReportCards.css";

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getReadingDate(reading) {
  return String(
    reading.reading_date || reading.readingDate || reading.date || ""
  ).slice(0, 10);
}

function getGlucoseValue(reading) {
  const value = Number(
    reading.glucose_value ?? reading.glucoseValue ?? reading.value
  );

  return Number.isFinite(value) ? value : null;
}

function calculateStats(readings) {
  const values = readings
    .map(getGlucoseValue)
    .filter((value) => value !== null);

  if (values.length === 0) {
    return { count: 0, average: null, highest: null, lowest: null };
  }

  return {
    count: values.length,
    average: Math.round(
      values.reduce((sum, value) => sum + value, 0) / values.length
    ),
    highest: Math.max(...values),
    lowest: Math.min(...values),
  };
}

function StatsGroup({ title, description, readings }) {
  const stats = calculateStats(readings);

  return (
    <section className="report-group">
      <div className="report-group-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="report-count">
          {stats.count} {stats.count === 1 ? "reading" : "readings"}
        </span>
      </div>

      <div className="report-stat-grid">
        <article className="report-stat">
          <span>Average</span>
          <strong>
            {stats.average === null ? "—" : stats.average}
          </strong>
          <small>mg/dL</small>
        </article>

        <article className="report-stat">
          <span>Highest</span>
          <strong>
            {stats.highest === null ? "—" : stats.highest}
          </strong>
          <small>mg/dL</small>
        </article>

        <article className="report-stat">
          <span>Lowest</span>
          <strong>
            {stats.lowest === null ? "—" : stats.lowest}
          </strong>
          <small>mg/dL</small>
        </article>
      </div>

      {stats.count === 0 && (
        <p className="report-empty">
          No readings are recorded for this period.
        </p>
      )}
    </section>
  );
}

export default function ReportCards({ refreshKey = 0 }) {
  const [readings, setReadings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    () => localDateString(new Date())
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        "Could not load readings for the reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReadings();
  }, [loadReadings, refreshKey]);

  const selectedMonth = selectedDate.slice(0, 7);
  const [year, month] = selectedMonth.split("-").map(Number);

  const previousMonthDate = new Date(year, month - 2, 1);
  const previousMonth = localDateString(previousMonthDate).slice(0, 7);

  const dailyReadings = readings.filter(
    (reading) => getReadingDate(reading) === selectedDate
  );

  const monthReadings = readings.filter((reading) => {
    const date = getReadingDate(reading);
    return date >= `${selectedMonth}-01` && date <= selectedDate;
  });

  const previousMonthReadings = readings.filter((reading) =>
    getReadingDate(reading).startsWith(previousMonth)
  );

  function formatMonth(monthString) {
    const [y, m] = monthString.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="reports-page">
      <div className="reports-title-row">
        <div>
          <h2>Glucose Reports</h2>
          <p>Review your recorded blood glucose measurements.</p>
        </div>

        <button
          type="button"
          className="reports-refresh"
          onClick={loadReadings}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="report-date-picker">
        <label htmlFor="report-date">Choose report date</label>
        <input
          id="report-date"
          type="date"
          max={localDateString(new Date())}
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </div>

      {error && (
        <div className="reports-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="report-loading">Loading reports...</p>
      ) : !error ? (
        <>
          <StatsGroup
            title="Daily Report"
            description={`Readings for ${selectedDate}`}
            readings={dailyReadings}
          />

          <StatsGroup
            title="Month-to-Date Report"
            description={`From ${formatMonth(selectedMonth)} through ${selectedDate}`}
            readings={monthReadings}
          />

          <StatsGroup
            title="Previous Month Report"
            description={formatMonth(previousMonth)}
            readings={previousMonthReadings}
          />

          <p className="report-disclaimer">
            These statistics summarize recorded measurements only. They do
            not diagnose a condition or replace advice from your healthcare
            professional.
          </p>
        </>
      ) : null}
    </div>
  );
}
