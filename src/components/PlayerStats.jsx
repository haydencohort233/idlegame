import usePlayerStore from "../store/usePlayerStore";
import experienceData from "../data/experience.json";
import "../css/PlayerStats.css"; // Import CSS file

function PlayerStats() {
    const { name, level, exp, location, stats, equipped, gold } = usePlayerStore();

    let goldModifier = 1;
    Object.values(equipped).forEach(item => {
        if (item?.gold_multiplier) {
            goldModifier += item.gold_multiplier;
        }
    });

    // Get EXP required for next level
    const nextLevelExp = experienceData[level] || (level * 1000); 
    const progressPercentage = Math.min((exp / nextLevelExp) * 100, 100);

    return (
        <div className="player-stats">
            <h2>{name}</h2>
            <p>Level: {level}</p>
            <div className="exp-container">
                <span>EXP: {exp.toLocaleString()} / {nextLevelExp.toLocaleString()}</span>
                <div className="exp-bar">
                    <div className="exp-progress" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
            <p>Gold: {gold.toLocaleString()}</p>
            <p>Gold Modifier: x{goldModifier.toFixed(2)}</p>
            <p>Location: {location}</p>
            <p>
                Attack: {stats.attack} | Defense: {stats.defence} | Magic: {stats.magic} | Health: {stats.health}
            </p>
        </div>
    );
}

export default PlayerStats;
