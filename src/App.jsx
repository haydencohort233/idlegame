// App.jsx
import React, { useEffect, useState } from "react";
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
import Fishing from "./components/Fishing";
import Woodcutting from "./components/Woodcutting";
import Farming from "./components/Farming";
import Bank from "./components/Bank";
import WorldMap from "./components/WorldMap";
import EnemySelection from "./components/EnemySelection";
import { handleSelectEnemy } from "./utils/enemyHandlers";
import CombatScreen from "./components/CombatScreen";
import useCurrentTime from "./hooks/useCurrentTime";
import {FaHome, FaBrain, FaTrophy, FaChartBar, FaBoxOpen, FaShieldAlt, FaGlobe} from "react-icons/fa";
import "./css/TabNav.css";
import "./css/Equipment.css";
import "./css/Modal.css";
import "./css/BottomBar.css";
import "./css/TopBar.css";

// hoist Modal out of App so it’s stable
function Modal({ children, onClose, fullScreen = false }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={
          "modal-content" + (fullScreen ? " full-screen" : "")
        }
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function App() {
  const handleOfflineEarnings = usePlayerStore((s) => s.handleOfflineEarnings);
  const handleOfflineSkillProgression = usePlayerStore((s) => s.handleOfflineSkillProgression);
  const gainGold = usePlayerStore((s) => s.gainGold);
  const location = usePlayerStore((s) => s.location);
  const inCombat = useCombatStore((s) => s.inCombat);

  const [currentTab, setCurrentTab] = useState("home");
  const [openBottomModal, setOpenBottomModal] = useState(null);

  const currentLocationData = locationsData[location] || {};
  const currentTime = useCurrentTime();

  useEffect(() => {
    handleOfflineEarnings();
    handleOfflineSkillProgression();
    const interval = setInterval(() => gainGold(10), 1000);
    return () => clearInterval(interval);
  }, [handleOfflineEarnings, handleOfflineSkillProgression, gainGold]);

  useEffect(() => {
    const regen = setInterval(() => {
      if (!inCombat) usePlayerStore.getState().regenerateHealth();
    }, 60000);
    return () => clearInterval(regen);
  }, [inCombat]);

  return (
    <div className="app">
      {inCombat && <CombatScreen />}
      {(openBottomModal === "inventory" || openBottomModal === "equipment") && (
        <Modal onClose={() => setOpenBottomModal(null)}>
          {openBottomModal === "inventory" && <Inventory />}
          {openBottomModal === "equipment"  && <Equipment />}
        </Modal>
      )}
      {openBottomModal === "worldMap" && (
        <WorldMap onClose={() => setOpenBottomModal(null)} />
      )}

      <nav className="top-bar">
        <button
          className={currentTab === "home" ? "active" : ""}
          onClick={() => {
            if (currentTab !== "home") {
              setCurrentTab("home");
              setOpenBottomModal(null);
            }
          }}
        >
          <FaHome size={16} style={{ marginRight: 6 }} />
          Home
        </button>
        <button
          className={currentTab === "skills" ? "active" : ""}
          onClick={() => {
            if (currentTab !== "skills") {
              setCurrentTab("skills");
              setOpenBottomModal(null);
            }
          }}
        >
          <FaBrain size={16} style={{ marginRight: 6 }} />
          Skills
        </button>
        <button
          className={currentTab === "achievements" ? "active" : ""}
          onClick={() => {
            if (currentTab !== "achievements") {
              setCurrentTab("achievements");
              setOpenBottomModal(null);
            }
          }}
        >
          <FaTrophy size={16} style={{ marginRight: 6 }} />
          Achievements
        </button>
        <button
          className={currentTab === "stats" ? "active" : ""}
          onClick={() => {
            if (currentTab !== "stats") {
              setCurrentTab("stats");
              setOpenBottomModal(null);
            }
          }}
        >
          <FaChartBar size={16} style={{ marginRight: 6 }} />
          Statistics
        </button>
      </nav>

      <main className="main-content">
        {currentTab === "home" && (
          <>
            <PlayerStats />
            <ShopList />
            {currentLocationData.features?.mining && <Mining />}
            {currentLocationData.features?.woodcutting && <Woodcutting />}
            {currentLocationData.features?.fishing && <Fishing />}
            {currentLocationData.features?.fishing && <Bank />}
            {currentLocationData.features?.farming && <Farming />}
            {currentLocationData.features?.enemies && (
              <EnemySelection
                onSelectEnemy={handleSelectEnemy}
                currentTime={currentTime}
              />
            )}
            <LocationsMap />
          </>
        )}
        {currentTab === "skills" && <PlayerSkills />}
        {currentTab === "stats" && <Statistics />}
        {currentTab === "achievements" && <Achievements />}
      </main>

      <footer className="bottom-bar">
        <button
          className={openBottomModal === "inventory" ? "active" : ""}
          onClick={() =>
            setOpenBottomModal(
              openBottomModal === "inventory" ? null : "inventory"
            )
          }
        >
          <FaBoxOpen size={20} style={{ marginRight: 6 }} />
          Inventory
        </button>
        <button
          className={openBottomModal === "equipment" ? "active" : ""}
          onClick={() =>
            setOpenBottomModal(
              openBottomModal === "equipment" ? null : "equipment"
            )
          }
        >
          <FaShieldAlt size={20} style={{ marginRight: 6 }} />
          Equipment
        </button>
        <button
          className={openBottomModal === "worldMap" ? "active" : ""}
          onClick={() =>
            setOpenBottomModal(
              openBottomModal === "worldMap" ? null : "worldMap"
            )
          }
        >
          <FaGlobe size={20} style={{ marginRight: 6 }} />
          World Map
        </button>
      </footer>
    </div>
  );
}

export default App;
