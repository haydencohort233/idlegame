import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import items from "../data/items.json";
import ItemActions from "./ItemActions";

function Inventory() {
  const { inventory } = usePlayerStore();

  return (
    <div>
      <h2>Inventory</h2>
      {inventory.length === 0 ? (
        <p>No items</p>
      ) : (
        inventory.map((item, index) => {
          const itemData = items[item.id]; // Fetch item details
          return (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <img
                src={itemData?.image || "/assets/images/items/fallback.png"}
                alt={itemData.name}
                width={32}
                height={32}
              />
              <p>
                {itemData.name} - x{item.quantity}
              </p>
              <ItemActions item={itemData} />
            </div>
          );
        })
      )}
    </div>
  );
}

export default Inventory;
