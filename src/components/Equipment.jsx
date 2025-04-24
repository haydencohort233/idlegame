import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import items from "../data/items.json";
import "../css/Equipment.css";

function Equipment() {
  const { equipped, unequipItem } = usePlayerStore();

  return (
    <div>
      <h2>Equipment</h2>
      <div className="equipment-container">
        <div
          className="equipment-slot head"
          onClick={() => unequipItem("head")}
        >
          {equipped.head ? (
            <img
              src={
                items[equipped.head.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.head.name}
            />
          ) : (
            <span className="slot-label">Head</span>
          )}
        </div>
        <div
          className="equipment-slot neck"
          onClick={() => unequipItem("neck")}
        >
          {equipped.neck ? (
            <img
              src={
                items[equipped.neck.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.neck.name}
            />
          ) : (
            <span className="slot-label">Neck</span>
          )}
        </div>
        <div
          className="equipment-slot back"
          onClick={() => unequipItem("back")}
        >
          {equipped.back ? (
            <img
              src={
                items[equipped.back.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.back.name}
            />
          ) : (
            <span className="slot-label">Back</span>
          )}
        </div>
        <div
          className="equipment-slot chest"
          onClick={() => unequipItem("chest")}
        >
          {equipped.chest ? (
            <img
              src={
                items[equipped.chest.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.chest.name}
            />
          ) : (
            <span className="slot-label">Chest</span>
          )}
        </div>
        <div
          className="equipment-slot weapon"
          onClick={() => unequipItem("weapon")}
        >
          {equipped.weapon ? (
            <img
              src={
                items[equipped.weapon.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.weapon.name}
            />
          ) : (
            <span className="slot-label">Weapon</span>
          )}
        </div>
        <div
          className="equipment-slot shield"
          onClick={() => unequipItem("shield")}
        >
          {equipped.shield ? (
            <img
              src={
                items[equipped.shield.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.shield.name}
            />
          ) : (
            <span className="slot-label">Shield</span>
          )}
        </div>
        <div
          className="equipment-slot hands"
          onClick={() => unequipItem("hands")}
        >
          {equipped.hands ? (
            <img
              src={
                items[equipped.hands.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.hands.name}
            />
          ) : (
            <span className="slot-label">Hands</span>
          )}
        </div>
        <div
          className="equipment-slot legs"
          onClick={() => unequipItem("legs")}
        >
          {equipped.legs ? (
            <img
              src={
                items[equipped.legs.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.legs.name}
            />
          ) : (
            <span className="slot-label">Legs</span>
          )}
        </div>
        <div
          className="equipment-slot feet"
          onClick={() => unequipItem("feet")}
        >
          {equipped.feet ? (
            <img
              src={
                items[equipped.feet.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.feet.name}
            />
          ) : (
            <span className="slot-label">Feet</span>
          )}
        </div>
        <div
          className="equipment-slot ring"
          onClick={() => unequipItem("ring")}
        >
          {equipped.ring ? (
            <img
              src={
                items[equipped.ring.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.ring.name}
            />
          ) : (
            <span className="slot-label">Ring</span>
          )}
        </div>
        <div
          className="equipment-slot tool"
          onClick={() => unequipItem("tool")}
        >
          {equipped.tool ? (
            <img
              src={
                items[equipped.tool.id]?.image ||
                "/assets/images/items/fallback.png"
              }
              alt={equipped.tool.name}
            />
          ) : (
            <span className="slot-label">Tool</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Equipment;
