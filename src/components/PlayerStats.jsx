import usePlayerStore from "../store/usePlayerStore";

function PlayerStats() {
    const { name, level, location, stats, skills, equipped, gold } = usePlayerStore();

    let goldModifier = 1;
    Object.values(equipped).forEach(item => {
        if (item?.gold_multiplier) {
            goldModifier += item.gold_multiplier;
        }
    });

    return (
        <div>
            <h2>{name}</h2>
            <p>Level: {level}</p>
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
