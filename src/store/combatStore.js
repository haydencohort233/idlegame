// /src/store/combatStore.js
import { create } from "zustand";
import usePlayerStore from "./usePlayerStore";
import { calculateCombatTotals } from "../utils/calculateStats";
import enemiesData from "../data/enemies.json";
import modifiersData from "../data/modifiers.json";

// Helper: Apply modifiers from modifiersData to an enemy's base stats.
const applyModifiers = (baseEnemy) => {
  const enemy = { ...baseEnemy, stats: { ...baseEnemy.stats } };
  if (enemy.modifierTags && enemy.modifierTags.length > 0) {
    enemy.modifierTags.forEach((tag) => {
      const mod = modifiersData[tag];
      if (mod) {
        if (mod.hpBonus) {
          enemy.stats.hp = Math.floor(enemy.stats.hp * (1 + mod.hpBonus));
        }
        if (mod.attackBonus) {
          enemy.stats.attack += mod.attackBonus;
        }
        if (mod.defenceBonus) {
          enemy.stats.defence += mod.defenceBonus;
        }
        // Add additional modifier effects as needed.
      }
    });
  }
  return enemy;
};

const useCombatStore = create((set, get) => ({
  inCombat: false,
  enemy: null,           // The enemy object with current stats and currentHp
  combatLog: [],
  currentTurn: "player", // "player" always starts for now
  
  // Auto combat settings (optional in case you need to control auto delay, etc.)
  autoCombatEnabled: false,
  autoTurnDelay: 1000,
  toggleAutoCombat: () => set((prev) => ({ autoCombatEnabled: !prev.autoCombatEnabled })),
  setAutoTurnDelay: (delay) => set({ autoTurnDelay: delay }),

  startCombat: (enemyId) => {
    if (get().inCombat) {
      console.warn("Already in combat; startCombat aborted.");
      return;
    }
    const baseEnemy = enemiesData.find((e) => e.id === enemyId);
    if (!baseEnemy) {
      console.error(`Enemy with id ${enemyId} not found.`);
      return;
    }
    const effectiveEnemy = applyModifiers(baseEnemy);
    effectiveEnemy.currentHp = effectiveEnemy.stats.hp;
    set((prev) => ({
      ...prev,
      inCombat: true,
      enemy: effectiveEnemy,
      combatLog: [`A wild ${effectiveEnemy.name} appears!`],
      currentTurn: "player"
    }));
  },

  addCombatLog: (message) =>
    set((prev) => ({ ...prev, combatLog: [...prev.combatLog, message] })),

  playerAttack: () => {
    const { inCombat, enemy } = get();
    if (!inCombat || !enemy) return;
  
    const playerState = usePlayerStore.getState();
    const combatTotals = calculateCombatTotals(
      playerState.skills.combat,
      Object.values(playerState.equipped)
    );
  
    // Hit‐chance based on accuracy & attack level only (no defence here)
    const effectiveAcc =
      playerState.stats.accuracy +
      playerState.skills.combat.attack.level * 5;
    const hitChance = Math.min(
      0.95,
      Math.max(
        0.05,
        effectiveAcc / (effectiveAcc + 100)
      )
    );
  
    if (Math.random() < hitChance) {
      // Base damage from attack + strength
      const baseDamage = combatTotals.attack + combatTotals.strength;
      const variance = Math.random() * 0.4 + 0.8;
      let damage = Math.floor(baseDamage * variance);
  
      // Apply defence mitigation: defence 1.0 → 10% reduction, 10.0 → 100%
      const reduction = Math.min(enemy.stats.defence / 10, 1);
      damage = Math.floor(damage * (1 - reduction));
      if (damage < 0) damage = 0;
  
      // Criticals
      if (Math.random() < playerState.stats.criticalChance / 100) {
        damage = Math.floor(
          damage * playerState.stats.criticalMultiplier
        );
        get().addCombatLog("Critical hit!");
      }
  
      get().addCombatLog(
        `You attack and deal ${damage} damage to ${enemy.name}.`
      );
      const newHp = enemy.currentHp - damage;
      set((prev) => ({
        ...prev,
        enemy: {
          ...prev.enemy,
          currentHp: newHp > 0 ? newHp : 0
        }
      }));
  
      if (newHp <= 0) {
        get().addCombatLog(`You defeated ${enemy.name}!`);
        playerState.incrementEnemyKill(enemy.id);
        const cooldownMs = enemy.cooldown
          ? enemy.cooldown * 1000
          : 60000;
        playerState.setEnemyCooldown(enemy.id, cooldownMs);
        set((prev) => ({
          ...prev,
          inCombat: false,
          enemy: null,
          currentTurn: null,
          combatLog: []
        }));
      } else {
        set((prev) => ({ ...prev, currentTurn: "enemy" }));
      }
    } else {
      get().addCombatLog("Your attack missed!");
      set((prev) => ({ ...prev, currentTurn: "enemy" }));
    }
  },  

  enemyAttack: () => {
    const combatState = get();
    const { enemy } = combatState;
    if (!combatState.inCombat || !enemy) return;
    const playerState = usePlayerStore.getState();
    const combatTotals = calculateCombatTotals(
      playerState.skills.combat,
      Object.values(playerState.equipped)
    );
  
    const hitChance = Math.min(
      0.95,
      Math.max(
        0.05,
        (enemy.stats.attack / 1.5) - (combatTotals.defence / 200)
      )
    );
  
    if (Math.random() < hitChance) {
      const baseDamage = enemy.stats.strength;
      const variance = Math.random() * 0.4 + 0.8;
      let damage = Math.floor(baseDamage * variance);
      const enemyCritChance = (enemy.modifiers && enemy.modifiers.criticalChance) || 5;
  
      if (Math.random() < enemyCritChance / 100) {
        damage = Math.floor(damage * 1.5);
        get().addCombatLog(`${enemy.name} lands a critical hit!`);
      }
  
      if (damage === 0) {
        get().addCombatLog(`${enemy.name} attacks but you block the hit!`);
      } else {
        get().addCombatLog(`${enemy.name} attacks you for ${damage} damage.`);
      }
  
      usePlayerStore.setState((prev) => ({
        currentHealth: Math.max(prev.currentHealth - damage, 0)
      }));
  
      const updatedHealth = usePlayerStore.getState().currentHealth;
      if (updatedHealth <= 0) {
        get().addCombatLog("You were defeated...");
        alert("Oh dear, you have died.");
        usePlayerStore.getState().updatePlayerStats("totalDeaths", 1);
        usePlayerStore.setState((prev) => ({
          currentHealth: prev.stats.health,
          location: "lumbridge"
        }));
        set((prev) => ({
          ...prev,
          inCombat: false,
          enemy: null,
          currentTurn: null,
          combatLog: []
        }));
      } else {
        set((prev) => ({ ...prev, currentTurn: "player" }));
      }
    } else {
      get().addCombatLog(`${enemy.name}'s attack missed!`);
      set((prev) => ({ ...prev, currentTurn: "player" }));
    }
  },  

  runCombat: () => {
    const combatState = get();
    if (Math.random() < 0.5) {
      get().addCombatLog("You managed to run away!");
      set((prev) => ({
        ...prev,
        inCombat: false,
        enemy: null,
        currentTurn: null,
        combatLog: []
      }));
      return true;
    } else {
      get().addCombatLog("You failed to run away!");
      set((prev) => ({ ...prev, currentTurn: "enemy" }));
      return false;
    }
  },

  endCombat: (playerWon) => {
    if (playerWon) {
      get().addCombatLog("Combat ended: Victory!");
    } else {
      get().addCombatLog("You were defeated...");
    }
    set((prev) => ({
      ...prev,
      inCombat: false,
      enemy: null,
      currentTurn: null,
      combatLog: []
    }));
  },

  // New: Simulate the entire combat automatically
  simulateAutoCombat: (enemyId) => {
    // Prevent starting auto combat if already in combat.
    if (get().inCombat) {
      console.warn("Already in combat; simulateAutoCombat aborted.");
      return;
    }
    // Start combat with the selected enemy.
    get().startCombat(enemyId);
    const simulateRound = () => {
      if (!get().inCombat) return;
      if (get().currentTurn === "player") {
        get().playerAttack();
      } else {
        get().enemyAttack();
      }
      // Schedule next round with a very short delay for instant resolution.
      if (get().inCombat) {
        setTimeout(simulateRound, 10);
      }
    };
    simulateRound();
  }
}));

export default useCombatStore;
