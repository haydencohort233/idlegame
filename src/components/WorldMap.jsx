import React, { useState, useRef, useEffect, useMemo } from "react";
import worldMapData from "../data/worldMap.json";
import locationsData from "../data/locations.json";
import usePlayerStore from "../store/usePlayerStore";
import "../css/WorldMap.css";

// Calculate route using Dijkstra's algorithm
const calculateRoute = (startId, endId, mapData) => {
  const { nodes, edges } = mapData;
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(nodes));
  Object.keys(nodes).forEach((id) => {
    distances[id] = Infinity;
    previous[id] = null;
  });
  distances[startId] = 0;
  while (unvisited.size > 0) {
    let curr = null;
    unvisited.forEach((id) => {
      if (curr === null || distances[id] < distances[curr]) {
        curr = id;
      }
    });
    if (curr === endId) break;
    unvisited.delete(curr);
    edges.forEach((edge) => {
      if (edge.from === curr || edge.to === curr) {
        const neighbor = edge.from === curr ? edge.to : edge.from;
        if (!unvisited.has(neighbor)) return;
        const alt = distances[curr] + edge.time;
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = curr;
        }
      }
    });
  }
  const route = [];
  let temp = endId;
  while (temp) {
    route.unshift(temp);
    temp = previous[temp];
  }
  if (route[0] !== startId) return { route: [], totalTime: 0 };
  return { route, totalTime: distances[endId] };
};

