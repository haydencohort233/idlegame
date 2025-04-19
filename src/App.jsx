import { useEffect, useState } from "react";
import usePlayerStore from "./store/usePlayerStore";
import useCombatStore from "./store/combatStore";
import PlayerStats from "./components/PlayerStats";
import Inventory from "./components/Inventory";
import Equipment from "./components/Equipment";
import PlayerSkills from "./components/PlayerSkills";
import Mining from "./components/Mining";
import LocationsMap from "./components/LocationsMap";
import locationsData from "./data/locations.json";
import Achievements from "./components/Achievements";
import ShopList from "./components/ShopList";
import Statistics from "./components/Statistics";
import "./css/TabNav.css";
import Fishing from "./components/Fishing";
import Woodcutting from "./components/Woodcutting";
import Farming from "./components/Farming";
import Bank from "./components/Bank";
import WorldMap from "./components/WorldMap";
import EnemySelection from "./components/EnemySelection";
import { handleSelectEnemy } from "./utils/enemyHandlers";
import CombatScreen from "./components/CombatScreen";
import useCurrentTime from "./hooks/useCurrentTime";
import AutoAttackToggle from "./components/AutoAttackToggle";

function App() {
  const handleOfflineEarnings = usePlayerStore((state) => state.handleOfflineEarnings);
  const handleOfflineSkillProgression = usePlayerStore((state) => state.handleOfflineSkillProgression);
  const gainGold = usePlayerStore((state) => state.gainGold);
  const location = usePlayerStore((state) => state.location);
  const inCombat = useCombatStore((state) => state.inCombat);
  const [offlineGoldMessage, setOfflineGoldMessage] = useState("");
  const [currentTab, setCurrentTab] = useState("home");

  // Get current location data from JSON
  const currentLocationData = locationsData[location] || {};

    // Get current time from our custom hook.
    const currentTime = useCurrentTime();

  useEffect(() => {
    const goldGained = handleOfflineEarnings();
    const offlineTicks = handleOfflineSkillProgression();
    const interval = setInterval(() => {
      gainGold(10);
    }, 1000);
    return () => clearInterval(interval);
  }, [handleOfflineEarnings, handleOfflineSkillProgression, gainGold]);

  useEffect(() => {
    const regenInterval = setInterval(() => {
      if (!inCombat) { // Only regenerate when not in combat.
        usePlayerStore.getState().regenerateHealth();
      }
    }, 60000);
    return () => clearInterval(regenInterval);
  }, [inCombat]);

  return (
    <div>
      {inCombat && <CombatScreen />}

      <nav className="tab-nav">
        <button 
          className={currentTab === "home" ? "active" : ""}
          onClick={() => setCurrentTab("home")}
        >
          Home
        </button>
        <button 
          className={currentTab === "skills" ? "active" : ""}
          onClick={() => setCurrentTab("skills")}
        >
          Skills
        </button>
        <button 
          className={currentTab === "achievements" ? "active" : ""}
          onClick={() => setCurrentTab("achievements")}
        >
          Achievements
        </button>
        <button 
          className={currentTab === "stats" ? "active" : ""}
          onClick={() => setCurrentTab("stats")}
        >
          Statistics
        </button>
      </nav>
      
      {offlineGoldMessage && <p>{offlineGoldMessage}</p>}
      
      {currentTab === "home" && (
        <>
        <PlayerStats />
          <ShopList />
          {currentLocationData.features?.fishing && <Farming />}
          {currentLocationData.features?.woodcutting && <Woodcutting />}
          {currentLocationData.features?.mining && <Mining />}
          {currentLocationData.features?.fishing && <Fishing />}
          {currentLocationData.features?.fishing && <Bank />}
          {currentLocationData.features?.enemies && (
            <>
              <EnemySelection onSelectEnemy={handleSelectEnemy} currentTime={currentTime} />
            </>
          )}
          <WorldMap />
          <Inventory />
          <Equipment />
        </>
      )}

        {currentTab === "skills" && (
            <>
            <PlayerSkills />
            </>
    )}
      
      {currentTab === "stats" && <Statistics />}

      {currentTab === "achievements" && <Achievements />}
    </div>
  );
}

export default App;
