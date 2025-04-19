// /src/components/HitSplat.jsx
import React, { useEffect, useState } from "react";
import "../css/HitSplat.css";

export default function HitSplat({ value, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  const isBlock = value === 0;

  return (
    <div className={`hitsplat ${isBlock ? "blocked" : "hit"}`}>
      <span className="hitsplat-text">{value}</span>
    </div>
  );
}
