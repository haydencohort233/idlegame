import React from "react";
import usePlayerStore from "../store/usePlayerStore";

function ItemActions({ item }) {
  const equipItem = usePlayerStore((state) => state.equipItem);
  const removeItem = usePlayerStore((state) => state.removeItem);

  // List of equipment slot types
  const equipmentTypes = ["head", "neck", "back", "chest", "legs", "feet", "hands", "weapon", "shield", "ring"];

  let actions = [];
  if (item.type === "resource") {
    actions = [
      { label: "Use in Crafting", action: "craft" },
      { label: "Drop", action: "drop" },
    ];
  } else if (equipmentTypes.includes(item.type)) {
    actions = [
      { label: "Equip", action: "equip" },
      { label: "Drop", action: "drop" },
    ];
  } else {
    actions = [{ label: "Drop", action: "drop" }];
  }

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
      default:
        console.warn("Undefined action");
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
