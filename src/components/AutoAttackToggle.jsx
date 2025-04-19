// /src/components/AutoAttackToggle.jsx
import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import useCombatStore from "../store/combatStore";
import "../css/AutoAttackToggle.css";

const AutoAttackToggle = () => {
  // Get the player's equipped weapon from the player store.
  const weapon = usePlayerStore((state) => state.equipped.weapon);
  // Get auto combat settings from the combat store.
  const autoCombatEnabled = useCombatStore((state) => state.autoCombatEnabled);
  const toggleAutoCombat = useCombatStore((state) => state.toggleAutoCombat);

  // Determine the attack type based on equipped weapon.
  let attackType = "Melee";
  let tooltip = "Auto attack using melee.";
  let icon = "/assets/images/weapon/sword.png";

  if (weapon && weapon.type) {
    if (weapon.type === "staff") {
      attackType = "Magic";
      tooltip = "Auto attack using magic.";
      icon = "/assets/images/weapon/staff.png";
    } else if (weapon.type === "bow") {
      attackType = "Ranged";
      tooltip = "Auto attack using ranged.";
      icon = "/assets/images/weapon/bow.png";
    }
  }

  return (
    <button
      className={`auto-attack-toggle ${autoCombatEnabled ? "enabled" : "disabled"}`}
      onClick={toggleAutoCombat}
      title={`${autoCombatEnabled ? "Disable" : "Enable"} Auto Attack (${attackType}) - ${tooltip}`}
    >
      <img src={icon} alt={attackType} className="auto-attack-icon" />
      {autoCombatEnabled ? "Auto Attack: Enabled" : "Auto Attack: Disabled"}
    </button>
  );
};

export default AutoAttackToggle;
