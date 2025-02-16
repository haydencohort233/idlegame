import { useEffect, useState } from "react";
import usePlayerStore from "./store/usePlayerStore";
import PlayerStats from "./components/PlayerStats";
import Actions from "./components/Actions";
import Inventory from "./components/Inventory";
import Equipment from "./components/Equipment";
import PlayerSkills from "./components/PlayerSkills";
import Mining from "./components/Mining";
import LocationsMap from "./components/LocationsMap";
import locationsData from "./data/locations.json";
import Achievements from "./components/Achievements";

function App() {
    const handleOfflineEarnings = usePlayerStore((state) => state.handleOfflineEarnings);
    const handleOfflineSkillProgression = usePlayerStore((state) => state.handleOfflineSkillProgression);
    const gainGold = usePlayerStore((state) => state.gainGold);
    const location = usePlayerStore((state) => state.location);
    const [offlineGoldMessage, setOfflineGoldMessage] = useState("");
    
    // Get current location data from JSON
    const currentLocationData = locationsData[location] || {};

    useEffect(() => {
        // Process offline gold earnings
        const goldGained = handleOfflineEarnings();
        // Optionally show a message if gold was gained
        // Process any active mining (or other skills) offline progress
        const offlineTicks = handleOfflineSkillProgression();
        //console.log(`Offline mining progress processed ${offlineTicks} ticks.`);
    
        // Set up any intervals (for online passive progression, etc.)
        const interval = setInterval(() => {
          gainGold(10);
        }, 1000);
    
        return () => clearInterval(interval);
    }, [handleOfflineEarnings, handleOfflineSkillProgression, gainGold]);

    return (
        <div>
            {offlineGoldMessage && <p>{offlineGoldMessage}</p>}
            <PlayerStats />
            <PlayerSkills />

            {/* Conditionally render based on location features */}
            {currentLocationData.features?.mining && <Mining />}

            <LocationsMap />
            <Actions />
            <Inventory />
            <Equipment />
            <Achievements />
        </div>
    );
}

export default App;
