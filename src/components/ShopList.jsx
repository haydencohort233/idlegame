import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import shopsData from "../data/shops.json";
import Shop from "./Shop";
import "../css/ShopList.css";

function ShopList() {
  const currentLocation = usePlayerStore((state) => state.location);
  
  // Filter shops based on player's current location.
  const availableShops = Object.values(shopsData).filter(shop =>
    shop.locations.includes(currentLocation)
  );

  return (
    <div className="shop-list-container">
      <h2>Available Shops</h2>
      {availableShops.length > 0 ? (
        availableShops.map(shop => (
          <div key={shop.id} className="shop-list-item">
            <Shop shopData={shop} />
          </div>
        ))
      ) : (
        <p>No shops available in your area.</p>
      )}
    </div>
  );
}

export default ShopList;
