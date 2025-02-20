import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import "../css/Statistics.css";

function Statistics() {
  const { playerStats } = usePlayerStore();
  const resourceGatherCounts = usePlayerStore((state) => state.resourceGatherCounts);
  
  return (
    <div className="statistics-container">
    <h2>Player Statistics</h2>
      <ul>
        <li>Gold Earned: {playerStats.totalGoldEarned.toLocaleString()}</li>
        <li>Gold Spent: {playerStats.totalGoldSpent.toLocaleString()}</li>
        <li>Items Purchased: {playerStats.totalItemsPurchased}</li>
        <li>Deaths: {playerStats.totalDeaths}</li>

    <h3>Mining Statistics</h3>
        <li>Ores Mined: {playerStats.totalOresMined}</li>
        <li>Copper Ore Mined: {resourceGatherCounts["copper_ore"] || 0}</li>
        <li>Iron Ore Mined: {resourceGatherCounts["iron_ore"] || 0}</li>
        <li>Gold Ore Mined: {resourceGatherCounts["gold_ore"] || 0}</li>
        <li>Mithril Ore Mined: {resourceGatherCounts["mithril_ore"] || 0}</li>
        <li>Runite Ore Mined: {resourceGatherCounts["runite_ore"] || 0}</li>

    <h3>Fishing Statistics</h3>
        <li>Fish Caught: {playerStats.totalFishCaught}</li>
        <li>Raw Shrimps Caught: {resourceGatherCounts["raw_shrimps"] || 0}</li>
        <li>Raw Tuna Caught: {resourceGatherCounts["raw_tuna"] || 0}</li>
        <li>Raw Shark Caught: {resourceGatherCounts["raw_shark"] || 0}</li>
      </ul>
    </div>
  );
}

export default Statistics;
