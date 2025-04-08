import React, { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import itemsData from "../data/items.json";
import "../css/Bank.css";

function Bank() {
  // 1) bankCapacity destructured from the store
  const { inventory, bankInventory, depositItem, withdrawItem, bankCapacity } = usePlayerStore();
  const [isOpen, setIsOpen] = useState(false);

  const toggleBank = () => setIsOpen(!isOpen);

  const handleDepositX = (item) => {
    const input = prompt("How many do you want to deposit?");
    const amount = parseInt(input, 10);
    if (!isNaN(amount) && amount > 0) {
      depositItem(item.id, amount);
    }
  };

  const handleWithdrawX = (item) => {
    const input = prompt("How many do you want to withdraw?");
    const amount = parseInt(input, 10);
    if (!isNaN(amount) && amount > 0) {
      withdrawItem(item.id, amount);
    }
  };

  return (
    <div className="bank-interface">
      <button className="bank-btn" onClick={toggleBank}>
        <img src="assets/images/icons/bank-icon.png" alt="Bank" className="bank-icon" />
        {isOpen ? "Close Bank" : "Open Bank"}
      </button>

      {isOpen && (
        <div className="bank-content">
          <div className="inventory-section">
            <h3>Inventory</h3>
            {inventory.length === 0 && <p className="empty">No items in inventory.</p>}
            {inventory.map((item, idx) => {
              const itemData = itemsData[item.id] || {};
              return (
                <div key={item.id + "-" + idx} className="bank-item-row">
                  <img
                    src={itemData.image || "/assets/images/items/fallback.png"}
                    alt={itemData.name || item.id}
                    className="bank-item-icon"
                  />
                  <span className="bank-item-label">
                    {itemData.name || item.id} x{item.quantity}
                  </span>
                  <button className="small-btn" onClick={() => depositItem(item.id, 1)}>+1</button>
                  <button className="small-btn" onClick={() => depositItem(item.id, 5)}>+5</button>
                  <button className="small-btn" onClick={() => handleDepositX(item)}>X</button>
                  <button className="small-btn" onClick={() => depositItem(item.id, item.quantity)}>All</button>
                </div>
              );
            })}
          </div>

          <div className="bank-section">
            {/* 2) bankCapacity is now defined */}
            <h3>Bank Storage ({bankInventory.length} / {bankCapacity} types)</h3>
            {bankInventory.length === 0 && <p className="empty">No items in bank.</p>}
            {bankInventory.map((item, idx) => {
              const itemData = itemsData[item.id] || {};
              return (
                <div key={item.id + "-" + idx} className="bank-item-row">
                  <img
                    src={itemData.image || "/assets/images/items/fallback.png"}
                    alt={itemData.name || item.id}
                    className="bank-item-icon"
                  />
                  <span className="bank-item-label">
                    {itemData.name || item.id} x{item.quantity}
                  </span>
                  <button className="small-btn" onClick={() => withdrawItem(item.id, 1)}>-1</button>
                  <button className="small-btn" onClick={() => withdrawItem(item.id, 5)}>-5</button>
                  <button className="small-btn" onClick={() => handleWithdrawX(item)}>X</button>
                  <button className="small-btn" onClick={() => withdrawItem(item.id, item.quantity)}>All</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Bank;
