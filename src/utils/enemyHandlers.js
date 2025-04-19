// /src/utils/enemyHandlers.js
import useCombatStore from "../store/combatStore";

export const handleSelectEnemy = (enemyId) => {
  console.log("Selected enemy:", enemyId);
  useCombatStore.getState().startCombat(enemyId);
};

export const handleAutoAttack = (enemyId) => {
  console.log("Auto attacking enemy:", enemyId);
  useCombatStore.getState().simulateAutoCombat(enemyId);
};
