import { useEffect, useState } from "react";
import usePlayerStore from "./store/usePlayerStore";
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

function App() {
  const handleOfflineEarnings = usePlayerStore((state) => state.handleOfflineEarnings);
  const handleOfflineSkillProgression = usePlayerStore((state) => state.handleOfflineSkillProgression);
  const gainGold = usePlayerStore((state) => state.gainGold);
  const location = usePlayerStore((state) => state.location);
  const [offlineGoldMessage, setOfflineGoldMessage] = useState("");
  const [currentTab, setCurrentTab] = useState("home");

  // Get current location data from JSON
  const currentLocationData = locationsData[location] || {};

  useEffect(() => {
    const goldGained = handleOfflineEarnings();
    const offlineTicks = handleOfflineSkillProgression();
    const interval = setInterval(() => {
      gainGold(10);
    }, 1000);
    return () => clearInterval(interval);
  }, [handleOfflineEarnings, handleOfflineSkillProgression, gainGold]);

  return (
    <div>
      {/* Tab Navigation */}
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
          <LocationsMap />
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
