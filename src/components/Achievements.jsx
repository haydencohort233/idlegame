import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import achievementsData from "../data/achievements.json";
import "../css/Achievements.css"; // Ensure this CSS file exists

function Achievements() {
  const { achievements, claimAchievementReward } = usePlayerStore();

  const handleClaim = (id) => {
    claimAchievementReward(id);
  };

  // Separate achievements into active and claimed
  const activeAchievements = [];
  const claimedAchievements = [];

  Object.keys(achievementsData).forEach((id) => {
    const def = achievementsData[id];
    const achievement = achievements[id] || { progress: 0, completed: false, claimed: false };

    if (achievement.completed && achievement.claimed) {
      claimedAchievements.push({ id, def, achievement });
    } else {
      activeAchievements.push({ id, def, achievement });
    }
  });

  // Count completed achievements
  const completedCount = Object.values(achievements).filter(a => a.completed).length;
  const totalAchievements = Object.keys(achievementsData).length;

  const renderAchievement = ({ id, def, achievement }) => {
    const progressPercentage = typeof def.goal === "number" ? Math.min((achievement.progress / def.goal) * 100, 100) : 0;

    // Determine reward display
    let rewardDisplay = "";
    if (def.reward.gold) {
      rewardDisplay = `${def.reward.gold} Gold`;
    } else if (def.reward.exp) {
      rewardDisplay = `${def.reward.exp} EXP`;
    } else if (def.reward.item) {
      rewardDisplay = def.reward.item;
    }

    return (
      <div key={id} className={`achievement ${achievement.completed ? "completed" : ""}`}>
        <h4>{def.name}</h4>
        <p>{def.description}</p>
        {typeof def.goal === "number" && <p>Progress: {achievement.progress} / {def.goal}</p>}
        {typeof def.goal !== "number" && <p>Progress: {achievement.progress}</p>}
        {typeof def.goal === "number" && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        )}

        <div className="reward-section">
          <span className="reward-label">Reward:</span>
          <span className="reward-display">{rewardDisplay}</span>
          {achievement.completed ? (
            achievement.claimed ? (
              <button className="claim-btn claimed" disabled>
                Claimed
              </button>
            ) : (
              <button className="claim-btn" onClick={() => handleClaim(id)}>
                Claim
              </button>
            )
          ) : (
            <button className="claim-btn disabled" disabled>
              Claim
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="achievements-container">
      <h2>Achievements</h2>
      <p className="achievement-count">Achievements [ {completedCount} / {totalAchievements} Completed ]</p>

      <div className="achievement-list">
        {activeAchievements.map(renderAchievement)}
      </div>

      {claimedAchievements.length > 0 && (
        <div className="claimed-achievements">
          <h3>Claimed Achievements</h3>
          <div className="achievement-list">{claimedAchievements.map(renderAchievement)}</div>
        </div>
      )}
    </div>
  );
}

export default Achievements;
