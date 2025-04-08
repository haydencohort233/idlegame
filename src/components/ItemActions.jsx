import React from "react";
import usePlayerStore from "../store/usePlayerStore";

function ItemActions({ item }) {
  const equipItem = usePlayerStore((state) => state.equipItem);
  const removeItem = usePlayerStore((state) => state.removeItem);
  const expandBankCapacity = usePlayerStore((state) => state.expandBankCapacity);
  const unlockLocation = usePlayerStore((state) => state.unlockLocation);

  // List of equipment slot types
  const equipmentTypes = ["head", "neck", "back", "chest", "legs", "feet", "hands", "weapon", "shield", "ring", "tool"];

  let actions = [];

  // 1) If item is type "key" (for Bank Key or any future keys):
  if (item.type === "key") {
    actions = [
      { label: "Use Key", action: "use_key" },
      { label: "Drop", action: "drop" },
    ];
  }
  // 2) If item is a "resource" (e.g. ore, wood, etc.):
  else if (item.type === "resource") {
    actions = [
      { label: "Use in Crafting", action: "craft" },
      { label: "Drop", action: "drop" },
    ];
  }
  // 3) If item is an equippable (weapon, armor, tool):
  else if (equipmentTypes.includes(item.type)) {
    actions = [
      { label: "Equip", action: "equip" },
      { label: "Drop", action: "drop" },
    ];
  }
  // 4) Fallback for anything else:
  else {
    actions = [{ label: "Drop", action: "drop" }];
  }

  // Handle the actions
  const handleAction = (action) => {
    switch (action) {
      case "equip":
        equipItem(item.id);
        break;
      case "drop":
        removeItem(item.id);
        break;
      case "craft":
        console.log(`Using ${item.name} in crafting.`);
        break;
      case "use_key":
        if (item.id === "bank_key") {
          expandBankCapacity(5);
          alert(`Your bank capacity increased by 5!`);
        } else if (item.id === "falador_key") {
          unlockLocation("falador");
          alert("Falador has been unlocked!");
        }
        removeItem(item.id);
        break;
      default:
        console.warn("Undefined action:", action);
    }
  };

  return (
    <div>
      {actions.map(({ label, action }) => (
        <button key={action} onClick={() => handleAction(action)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default ItemActions;
