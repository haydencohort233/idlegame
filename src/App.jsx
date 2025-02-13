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

function App() {
    const handleOfflineEarnings = usePlayerStore((state) => state.handleOfflineEarnings);
    const gainGold = usePlayerStore((state) => state.gainGold);
    const location = usePlayerStore((state) => state.location);
    const [offlineGoldMessage, setOfflineGoldMessage] = useState("");
    
    // Get current location data from JSON
    const currentLocationData = locationsData[location] || {};

    useEffect(() => {
        const goldGained = handleOfflineEarnings();
        if (goldGained > 100) {
            setOfflineGoldMessage(`While you were gone, you gained ${goldGained} gold!`);
        }

        const interval = setInterval(() => {
            gainGold(10);
        }, 1000);

        return () => clearInterval(interval);
    }, [handleOfflineEarnings, gainGold]);

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
        </div>
    );
}

export default App;
