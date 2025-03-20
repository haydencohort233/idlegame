import React, { useState, useEffect } from "react";
import usePlayerStore from "../store/usePlayerStore";
import seedsData from "../data/seeds.json";
import patches from "../data/patches.json";
import "../css/Farming.css";

const Farming = () => {
  const location = usePlayerStore((state) => state.location);
  const locationPatches = patches[location]?.patches || [];
  const [activePatchId, setActivePatchId] = useState(
    locationPatches.length > 0 ? locationPatches[0].id : null
  );

  useEffect(() => {
    const newLocationPatches = patches[location]?.patches || [];
    setActivePatchId(
      newLocationPatches.length > 0 ? newLocationPatches[0].id : null
    );
  }, [location]);

  const [showSeedModal, setShowSeedModal] = useState(false);
  const [timer, setTimer] = useState(0);

  const inventory = usePlayerStore((state) => state.inventory);
  const farmingSkill = usePlayerStore((state) => state.skills.farming);
  const equipped = usePlayerStore((state) => state.equipped);
  const addItem = usePlayerStore((state) => state.addItem);
  const removeItem = usePlayerStore((state) => state.removeItem);
  const plantCrop = usePlayerStore((state) => state.plantCrop);
  const harvestCrop = usePlayerStore((state) => state.harvestCrop);
  const farmingPatches = usePlayerStore((state) => state.farmingPatches);

  const patch = activePatchId ? farmingPatches[activePatchId] : null;
  const currentPatchType = patch
    ? patch.plantedCrop?.type || locationPatches.find(p => p.id === activePatchId)?.type
    : null;

  const patchText = currentPatchType === "sapling" ? "Tree Patch" : "Allotment Patch";
  const plantButtonLabel = currentPatchType === "sapling" ? "Plant Sapling" : "Plant Seeds";

  const currentTime = Date.now();
  const elapsed =
    patch && patch.plantedCrop && patch.plantedCrop.plantedAt
      ? currentTime - patch.plantedCrop.plantedAt
      : 0;
  const remainingTime =
    patch && patch.plantedCrop && patch.plantedCrop.growthTime
      ? Math.max(patch.plantedCrop.growthTime - elapsed, 0)
      : 0;

  useEffect(() => {
    let interval;
    if (patch?.plantedCrop?.plantedAt) {
      interval = setInterval(() => {
        const elapsed = Date.now() - patch.plantedCrop.plantedAt;
        const remaining = patch.plantedCrop.growthTime - elapsed;
        setTimer(remaining > 0 ? remaining : 0);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [patch, patch?.plantedCrop]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // Seeds the user can plant
  const availableSeeds = Object.values(seedsData).filter((seed) => {
    const invItem = inventory.find((item) => item.id === seed.id);
    if (!invItem || invItem.quantity < seed.plantQuantity) return false;
    return farmingSkill.level >= seed.level_req;
  });

  const getPatchIdForSeed = (itemType, location) => {
    if (itemType === "sapling") {
      const matchingPatch = locationPatches.find(p => p.type === "sapling");
      return matchingPatch ? matchingPatch.id : null;
    } else if (itemType === "seed") {
      const matchingPatch = locationPatches.find(p => p.type === "seed");
      return matchingPatch ? matchingPatch.id : null;
    }
    return null;
  };

  const seedTypeIcons = {
    seed: "🌱",
    sapling: "🌳"
  };

  const handlePlantClick = () => {
    if (!equipped.tool || equipped.tool.id !== "spade") {
      alert("You need a spade to farm!");
      return;
    }
    setShowSeedModal(true);
  };

  const handleSeedSelect = (seed) => {
    const dynamicPatchId = getPatchIdForSeed(seed.type, location);
    if (!dynamicPatchId) {
      alert(
        `No patch available for ${seed.type === "sapling" ? "tree" : "allotment"} planting in ${location}.`
      );
      return;
    }
    for (let i = 0; i < seed.plantQuantity; i++) {
      removeItem(seed.id);
    }
    const plantedAt = Date.now();
    setActivePatchId(dynamicPatchId);
    plantCrop(dynamicPatchId, {
      seedId: seed.id,
      plantedAt,
      growthTime: seed.growthTime,
      cropYield: seed.cropYield,
      type: seed.type,
    });
    setTimer(seed.growthTime);
    setShowSeedModal(false);
  };

  const handleHarvest = () => {
    const now = Date.now();
    if (!patch?.plantedCrop) return;

    if (now - patch.plantedCrop.plantedAt < patch.plantedCrop.growthTime) {
      alert("The crop is still growing!");
      return;
    }

    const { cropYield, seedId } = patch.plantedCrop;
    if (!cropYield) return;

    const seedData = seedsData[seedId];
    const maxYield = seedData.plantQuantity;
    const minYield = Math.floor(
      1 + (maxYield * 0.5 - 1) * ((farmingSkill.level - 1) / 19)
    );
    const randomYield =
      Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;

    // SPECIAL CASE: If it's oak logs from farming, track them differently
    if (cropYield === "oak_logs") {
      // 1) Give oak logs to inventory
      for (let i = 0; i < randomYield; i++) {
        addItem("oak_logs");
      }
      // 2) Instead of incrementing "oak_logs", we track them as "oak_trees_harvested"
      usePlayerStore.getState().incrementResourceCount("oak_trees_harvested", randomYield);
      // 3) Achievement for oak trees if you want
      usePlayerStore.getState().updateAchievement("harvest_100_oak_trees", randomYield);
    } else {
      // Normal path: e.g. potatoes, cabbages, watermelon, or a generic tree
      for (let i = 0; i < randomYield; i++) {
        addItem(cropYield);
      }
      // Track resource in resourceGatherCounts
      usePlayerStore.getState().incrementResourceCount(cropYield, randomYield);

      // Update achievements if relevant
      if (cropYield === "potato") {
        usePlayerStore.getState().updateAchievement("harvest_100_potatoes", randomYield);
      }
      if (cropYield === "cabbage") {
        usePlayerStore.getState().updateAchievement("harvest_100_cabbages", randomYield);
      }
      if (cropYield === "watermelon") {
        usePlayerStore.getState().updateAchievement("harvest_100_watermelons", randomYield);
      }
      // ... etc. for more seeds
    }

    // Finally, award Farming XP and clear the patch
    const seedExp = seedData.exp || 0;
    harvestCrop(activePatchId, seedExp);
  };

  return (
    <div className="farming-container">
      {patch?.plantedCrop?.plantedAt ? (
        <div className="farm-patch">
          <h3>{patchText}</h3>
          {remainingTime > 0 ? (
            <button className="farm-btn" disabled>
              Growing {formatTime(remainingTime)} Remaining
            </button>
          ) : (
            <button className="farm-btn harvest" onClick={handleHarvest}>
              Harvest
            </button>
          )}
        </div>
      ) : (
        <div>
          <h3>{patchText}</h3>
          <button
            className="farm-btn"
            onClick={handlePlantClick}
            disabled={availableSeeds.length === 0}
          >
            {plantButtonLabel}
          </button>
        </div>
      )}

      {showSeedModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Select a Seed to Plant</h3>
            <div className="farming-button-container">
              {availableSeeds.map((seed) => (
                <button
                  key={seed.id}
                  className="seed-btn"
                  onClick={() => handleSeedSelect(seed)}
                >
                  {seedTypeIcons[seed.type] || ""} {seed.name} (Needs {seed.plantQuantity})
                </button>
              ))}
            </div>
            <button className="close-modal" onClick={() => setShowSeedModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farming;
