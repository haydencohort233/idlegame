import React, { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import locationsData from "../data/locations.json";
import "../css/LocationsMap.css";

function LocationsMap() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const travel = usePlayerStore((state) => state.travel);
  const currentLocation = usePlayerStore((state) => state.location);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setSelectedLocation(null);
  };

  const handleLocationClick = (loc) => {
    setSelectedLocation(loc);
  };

  const handleTravel = () => {
    if (selectedLocation) {
      travel(selectedLocation.id);
      closeModal();
    }
  };

  return (
    <div>
      <button onClick={openModal}>Open Map</button>
      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Locations Map</h3>
            <p>Current Location: {currentLocation}</p>
            <div className="locations-list">
              {Object.values(locationsData).map((loc) => (
                <button key={loc.id} onClick={() => handleLocationClick(loc)}>
                  {loc.name}
                </button>
              ))}
            </div>
            {selectedLocation && (
              <div className="location-preview">
                <h4>{selectedLocation.name}</h4>
                <p>{selectedLocation.description}</p>
                {selectedLocation.features && (
                  <ul>
                    {selectedLocation.features.mining && <li>Mining available</li>}
                    {selectedLocation.features.shops && <li>Shops available</li>}
                    {selectedLocation.features.quests && <li>Quests available</li>}
                  </ul>
                )}
                <button onClick={handleTravel}>
                  Travel to {selectedLocation.name}
                </button>
              </div>
            )}
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationsMap;
