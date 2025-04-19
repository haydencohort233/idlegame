import usePlayerStore from "../store/usePlayerStore";
import experienceData    from "../data/experience.json";
import { calculateCombatTotals } from "../utils/calculateStats";
import "../css/PlayerStats.css";

function PlayerStats() {
  const {
    name,
    level,
    exp,
    location,
    stats,
    skills: { combat },
    equipped,
    gold,
    currentHealth,
  } = usePlayerStore();

  // compute exp bar
  const nextLevelExp     = experienceData[level] || level * 1000;
  const progressPercent  = Math.min((exp / nextLevelExp) * 100, 100);

  // gold modifier
  let goldModifier = 1;
  Object.values(equipped).forEach(item => {
    if (item?.gold_multiplier) goldModifier += item.gold_multiplier;
  });

  // combat totals with bonuses
  const combatTotals = calculateCombatTotals(combat, Object.values(equipped));

  return (
    <div className="player-stats">
      <h2>{name}</h2>
      <p>Level: {level}</p>

      <div className="exp-container">
        <span>
          EXP: {exp.toLocaleString()} / {nextLevelExp.toLocaleString()}
        </span>
        <div className="exp-bar">
          <div
            className="exp-progress"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <p>Gold: {gold.toLocaleString()}</p>
      <p>Gold Modifier: x{goldModifier.toFixed(2)}</p>
      <p>Location: {location}</p>

      <p>
        Attack: {combatTotals.attack} | Strength: {combatTotals.strength} | Defence:{" "}
        {combatTotals.defence}
      </p>
      <p>
        Magic: {combatTotals.magic} | Ranged: {combatTotals.ranged}
      </p>
      <p>
        Health: {stats.health} | Current Health: {currentHealth}
      </p>
    </div>
  );
}

export default PlayerStats;
