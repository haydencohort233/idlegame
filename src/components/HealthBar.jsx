// /src/components/HealthBar.jsx
import React from "react";
import "../css/HealthBar.css";

export default function HealthBar({ current, max }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="health-bar">
      <div
        className="health-bar-fill"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
