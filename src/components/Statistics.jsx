import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import "../css/Statistics.css";

function Statistics() {
  const { playerStats } = usePlayerStore();
  
  return (
    <div className="statistics-container">
      <h2>Player Statistics</h2>
      <ul>
        <li>Total Gold Earned: {playerStats.totalGoldEarned.toLocaleString()}</li>
        <li>Total Gold Spent: {playerStats.totalGoldSpent.toLocaleString()}</li>
        <li>Total Items Purchased: {playerStats.totalItemsPurchased}</li>
        <li>Total Deaths: {playerStats.totalDeaths}</li>
        <li>Total Ores Mined: {playerStats.totalOresMined}</li>
      </ul>
    </div>
  );
}

export default Statistics;
