import usePlayerStore from "../store/usePlayerStore";

function PlayerSkills() {
  const { skills } = usePlayerStore();
  
  return (
    <div>
      {Object.entries(skills).map(([name, { level, exp }]) => (
        <p key={name}>
          {name.charAt(0).toUpperCase() + name.slice(1)}: Level {level} Exp: {exp.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default PlayerSkills;
