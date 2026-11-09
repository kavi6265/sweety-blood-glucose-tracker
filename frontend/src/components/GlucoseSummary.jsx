
import { useEffect, useState } from "react";
import api from "../services/api";
import "./GlucoseSummary.css";

function getDate(reading) {
  return String(
    reading.reading_date || reading.readingDate || reading.date || ""
  ).slice(0, 10);
}

function getValue(reading) {
  const value = Number(
    reading.glucose_value ?? reading.glucoseValue ?? reading.value
  );
  return Number.isFinite(value) ? value : null;
}

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function GlucoseSummary({ refreshKey = 0 }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReadings() {
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

        if (active) setReadings(items);
      } catch {
        if (active) setError("Could not load glucose summary.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReadings();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const todayReadings = readings.filter(
    (reading) => getDate(reading) === todayString()
  );

  const todayValues = todayReadings
    .map(getValue)
    .filter((value) => value !== null);

  const allValues = readings
    .map(getValue)
    .filter((value) => value !== null);

  const average =
    allValues.length > 0
      ? Math.round(
          allValues.reduce((sum, value) => sum + value, 0) /
            allValues.length
        )
      : null;

  const highest =
    allValues.length > 0 ? Math.max(...allValues) : null;

  const lowest =
    allValues.length > 0 ? Math.min(...allValues) : null;

  const cards = [
    {
      title: "Today's Readings",
      value: todayValues.length,
      unit: "measurements",
      icon: "📅",
    },
    {
      title: "Overall Average",
      value: average ?? "—",
      unit: average === null ? "No data" : "mg/dL",
      icon: "📊",
    },
    {
      title: "Highest Recorded",
      value: highest ?? "—",
      unit: highest === null ? "No data" : "mg/dL",
      icon: "↗️",
    },
    {
      title: "Lowest Recorded",
      value: lowest ?? "—",
      unit: lowest === null ? "No data" : "mg/dL",
      icon: "↘️",
    },
  ];

  if (loading) return <p>Loading glucose summary...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section className="glucose-summary">
      {cards.map((card) => (
        <article className="glucose-summary-card" key={card.title}>
          <div className="glucose-summary-icon">{card.icon}</div>
          <p>{card.title}</p>
          <strong>{card.value}</strong>
          <span>{card.unit}</span>
        </article>
      ))}
    </section>
  );
}
