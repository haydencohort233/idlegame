import usePlayerStore from "../store/usePlayerStore";

function PlayerSkills() {
  const { skills } = usePlayerStore();
  
  return (
    <div>
      {Object.entries(skills).map(([name, { level, totalExp = 0 }]) => (
        <p key={name}>
          {name.charAt(0).toUpperCase() + name.slice(1)}: Level {level} | Total Exp: {totalExp.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default PlayerSkills;
