// src/components/Fishing.jsx
import React, { useState, useEffect } from "react";
import usePlayerStore from "../store/usePlayerStore";
import activeFishingGif from "/assets/images/icons/active-mining.gif";
import fishingSpotsData from "../data/fishingSpots.json";
import "../css/Fishing.css";

const Fishing = () => {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [dummy, setDummy] = useState(0); // used to trigger re-renders

  const activeSkillTask = usePlayerStore((state) => state.activeSkillTask);
  const startSkillTask = usePlayerStore((state) => state.startSkillTask);
  const stopSkillTask = usePlayerStore((state) => state.stopSkillTask);
  const currentLocation = usePlayerStore((state) => state.location);
  const fishingSkill = usePlayerStore((state) => state.skills.fishing);
  const updateAchievement = usePlayerStore((state) => state.updateAchievement);
  const inventory = usePlayerStore((state) => state.inventory);

  // (Optional) update achievement when fishing level reaches 5.
  useEffect(() => {
    if (fishingSkill.level >= 5) {
      updateAchievement("reach_level_5_fishing", 0, fishingSkill.level);
    }
  }, [fishingSkill.level, updateAchievement]);

  // Timer update (if a fishing task is active)
  useEffect(() => {
    if (activeSkillTask && activeSkillTask.taskKey === "fishing") {
      const intervalId = setInterval(() => {
        setDummy((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [activeSkillTask]);

  // Filter fishing spots available in the current location.
  const availableSpots = Object.keys(fishingSpotsData).filter(
    (spotId) => fishingSpotsData[spotId].locations.includes(currentLocation.toLowerCase())
  );

  // Start fishing task for a selected spot.
  const handleStartFishing = (spotId) => {
    const spot = fishingSpotsData[spotId];
    if (!spot) return;

    // Check if the player meets the level requirement.
    if (fishingSkill.level < spot.level_req) {
      console.warn(`You need fishing level ${spot.level_req} to fish at ${spot.name}.`);
      return;
    }

    // Check if required bait is available.
    if (spot.requiredBait) {
      const hasBait = inventory.some((item) => item.id === spot.requiredBait);
      if (!hasBait) {
        alert(`You need ${spot.requiredBait} to fish here!`);
        return;
      }
    }

    startSkillTask("fishing", { spotId, interval: spot.interval });
    setSelectedSpot(spot);
  };

  // Stop fishing task.
  const handleStopFishing = () => {
    stopSkillTask();
    setSelectedSpot(null);
  };

  const activeImages = {
    fishing: activeFishingGif,
  };

  return (
    <div>
      {activeSkillTask && activeSkillTask.taskKey === "fishing" ? (
        <div>
          <img
            src={activeImages.fishing}
            alt="Fishing in progress"
            className="active-fishing-image"
          />
          <p>
            Fishing {selectedSpot ? selectedSpot.name : "…"} (Elapsed:{" "}
            {Math.floor((Date.now() - activeSkillTask.startTime) / 1000)} sec)
          </p>
          <button onClick={handleStopFishing}>Stop Fishing</button>
        </div>
      ) : (
        <div>
          {availableSpots.length > 0 ? (
            availableSpots.map((spotId) => {
              const spot = fishingSpotsData[spotId];
              return (
                <button
                  key={spotId}
                  className="fishing-btn"
                  onClick={() => handleStartFishing(spotId)}
                >
                  {spot.image && (
                    <img src={spot.image} alt={spot.name} className="fishing-icon" />
                  )}
                  {spot.name}
                </button>
              );
            })
          ) : (
            <p>No fishing spots here.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Fishing;
