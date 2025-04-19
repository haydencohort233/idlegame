// /src/utils/enemySpawn.js
import enemiesData from "../data/enemies.json";
import usePlayerStore from "../store/usePlayerStore";

export const getEnemiesForCurrentLocation = () => {
  const currentLocation = usePlayerStore.getState().location;
  console.log("getEnemiesForCurrentLocation: currentLocation =", currentLocation);

  // Filter enemies that have a spawnArea including the current location.
  const availableEnemies = enemiesData.filter(enemy =>
    enemy.spawnAreas.includes(currentLocation)
  );
  console.log("Available enemies for current location:", availableEnemies);

  const enemyCooldowns = usePlayerStore.getState().enemyCooldowns || {};

  return availableEnemies.map(enemy => ({
    ...enemy,
    onCooldown: enemyCooldowns[enemy.id] && enemyCooldowns[enemy.id] > Date.now()
  }));
};
