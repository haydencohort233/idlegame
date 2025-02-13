import React from "react";
import usePlayerStore from "../store/usePlayerStore";
import locations from "../data/locations.json";

function Locations() {
  const currentLocation = usePlayerStore((state) => state.location);
  const travel = usePlayerStore((state) => state.travel);

  return (
    <div>
      <h3>Travel</h3>
      <p>Current Location: {currentLocation}</p>
      {Object.values(locations).map((loc) => (
        <div key={loc.id} style={{ marginBottom: "10px" }}>
          <h4>{loc.name}</h4>
          <p>{loc.description}</p>
          <button onClick={() => travel(loc.id)}>
            Travel to {loc.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Locations;
