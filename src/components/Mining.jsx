import React, { useState, useEffect } from "react";
import usePlayerStore from "../store/usePlayerStore";
import rocksData from "../data/rocks.json";

const Mining = () => {
  const [selectedRock, setSelectedRock] = useState(null);
  const activeSkillTask = usePlayerStore((state) => state.activeSkillTask);
  const startSkillTask = usePlayerStore((state) => state.startSkillTask);
  const stopSkillTask = usePlayerStore((state) => state.stopSkillTask);
  const updateAchievement = usePlayerStore((state) => state.updateAchievement);
  const currentLocation = usePlayerStore((state) => state.location);
  const miningSkill = usePlayerStore((state) => state.skills.mining);

  // Use useEffect to update achievement for reaching level 5 without causing side effects during render.
  useEffect(() => {
    if (miningSkill.level >= 5) {
      updateAchievement("reach_level_5_mining", 0, miningSkill.level);
    }
  }, [miningSkill.level, updateAchievement]);

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

  return (
    <div>
      <h2>Mining</h2>

      {activeSkillTask ? (
        <div>
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
                <button key={rockId} className="mining-btn" onClick={() => handleStartMining(rockId)}>
                  {rock.image && <img src={rock.image} alt={rock.name} className="rock-icon" />}
                  {rock.name}{" "}
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