function WorldMap({ onClose }) {
  const modalSize = { width: window.innerWidth, height: window.innerHeight };
  const imageWidth = 4618, imageHeight = 3284, defaultScale = 0.5;
  const constrainOffset = (x, y, s) => {
    const scaledW = imageWidth * s;
    const scaledH = imageHeight * s;
    const minX = Math.min(0, modalSize.width - scaledW);
    const minY = Math.min(0, modalSize.height - scaledH);
    return {
      x: Math.min(0, Math.max(x, minX)),
      y: Math.min(0, Math.max(y, minY)),
    };
  };

  const centerOnPoint = (px, py, s) => {
    const x = modalSize.width / 2 - px * s;
    const y = modalSize.height / 2 - py * s;
    return constrainOffset(x, y, s);
  };

  const [selectedNode, setSelectedNode] = useState(null);
  const [previewPath, setPreviewPath] = useState([]);
  const [segmentTimes, setSegmentTimes] = useState([]);
  const [mapImageLoaded, setMapImageLoaded] = useState(false);
  const [mapImageError, setMapImageError] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  const containerRef = useRef(null);

  // Global travel state from the store
  const isTraveling = usePlayerStore((state) => state.isTraveling);
  const travelingTo = usePlayerStore((state) => state.travelingTo);
  const travelStartTime = usePlayerStore((state) => state.travelStartTime);
  const travelEndTime = usePlayerStore((state) => state.travelEndTime);
  const timeElapsed = usePlayerStore((state) => state.timeElapsed);
  const startTravel = usePlayerStore((state) => state.startTravel);
  const updateTravelProgress = usePlayerStore((state) => state.updateTravelProgress);
  const cancelTravelStore = usePlayerStore((state) => state.cancelTravel);
  const currentLocation = usePlayerStore((state) => state.location);
  const unlockedLocations = usePlayerStore((state) => state.unlockedLocations);

  const currentNode = worldMapData.nodes[currentLocation];
  const elapsedTime = isTraveling ? Math.floor(timeElapsed / 1000) : 0;
  const progressPercent =
    isTraveling && travelEndTime
      ? ((Date.now() - travelStartTime) / (travelEndTime - travelStartTime)) * 100
      : 0;
  const totalTravelTime = selectedNode
    ? calculateRoute(currentLocation, selectedNode.id, worldMapData).totalTime
    : 0;

  // Map image load/error handlers
  const handleMapImageLoad = () => {
    setMapImageLoaded(true);
  };

  const handleMapImageError = () => {
    setMapImageError(true);
    alert("Error Loading World Map");
  };

  const [isDragging, setIsDragging] = useState(false);
  const [lastDragPos, setLastDragPos] = useState({ x: 0, y: 0 });

// center on the player on first render, never again
const [scale, setScale] = useState(defaultScale);
const [offset, setOffset] = useState(() => {
     const initial = centerOnPoint(currentNode.x, currentNode.y, defaultScale);
     console.log("[WorldMap] initial offset:", initial);
     return initial;
   });

  // Constrain offset so the image always covers the modal viewport
  const transformPoint = useMemo(
    () => (pt) => ({
      x: pt.x * scale + offset.x,
      y: pt.y * scale + offset.y,
    }),
    [scale, offset]
  );

  useEffect(() => {
    if (isTraveling && travelingTo != null) {
      const { route } = calculateRoute(currentLocation, travelingTo, worldMapData);
      const coords = route.map((id) => worldMapData.nodes[id]);
      setPreviewPath(coords);
      // compute segment times
      const times = [];
      for (let i = 0; i < route.length - 1; i++) {
        const from = route[i], to = route[i + 1];
        const edge = worldMapData.edges.find(
          (e) =>
            (e.from === from && e.to === to) ||
            (e.from === to && e.to === from)
        );
        times.push(edge ? edge.time : 0);
      }
      setSegmentTimes(times);
      setSelectedNode(worldMapData.nodes[travelingTo]);
      setIsInfoPanelOpen(true);
    }
  }, []);

  // Displays current location information when opened
  useEffect(() => {
    if (!isTraveling) {
      setSelectedNode(worldMapData.nodes[currentLocation]);
      setIsInfoPanelOpen(true);
    }
  }, []);

  // Handle Zoom & Click to Drag
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY;
    let newScale = scale;
    if (delta < 0) {
      newScale = Math.min(scale * 1.1, 1.0);
    } else {
      newScale = Math.max(scale / 1.1, 0.5);
    }
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const ratio = newScale / scale;
    const newOffsetX = centerX - ratio * (centerX - offset.x);
    const newOffsetY = centerY - ratio * (centerY - offset.y);
    setScale(newScale);
    setOffset(constrainOffset(newOffsetX, newOffsetY, newScale));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setLastDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastDragPos.x;
    const dy = e.clientY - lastDragPos.y;
    setOffset((prev) => constrainOffset(prev.x + dx, prev.y + dy, scale));
    setLastDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => {
    const newScale = Math.min(scale * 1.1, 1.0);
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const ratio = newScale / scale;
    const newOffsetX = centerX - ratio * (centerX - offset.x);
    const newOffsetY = centerY - ratio * (centerY - offset.y);
    setScale(newScale);
    setOffset(constrainOffset(newOffsetX, newOffsetY, newScale));
  };

  const zoomOut = () => {
    const newScale = Math.max(scale / 1.1, 0.5);
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const ratio = newScale / scale;
    const newOffsetX = centerX - ratio * (centerX - offset.x);
    const newOffsetY = centerY - ratio * (centerY - offset.y);
    setScale(newScale);
    setOffset(constrainOffset(newOffsetX, newOffsetY, newScale));
  };

  const handleMarkerClick = (node) => {
    if (node.id === currentLocation) return;
    setSelectedNode(node);
    setIsInfoPanelOpen(true);
  
    // Check if the location is unlocked
    const isUnlocked = unlockedLocations.includes(node.id);
    if (!isUnlocked) {
      setPreviewPath([]);
      setSegmentTimes([]);
      return;
    }
  
    // If not traveling, update the preview path based on the clicked node.
    if (!isTraveling) {
      const { route } = calculateRoute(currentLocation, node.id, worldMapData);
      const routeCoords = route.map((nodeId) => worldMapData.nodes[nodeId]);
      const segTimes = calculateSegmentTimes(route);
      setPreviewPath(routeCoords);
      setSegmentTimes(segTimes);
    }
  };  

  const handleTravelButtonClick = () => {
    if (!selectedNode || selectedNode.id === currentLocation) return;
    if (!unlockedLocations.includes(selectedNode.id)) return;
  
    if (!isTraveling) {
      const { totalTime, route } = calculateRoute(currentLocation, selectedNode.id, worldMapData);
      startTravel(selectedNode.id, totalTime);
      const routeCoords = route.map((nodeId) => worldMapData.nodes[nodeId]);
      const segTimes = calculateSegmentTimes(route);
      setPreviewPath(routeCoords);
      setSegmentTimes(segTimes);
      setSelectedNode(null);
      setIsInfoPanelOpen(false);
    } else {
      if (selectedNode.id === travelingTo) {
        if (window.confirm(`Are you sure you want to cancel travel to ${selectedNode.name}?`)) {
          cancelTravelStore();
          setPreviewPath([]);
          setSegmentTimes([]);
          setSelectedNode(null);
          setIsInfoPanelOpen(false);
        }
      } else {
        if (window.confirm(`Do you want to travel to ${selectedNode.name} instead?`)) {
          cancelTravelStore();
          const { totalTime, route } = calculateRoute(currentLocation, selectedNode.id, worldMapData);
          startTravel(selectedNode.id, totalTime);
          const routeCoords = route.map((nodeId) => worldMapData.nodes[nodeId]);
          const segTimes = calculateSegmentTimes(route);
          setPreviewPath(routeCoords);
          setSegmentTimes(segTimes);
          setSelectedNode(null);
          setIsInfoPanelOpen(false);
        }
      }
    }
  };
  

  // Calculate segment times for the route
  const calculateSegmentTimes = (route) => {
    const times = [];
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      const edge = worldMapData.edges.find(
        (e) =>
          (e.from === from && e.to === to) || (e.from === to && e.to === from)
      );
      times.push(edge ? edge.time : 0);
    }
    return times;
  };

  const closeInfoPanel = () => {
    setSelectedNode(null);
    setIsInfoPanelOpen(false);
  };

  // Compute player's current position along the route during travel
  const getPlayerPosition = () => {
    if (!previewPath.length) return { x: currentNode.x, y: currentNode.y };
    let remaining = elapsedTime;
    for (let i = 0; i < segmentTimes.length; i++) {
      if (remaining > segmentTimes[i]) {
        remaining -= segmentTimes[i];
      } else {
        const t = remaining / segmentTimes[i];
        const start = previewPath[i];
        const end = previewPath[i + 1];
        return {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        };
      }
    }
    return previewPath[previewPath.length - 1];
  };

  // Handle starting travel using the store's action
  const handleTravel = () => {
    if (!selectedNode || selectedNode.id === currentLocation) return;
    const isUnlocked = unlockedLocations.includes(selectedNode.id);
    if (!isUnlocked) return;

    if (isTraveling) {
      cancelTravelStore();
    }

    // Calculate total travel time for the selected node
    const { totalTime } = calculateRoute(currentLocation, selectedNode.id, worldMapData);
    // Start travel (state is saved to localStorage via the store)
    startTravel(selectedNode.id, totalTime);

    // Clear UI-specific state
    setSelectedNode(null);
    setIsInfoPanelOpen(false);
  };

  useEffect(() => {
    const id = setInterval(() => {
      updateTravelProgress();
    }, 1000);
    return () => clearInterval(id);
  }, [updateTravelProgress]);

  // recalc preview & position immediately whenever we open (or traveling state changes)
  useEffect(() => {
    if (!isTraveling || travelingTo == null) return;

    // force-store up to date, so timeElapsed is fresh
    updateTravelProgress();

    // re-compute route
    const { route } = calculateRoute(currentLocation, travelingTo, worldMapData);
    const coords = route.map((id) => worldMapData.nodes[id]);
    setPreviewPath(coords);

    // re-compute segment times
    const times = [];
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i], to = route[i + 1];
      const edge = worldMapData.edges.find(
        (e) =>
          (e.from === from && e.to === to) ||
          (e.from === to && e.to === from)
      );
      times.push(edge ? edge.time : 0);
    }
    setSegmentTimes(times);

    // open info panel at the target
    setSelectedNode(worldMapData.nodes[travelingTo]);
    setIsInfoPanelOpen(true);

  }, [isTraveling, travelingTo, currentLocation, updateTravelProgress]);


  // Compute player's screen position
  const playerMapPos = isTraveling
    ? getPlayerPosition()
    : { x: currentNode.x, y: currentNode.y };
  const playerScreenPos = transformPoint(playerMapPos);

  const renderFeatureIcons = (features) => {
    const featureList = [
      { key: "mining", label: "Mining", icon: "⛏️" },
      { key: "farming", label: "Farming", icon: "🌱" },
      { key: "fishing", label: "Fishing", icon: "🎣" },
      { key: "bank", label: "Banking", icon: "🏦" },
      { key: "woodcutting", label: "Woodcutting", icon: "🌳" },
      { key: "enemies", label: "Enemies", icon: "⚔️" },
    ];
  
    return (
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {featureList.map((feature) => {
          const available = features && features[feature.key];
          return (
            <span
              key={feature.key}
              title={`${feature.label} is ${available ? "available" : "not available"} here.`}
              style={{
                fontSize: "16px", // Emoji Size
                filter: available ? "none" : "none",
                border: `1px solid ${available ? "green" : "red"}`, // Green border if available, red if not.
                borderRadius: "4px",
                padding: "2px",
                display: "inline-block"
              }}
            >
              {feature.icon}
            </span>
          );
        })}
      </div>
    );
  };  

  // Render location information for the bottom panel
  const renderLocationInfo = (locId) => {
    if (!locId) return null;
    const isUnlocked = unlockedLocations.includes(locId);
    const locationDetail = locationsData[locId];
    if (!locationDetail) {
      return <p style={{ color: "#ccc" }}>Unknown location.</p>;
    }
    
    return (
      <div style={{ width: "100%", maxHeight: "120px" }}>
        <p>{locationDetail.description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Available:</span>
          {renderFeatureIcons(locationDetail.features)}
        </div>
      </div>
    );
  };  

  return (
          <div
            className="worldmap-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100vw",
              height: "100vh",
              background: "#000",
              position: "relative",
            }}
          >
            <button
              className="close-map-btn"
              onClick={onClose}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 1100,
              }}
            >
              X
            </button>

            <div
              ref={containerRef}
              className="worldmap-container"
              style={{
                flex: 1,
                position: "relative",
                overflow: "hidden",
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {!mapImageLoaded && !mapImageError && <p>Loading map...</p>}
              {mapImageError && <p>Error loading world map.</p>}
              <img
                src="/assets/images/worldmap/worldmap.png"
                alt="World Map"
                style={{
                  position: "absolute",
                  left: offset.x,
                  top: offset.y,
                  width: imageWidth * scale,
                  height: imageHeight * scale,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                onLoad={handleMapImageLoad}
                onError={handleMapImageError}
              />

              {Object.values(worldMapData.nodes).map((node) => {
                const isUnlocked = unlockedLocations.includes(node.id);
                const pos = transformPoint({ x: node.x, y: node.y });
                const locationDetail = locationsData[node.id];
                const markerIcon =
                  isUnlocked && locationDetail
                    ? locationDetail.icon
                    : "/assets/images/locations/locked.png";
                const isCurrent = node.id === currentNode.id;
                const isSelected = selectedNode && selectedNode.id === node.id;
                return (
                  <div
                    key={node.id}
                    className={`map-marker ${isCurrent ? "current-marker" : ""} ${isSelected ? "selected-marker" : ""}`}
                    style={{
                      position: "absolute",
                      left: pos.x,
                      top: pos.y,
                      transform: "translate(-50%, -50%)",
                      cursor: isCurrent ? "default" : "pointer",
                      zIndex: 1000,
                    }}
                    onClick={() => handleMarkerClick(node)}
                  >
                    <img
                      src={markerIcon}
                      alt={
                        isUnlocked && locationDetail
                          ? locationDetail.name
                          : "Locked location"
                      }
                      className="map-marker-icon"
                    />
                  </div>
                );
              })}

              {previewPath.length > 0 && (
                <svg
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <polyline
                    points={previewPath
                      .map((pt) => {
                        const { x, y } = transformPoint(pt);
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    stroke="yellow"
                    strokeDasharray="5,5"
                    fill="none"
                    strokeWidth="6"
                  />
                </svg>
              )}

              <div
                className="player-icon"
                style={{
                  position: "absolute",
                  left: playerScreenPos.x,
                  top: playerScreenPos.y,
                  transform: "translate(-50%, -50%)",
                  fontSize: "24px",
                  zIndex: 1100,
                }}
              >
                🧍
              </div>

              {isTraveling && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "5px",
                    background: "#333",
                    zIndex: 12000,
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background: "#00ff00",
                    }}
                  />
                </div>
              )}

              <div className={`zoom-controls ${selectedNode ? "above-info-panel" : ""}`}>
                <button onClick={zoomOut} style={{ fontSize: "18px", marginBottom: "5px" }}>
                  -
                </button>
                <button onClick={zoomIn} style={{ fontSize: "18px" }}>
                  +
                </button>
              </div>
            </div>

            {(isTraveling || (selectedNode && isInfoPanelOpen)) && (
              <div
                className="worldmap-bottom-panel"
                style={{
                  height: "auto",
                  background: "#222",
                  color: "#fff",
                  padding: "10px",
                  overflowY: "auto",
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {isTraveling ? (
                  // ─── Traveling View ─────────────────────────────────────
                  <>
                    <h4 style={{ margin: 0, marginBottom: "8px" }}>
                      Traveling to {locationsData[travelingTo]?.name || "Unknown"}
                    </h4>
                    <p style={{ margin: 0 }}>
                      Time Remaining:{" "}
                      {new Date(Math.max(travelEndTime - Date.now(), 0))
                        .toISOString()
                        .substr(11, 8)}
                    </p>
                    <button
                      onClick={cancelTravelStore}
                      style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel Travel
                    </button>
                  </>
                ) : (
                  // ─── Info View ─────────────────────────────────────────
                  (() => {
                    const node =
                      selectedNode && isInfoPanelOpen
                        ? selectedNode
                        : worldMapData.nodes[currentLocation];
                    const isCurrent = node.id === currentLocation;
                    const unlocked = unlockedLocations.includes(node.id);
                    return (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            marginBottom: "10px",
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              flexGrow: 1,
                              textAlign: "center",
                            }}
                          >
                            {locationsData[node.id]?.name || "Unknown"}
                          </h4>
                          <button
                            onClick={closeInfoPanel}
                            style={{
                              background: "none",
                              color: "#fff",
                              border: "none",
                              fontSize: "16px",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: "red",
                                padding: "3px 8px",
                                display: "inline-block",
                              }}
                            >
                              X
                            </span>
                          </button>
                        </div>
                        {renderLocationInfo(node.id)}
                        {isCurrent ? (
                          <button
                            disabled
                            style={{
                              marginTop: "10px",
                              padding: "8px 16px",
                              opacity: 0.5,
                              cursor: "not-allowed",
                            }}
                          >
                            You are here
                          </button>
                        ) : unlocked ? (
                          <button
                            onClick={handleTravelButtonClick}
                            style={{
                              marginTop: "10px",
                              padding: "8px 16px",
                              cursor: "pointer",
                            }}
                          >
                            Travel to {node.name} (
                            {calculateRoute(
                              currentLocation,
                              node.id,
                              worldMapData
                            ).totalTime}{" "}
                            sec)
                          </button>
                        ) : null}
                      </>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        );
      }

      export default WorldMap;