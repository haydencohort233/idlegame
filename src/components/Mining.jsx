import React, { useEffect, useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import rocks from "../data/rocks.json";

function Mining() {
  const startTask = usePlayerStore((state) => state.startSkillTask);
  const stopTask = usePlayerStore((state) => state.stopSkillTask);
  const activeTask = usePlayerStore((state) => state.activeSkillTask);
  const miningSkill = usePlayerStore((state) => state.skills.mining);
  const location = usePlayerStore((state) => state.location);

  // For this example, we use copper_rock.
  const availableRock = rocks.copper_rock;

  const [progress, setProgress] = useState(0);

  // Update progress bar based on elapsed time since the task started.
  useEffect(() => {
    let interval;
    if (activeTask && activeTask.taskDefinition.interval) {
      interval = setInterval(() => {
        const elapsed = Date.now() - activeTask.startTime;
        const p = Math.min(elapsed / activeTask.taskDefinition.interval, 1);
        setProgress(p);
      }, 100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [activeTask]);

  const startMining = () => {
    // Only allow mining if the player is in the correct location and meets the level requirement.
    if (location !== "lumbridge" || miningSkill.level < availableRock.level_req) return;
    startTask({
      interval: availableRock.interval, // Use the rock's specific interval (in ms)
      // onTick calls mineTick with the rock's properties.
      onTick: (state) => state.mineTick(state, availableRock),
      // Continue mining only if inventory isn't full and the location is correct.
      condition: (state) => state.inventory.length < 100 && state.location === "lumbridge",
    });
  };

  return (
    <div>
      <h3>Mining</h3>
      <p>
        Mining Level: {miningSkill.level} | EXP: {miningSkill.exp} / {miningSkill.level * 1000}
      </p>
      <div
        style={{
          border: "1px solid #000",
          width: "20%",
          height: "20px",
          marginBottom: "10px",
          position: "relative"
        }}
      >
        <div style={{ background: "green", width: `${progress * 100}%`, height: "100%" }} />
      </div>
      {activeTask ? (
        <button onClick={stopTask}>Stop Mining</button>
      ) : (
        <button onClick={startMining}>
          Start Mining {availableRock.name}
        </button>
      )}
    </div>
  );
}

export default Mining;
