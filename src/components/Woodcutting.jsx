import React, { useState, useEffect } from "react";
import usePlayerStore from "../store/usePlayerStore";
import activeWoodcuttingGif from "/assets/images/icons/active-mining.gif";
import treesData from "../data/trees.json";
import "../css/Woodcutting.css";

const Woodcutting = () => {
  const [selectedTree, setSelectedTree] = useState(null);
  const [dummy, setDummy] = useState(0); // used to trigger re-render for elapsed time

  const activeSkillTask = usePlayerStore((state) => state.activeSkillTask);
  const startSkillTask = usePlayerStore((state) => state.startSkillTask);
  const stopSkillTask = usePlayerStore((state) => state.stopSkillTask);
  const woodcuttingSkill = usePlayerStore((state) => state.skills.woodcutting);
  const currentLocation = usePlayerStore((state) => state.location);

  // Timer update for elapsed time.
  useEffect(() => {
    if (activeSkillTask && activeSkillTask.taskKey === "woodcutting") {
      const timerId = setInterval(() => setDummy((prev) => prev + 1), 1000);
      return () => clearInterval(timerId);
    }
  }, [activeSkillTask]);

  // Filter trees available in current location.
  const availableTrees = Object.keys(treesData).filter(
    (treeId) => treesData[treeId].locations.includes(currentLocation.toLowerCase())
  );

  const handleStartWoodcutting = (treeId) => {
    const tree = treesData[treeId];
    if (!tree) return;

    if (woodcuttingSkill.level < tree.level_req) {
      alert(`You need woodcutting level ${tree.level_req} to chop ${tree.name}.`);
      return;
    }

    startSkillTask("woodcutting", { treeId, interval: tree.interval });
    setSelectedTree(tree);
  };

  const handleStopWoodcutting = () => {
    stopSkillTask();
    setSelectedTree(null);
  };

  return (
    <div>
      {activeSkillTask && activeSkillTask.taskKey === "woodcutting" ? (
        <div>
          <img
            src={activeWoodcuttingGif}
            alt="Woodcutting in progress"
            className="active-woodcutting-image"
          />
          <p>
            Chopping {selectedTree ? selectedTree.name : "…"} (Elapsed:{" "}
            {Math.floor((Date.now() - activeSkillTask.startTime) / 1000)} sec)
          </p>
          <button onClick={handleStopWoodcutting}>Stop Woodcutting</button>
        </div>
      ) : (
        <div className="button-container">
          {availableTrees.length > 0 ? (
            availableTrees.map((treeId) => {
              const tree = treesData[treeId];
              return (
                <button
                  key={treeId}
                  className="woodcutting-btn"
                  onClick={() => handleStartWoodcutting(treeId)}
                >
                  {tree.image && (
                    <img src={tree.image} alt={tree.name} className="tree-icon" />
                  )}
                  {tree.name}
                </button>
              );
            })
          ) : (
            <p>No trees available here.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Woodcutting;
