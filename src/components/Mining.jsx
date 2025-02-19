import React, { useState, useEffect } from "react";
import usePlayerStore from "../store/usePlayerStore";
import activeMiningGif from "/assets/images/icons/active-mining.gif";
import rocksData from "../data/rocks.json";
import '../css/Mining.css';

const Mining = () => {
  const [selectedRock, setSelectedRock] = useState(null);
  const [dummy, setDummy] = useState(0); // dummy state to trigger re-render for elapsed time

  const activeSkillTask = usePlayerStore((state) => state.activeSkillTask);
  const startSkillTask = usePlayerStore((state) => state.startSkillTask);
  const stopSkillTask = usePlayerStore((state) => state.stopSkillTask);
  const updateAchievement = usePlayerStore((state) => state.updateAchievement);
  const currentLocation = usePlayerStore((state) => state.location);
  const miningSkill = usePlayerStore((state) => state.skills.mining);

  // Update achievement for reaching level 5 without causing side effects during render.
  useEffect(() => {
    if (miningSkill.level >= 5) {
      updateAchievement("reach_level_5_mining", 0, miningSkill.level);
    }
  }, [miningSkill.level, updateAchievement]);

  // Timer to update elapsed time every second (when a mining task is active)
  useEffect(() => {
    if (activeSkillTask) {
      const intervalId = setInterval(() => {
        setDummy(prev => prev + 1);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [activeSkillTask]);

  // Filter rocks to only show those available in the current location
  const availableRocks = Object.keys(rocksData).filter(
    (rockId) => rocksData[rockId].locations.includes(currentLocation.toLowerCase())
  );

  // Called when the player clicks "Start Mining [Rock]" button.
  const handleStartMining = (rockId) => {
    const rock = rocksData[rockId];
    if (!rock) return;

    startSkillTask("mining", { rockId, interval: rock.interval });
    setSelectedRock(rock);
  };

  // Called when the player manually stops mining.
  const handleStopMining = () => {
    stopSkillTask();
    setSelectedRock(null);
  };

  // Active image for mining skill (update the path as needed)
  const activeImages = {
    mining: activeMiningGif,
  };  

  return (
    <div>
      <h2>Mining</h2>

      {activeSkillTask ? (
        <div>
          <img
            src={activeImages.mining}
            alt="Mining in progress"
            className="active-mining-image"
          />
          <p>
            Mining {selectedRock ? selectedRock.name : "…"} (Elapsed:{" "}
            {Math.floor((Date.now() - activeSkillTask.startTime) / 1000)} sec)
          </p>
          <button onClick={handleStopMining}>Stop Mining</button>
        </div>
      ) : (
        <div>
          <p>Select a rock to mine:</p>
          {availableRocks.length > 0 ? (
            availableRocks.map((rockId) => {
              const rock = rocksData[rockId];
              return (
                <button
                  key={rockId}
                  className="mining-btn"
                  onClick={() => handleStartMining(rockId)}
                >
                  {rock.image && (
                    <img src={rock.image} alt={rock.name} className="rock-icon" />
                  )}
                  {rock.name}
                </button>
              );
            })
          ) : (
            <p>No rocks to mine here.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Mining;
