import usePlayerStore from "../store/usePlayerStore";
import experienceData from "../data/experience.json";
import "../css/PlayerSkills.css"; // Import CSS file

function PlayerSkills() {
  const { skills } = usePlayerStore();

  return (
    <div className="player-skills">
      <h3>Player Skills</h3>
      {Object.entries(skills).map(([name, { level, totalExp = 0 }]) => {
        const nextLevelExp = experienceData[level] || (level * 1000);
        const progressPercentage = Math.min((totalExp / nextLevelExp) * 100, 100);

        return (
          <div key={name} className="skill">
            <p className="skill-title">
              {name.charAt(0).toUpperCase() + name.slice(1)}: Level {level}
            </p>
            <div className="exp-container">
              <span>EXP: {totalExp.toLocaleString()} / {nextLevelExp.toLocaleString()}</span>
              <div className="exp-bar">
                <div className="exp-progress" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PlayerSkills;
