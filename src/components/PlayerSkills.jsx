import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import experienceData from "../data/experience.json";
import "../css/PlayerSkills.css";

function PlayerSkills() {
  const { skills } = usePlayerStore();

  return (
    <div className="player-skills">
      {Object.entries(skills).map(([name, data]) => {
        if (name === "combat") {
          return Object.entries(data).map(
            ([sub, { level, totalExp = 0 }]) => {
              const nextLevelExp = experienceData[level] || level * 1000;
              const progressPercentage = Math.min(
                (totalExp / nextLevelExp) * 100,
                100
              );
              return (
                <div key={`combat-${sub}`} className="skill">
                  <p className="skill-title">
                    {sub.charAt(0).toUpperCase() + sub.slice(1)}: Level {level}
                  </p>
                  <div className="exp-container">
                    <span>
                      EXP: {totalExp.toLocaleString()} /{" "}
                      {nextLevelExp.toLocaleString()}
                    </span>
                    <div className="skills-exp-bar">
                      <div
                        className="skills-exp-progress"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            }
          );
        }

        const { level, totalExp = 0 } = data;
        const nextLevelExp = experienceData[level] || level * 1000;
        const progressPercentage = Math.min(
          (totalExp / nextLevelExp) * 100,
          100
        );
        return (
          <div key={name} className="skill">
            <p className="skill-title">
              {name.charAt(0).toUpperCase() + name.slice(1)}: Level {level}
            </p>
            <div className="exp-container">
              <span>
                EXP: {totalExp.toLocaleString()} /{" "}
                {nextLevelExp.toLocaleString()}
              </span>
              <div className="exp-bar">
                <div
                  className="exp-progress"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PlayerSkills;
