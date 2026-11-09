import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";
import api from "../services/api";
import "./GlucoseChart.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function GlucoseChart() {

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    loadChart();
  }, []);

  async function loadChart() {

    try {

      const res = await api.get("/readings");

      const readings = Array.isArray(res.data)
        ? res.data
        : res.data.readings || [];

      const sorted = [...readings].sort(
        (a, b) =>
          new Date(a.reading_date) -
          new Date(b.reading_date)
      );

      setChartData({
        labels: sorted.map(r => r.reading_date),
        datasets: [
          {
            label: "Glucose (mg/dL)",
            data: sorted.map(r => r.glucose_value),
            borderColor: "#0f766e",
            backgroundColor: "#99f6e4",
            tension: 0.4
          }
        ]
      });

    } catch (err) {
      console.log(err);
    }

  }

  return (

    <div className="chart-card">

      <h2>Glucose Trend</h2>

      <Line data={chartData} />

    </div>

  );

}