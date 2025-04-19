// /src/components/EnemySelection.jsx
import React, { useMemo, useState, useEffect } from "react";
import enemiesData from "../data/enemies.json";
import usePlayerStore from "../store/usePlayerStore";
import { handleSelectEnemy, handleAutoAttack } from "../utils/enemyHandlers";
import "../css/EnemySelection.css";

const EnemySelection = ({ onSelectEnemy }) => {
  const currentLocation = usePlayerStore((state) => state.location);
  const enemyCooldowns = usePlayerStore((state) => state.enemyCooldowns);

  // Use local state to hold the current time, updating every second.
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate available enemies every time currentLocation, enemyCooldowns, or currentTime changes.
  const availableEnemies = useMemo(() => {
    return enemiesData
      .filter((enemy) => enemy.spawnAreas.includes(currentLocation))
      .map((enemy) => {
        const cooldownEnd = enemyCooldowns[enemy.id];
        const isCooling = cooldownEnd && cooldownEnd > currentTime;
        const cooldownRemaining = isCooling
          ? Math.max(0, Math.ceil((cooldownEnd - currentTime) / 1000))
          : 0;
        return {
          ...enemy,
          onCooldown: isCooling,
          cooldownRemaining,
        };
      });
  }, [currentLocation, enemyCooldowns, currentTime]);

  return (
    <div className="enemy-selection">
      {availableEnemies.map((enemy) => {
        const overlayHeight =
          enemy.onCooldown && enemy.cooldown
            ? `${Math.min((enemy.cooldownRemaining / enemy.cooldown) * 100, 100)}%`
            : "0%";
        return (
          <div
            key={enemy.id}
            className={`enemy-card ${enemy.onCooldown ? "cooldown" : "available"}`}
            title={enemy.onCooldown ? `${enemy.name} is regenerating` : enemy.name}
            onClick={() => {
              if (!enemy.onCooldown && typeof onSelectEnemy === "function") {
                onSelectEnemy(enemy.id);
              }
            }}
          >
            <div className="enemy-image-container">
              <img src={enemy.image} alt={enemy.name} className="enemy-image" />
              {enemy.onCooldown && (
                <>
                  <div
                    className="cooldown-overlay"
                    style={{ height: overlayHeight }}
                  ></div>
                  <div className="cooldown-clock">
                    ⏰ {enemy.cooldownRemaining}s
                  </div>
                </>
              )}
            </div>
            <p className="enemy-name">
              {enemy.name}
              {enemy.combatLevel ? ` (Level - ${enemy.combatLevel - 1})` : ""}
            </p>
            <div className="enemy-buttons">
              <button
                disabled={enemy.onCooldown}
                onClick={() => handleSelectEnemy(enemy.id)}
              >
                Fight
              </button>
              <button
                disabled={enemy.onCooldown}
                onClick={() => handleAutoAttack(enemy.id)}
              >
                Auto Attack
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EnemySelection;
