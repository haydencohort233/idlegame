import React, { useState, useEffect } from "react";
import usePlayerStore from "../store/usePlayerStore";
import items from "../data/items.json";
import defaultShopIcon from "/assets/images/shops/store.png";
import "../css/Shop.css";

function Shop({ shopData }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { gold, spendGold, addItem, location } = usePlayerStore();

  const [shopStock, setShopStock] = useState(() => {
    const initialStock = {};
    shopData.items.forEach(item => {
      initialStock[item.id] = item.stock;
    });
    return initialStock;
  });

  useEffect(() => {
    setExpanded(false);
    setSelectedItem(null);
  }, [location]);

  useEffect(() => {
    const intervals = shopData.items.map(item => {
      return setInterval(() => {
        setShopStock(prev => {
          const currentStock = prev[item.id] || 0;
          if (currentStock < item.stock) {
            return { ...prev, [item.id]: currentStock + 1 };
          }
          return prev;
        });
      }, item.restockInterval);
    });
    return () => {
      intervals.forEach(intervalId => clearInterval(intervalId));
    };
  }, [shopData.items]);

  const handleItemClick = (item) => {
    const detailedItem = items[item.id] || { image: "/assets/images/items/fallback.png", name: item.id };
    setSelectedItem({ ...item, ...detailedItem });
  };

  const handleBuy = () => {
    if (!selectedItem) return;
    if (gold < selectedItem.price) {
      alert("Not enough gold!");
      return;
    }
  
    spendGold(selectedItem.price);
    addItem(selectedItem.id);
  
    // Update stock and keep the preview panel open
    setShopStock(prev => {
      const updatedStock = Math.max(prev[selectedItem.id] - 1, 0);
      return { ...prev, [selectedItem.id]: updatedStock };
    });
  
    // Keep the selected item in view but update its stock
    setSelectedItem(prevItem => prevItem ? { ...prevItem, stock: shopStock[prevItem.id] - 1 } : null);
  };
  

  const handleCancel = () => {
    setSelectedItem(null);
  };

  const toggleExpanded = () => {
    setExpanded(prev => !prev);
    setSelectedItem(null);
  };

  return (
    <div className="shop-card">
      <div className="shop-header">
        {/* Use shop-specific image if available, otherwise use the default icon */}
        <img
          src={shopData.image || defaultShopIcon}
          alt={shopData.name}
          className="shop-icon"
        />

        <span className="shop-name">{shopData.name}</span>

        {expanded ? (
          <button className="close-shop-btn" onClick={() => setExpanded(false)}>X</button>
        ) : (
          <button className="open-shop-btn" onClick={toggleExpanded}>Open</button>
        )}
      </div>

      {expanded && (
        <div className="shop-content">
          <div className="shop-items">
            {shopData.items.map(item => {
              const stock = shopStock[item.id];
              const itemDetails = items[item.id] || { image: "/assets/images/items/fallback.png", name: item.id };
              return (
                <div
                    key={item.id}
                    className={`shop-item ${stock <= 0 ? "out-of-stock" : ""} ${
                        selectedItem?.id === item.id ? "selected-item" : ""
                    }`}
                    title={itemDetails.name}
                    onClick={() => stock > 0 && handleItemClick(item)}
                    >
                    <img
                        src={itemDetails.image}
                        alt={itemDetails.name}
                        className="item-thumbnail"
                    />
                    <div className="item-info">
                        <p className="item-price">{item.price} Gold</p>
                        <p className="item-stock">Stock: {stock}</p>
                    </div>
                </div>
              );
            })}
          </div>
          <div className={`item-details-panel ${selectedItem ? "open" : ""}`}>
            {selectedItem && (
                <>
                <h3>{selectedItem.name}</h3>
                <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="item-detail-image"
                />
                <p><strong>Price:</strong> {selectedItem.price} Gold</p>
                <p><strong>Description:</strong> {selectedItem.description || "No description available."}</p>
                <p><strong>Type:</strong> {selectedItem.type || "N/A"}</p>
                <p><strong>Restock Time:</strong> {selectedItem.restockInterval / 1000} seconds</p>
                <div className="panel-buttons">
                    <button 
                        onClick={handleBuy} 
                        disabled={shopStock[selectedItem.id] <= 0} 
                        className={shopStock[selectedItem.id] <= 0 ? "disabled-button" : ""}
                    >
                        Buy
                    </button>
                    <button onClick={handleCancel}>Cancel</button>
                    </div>
                </>
            )}
            </div>
        </div>
      )}
    </div>
  );
}

export default Shop;
