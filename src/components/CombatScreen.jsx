// /src/components/CombatScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import useCombatStore from "../store/combatStore";
import usePlayerStore from "../store/usePlayerStore";
import HitSplat from "./HitSplat";
import HealthBar from "./HealthBar";
import "../css/CombatScreen.css";
import "../css/HitSplat.css";

const CombatScreen = () => {
  const inCombat      = useCombatStore(s => s.inCombat);
  const enemy         = useCombatStore(s => s.enemy);
  const combatLog     = useCombatStore(s => s.combatLog);
  const currentTurn   = useCombatStore(s => s.currentTurn);
  const playerAttack  = useCombatStore(s => s.playerAttack);
  const enemyAttack   = useCombatStore(s => s.enemyAttack);
  const runCombat     = useCombatStore(s => s.runCombat);

  const playerName          = usePlayerStore(s => s.name);
  const playerCurrentHealth = usePlayerStore(s => s.currentHealth);
  const playerBaseHealth    = usePlayerStore(s => s.stats.health);

  const logEndRef = useRef(null);
  const [enemyHitAni, setEnemyHitAni]   = useState(false);
  const [playerHitAni, setPlayerHitAni] = useState(false);
  const [hitSplat, setHitSplat]         = useState(null);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [combatLog]);

  // enemy turn
  useEffect(() => {
    if (inCombat && currentTurn === "enemy") {
      const timer = setTimeout(() => {
        const prevHP = usePlayerStore.getState().currentHealth;
        enemyAttack();
        const newHP = usePlayerStore.getState().currentHealth;
        const dmg = prevHP - newHP;
        setHitSplat({ value: dmg, id: Date.now(), target: "player" });
        setPlayerHitAni(true);
        setTimeout(() => setPlayerHitAni(false), 500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [inCombat, currentTurn, enemyAttack]);

  if (!inCombat || !enemy) return null;

  const handlePlayerAttack = () => {
    const prevHP = enemy.currentHp;
    playerAttack();
    const newHP = useCombatStore.getState().enemy.currentHp;
    const dmg = prevHP - newHP;
    setHitSplat({ value: dmg, id: Date.now(), target: "enemy" });
    setEnemyHitAni(true);
    setTimeout(() => setEnemyHitAni(false), 500);
  };

  return (
    <div className="combat-overlay">
      <div className="combat-container">
        <h2>Combat</h2>
        <div className="combat-status">
          <div className="enemy-info">
            <h3>{enemy.name}</h3>
            <div
              className="enemy-image-container"
              style={{ position: "relative" }}
            >
              <HealthBar
                current={enemy.currentHp}
                max={enemy.stats.hp}
              />
              <img
                src={enemy.image}
                alt={enemy.name}
                className={`enemy-image ${
                  enemyHitAni ? "hit-shake" : ""
                }`}
              />
              {hitSplat?.target === "enemy" && (
                <HitSplat
                  key={hitSplat.id}
                  value={hitSplat.value}
                  onDone={() => setHitSplat(null)}
                />
              )}
            </div>
            <p>
              HP: {enemy.currentHp} / {enemy.stats.hp}
            </p>
          </div>
          <div className="player-info">
            <h3>{playerName}</h3>
            <div
              className="player-image-container"
              style={{ position: "relative" }}
            >
              <HealthBar
                current={playerCurrentHealth}
                max={playerBaseHealth}
              />
              <img
                src="/assets/images/player.png"
                alt={playerName}
                className={`player-image ${
                  playerHitAni ? "block-shake" : ""
                }`}
              />
              {hitSplat?.target === "player" && (
                <HitSplat
                  key={hitSplat.id}
                  value={hitSplat.value}
                  onDone={() => setHitSplat(null)}
                />
              )}
            </div>
            <p>
              HP: {playerCurrentHealth} / {playerBaseHealth}
            </p>
          </div>
        </div>
        <div className="combat-actions">
          {currentTurn === "player" ? (
            <>
              <button onClick={handlePlayerAttack}>Attack</button>
              <button onClick={runCombat}>Run</button>
            </>
          ) : (
            <p>Enemy is taking its turn...</p>
          )}
        </div>
        <div className="combat-log">
          <h4>Combat Log</h4>
          {combatLog.map((msg, idx) => (
            <p key={idx}>{msg}</p>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default CombatScreen;
