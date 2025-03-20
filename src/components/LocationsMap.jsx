import React, { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import locationsData from "../data/locations.json";
import mapIcon from "/assets/images/icons/map.png";
import "../css/LocationsMap.css";

function LocationsMap() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const travel = usePlayerStore((state) => state.travel);
  const currentLocation = usePlayerStore((state) => state.location);

  const openModal = () => {
    setIsOpen(true);
    setSelectedLocation(locationsData[currentLocation]); // Auto-select current location
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedLocation(null);
  };

  const handleLocationClick = (loc) => {
    setSelectedLocation(loc);
  };

  const handleTravel = () => {
    if (selectedLocation && selectedLocation.id !== currentLocation) {
      travel(selectedLocation.id);
      closeModal();
    }
  };

  return (
    <div>
      <button className="open-map-btn" onClick={openModal}>
        <img src={mapIcon} alt="Map" className="map-icon" />
        World Map
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="map-title">Locations Map</h3>
            <p className="current-location">
              Current Location: <strong>{currentLocation}</strong>
            </p>

            <div className="locations-list">
              {Object.values(locationsData).map((loc) => (
                <button
                  key={loc.id}
                  className={`location-btn ${selectedLocation?.id === loc.id ? "selected" : ""}`}
                  onClick={() => handleLocationClick(loc)}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            {selectedLocation && (
              <div className="location-preview">
                <h4>{selectedLocation.name}</h4>
                <p>{selectedLocation.description}</p>

                {selectedLocation.image && (
                  <img src={selectedLocation.image} alt={selectedLocation.name} className="location-image" />
                )}

                {selectedLocation.features && (
                  <ul className="location-features">
                    {selectedLocation.features.mining && <li>⛏️ Mining available</li>}
                    {selectedLocation.features.woodcutting && <li>🌲 Woodcutting available</li>}
                    {selectedLocation.features.fishing && <li>🎣 Fishing available</li>}
                    {selectedLocation.features.bank && <li>🏦 Bank available</li>}
                    {selectedLocation.features.quests && <li>📜 Quests available</li>}
                    {selectedLocation.features.shops && <li>🛒 Shops available</li>}
                    {selectedLocation.features.farming && <li>🌱 Farming available</li>}
                  </ul>
                )}

                <button
                  className="travel-btn"
                  onClick={handleTravel}
                  disabled={selectedLocation.id === currentLocation} // Disable if already here
                >
                  {selectedLocation.id === currentLocation ? "You're Here" : `Travel to ${selectedLocation.name}`}
                </button>
              </div>
            )}

            <button className="close-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationsMap;
