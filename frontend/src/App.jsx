import React, { useState, useCallback } from "react";
import MapView from "./MapView";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function App() {
  // Main state
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [sidebarMode, setSidebarMode] = useState("list"); // 'list', 'detail', 'form'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCoords, setFormCoords] = useState(null);
  const [activeNav, setActiveNav] = useState("karte"); // 'karte', 'meine-orte', 'geteilt'

  // Load places on mount
  React.useEffect(() => {
    fetch("http://localhost:3000/places")
      .then((response) => response.json())
      .then((data) => setPlaces(data))
      .catch((error) => console.error("Error fetching places:", error));
  }, []);

  // Handle map click - open form
  const handleMapClick = useCallback((latlng) => {
    setFormCoords(latlng);
    setSidebarMode("form");
    setIsFormOpen(true);
    setSelectedPlace(null);
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((place) => {
    setSelectedPlace(place);
    setSidebarMode("detail");
    setIsFormOpen(false);
  }, []);

  // Handle list item click
  const handlePlaceCardClick = useCallback((place) => {
    setSelectedPlace(place);
    setSidebarMode("detail");
    setIsFormOpen(false);
  }, []);

  const handleOpenAddPlace = useCallback(() => {
    setSelectedPlace(null);
    setFormCoords(null);
    setSidebarMode("form");
    setIsFormOpen(true);
  }, []);

  // Handle form submit - save new place
  const handleSavePlace = useCallback((placeData) => {
    fetch("http://localhost:3000/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(placeData),
    })
      .then((response) => response.json())
      .then((newPlace) => {
        setPlaces((currentPlaces) => [...currentPlaces, newPlace]);
        setSidebarMode("list");
        setIsFormOpen(false);
        setFormCoords(null);
        setSelectedPlace(null);
      })
      .catch((error) => console.error("Error saving place:", error));
  }, []);

  const handleDeletePlace = useCallback((placeToDelete) => {
    if (!placeToDelete?.id) {
      return;
    }

    const confirmation = window.confirm(`Soll der Ort "${placeToDelete.title}" wirklich gelöscht werden?`);
    if (!confirmation) {
      return;
    }

    fetch(`http://localhost:3000/places/${placeToDelete.id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Löschen fehlgeschlagen");
        }
        setPlaces((currentPlaces) => currentPlaces.filter((place) => place.id !== placeToDelete.id));
        setSidebarMode("list");
        setSelectedPlace(null);
      })
      .catch((error) => console.error("Error deleting place:", error));
  }, []);

  // Handle edit click
  const handleEditPlace = useCallback(() => {
    if (selectedPlace) {
      setFormCoords({ lat: selectedPlace.lat, lng: selectedPlace.lng });
      setSidebarMode("form");
      setIsFormOpen(true);
    }
  }, [selectedPlace]);

  const handleClearSelectedPlace = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <Navbar activeNav={activeNav} setActiveNav={setActiveNav} onAddPlace={handleOpenAddPlace} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: "0 0 70%", overflow: "hidden" }}>
          <MapView
            places={places}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
            onDeletePlace={handleDeletePlace}
          />
        </div>
        <Sidebar
          mode={sidebarMode}
          places={places}
          selectedPlace={selectedPlace}
          formCoords={formCoords}
          onPlaceCardClick={handlePlaceCardClick}
          onSavePlace={handleSavePlace}
          onEditPlace={handleEditPlace}
          onDeletePlace={handleDeletePlace}
          onClearSelectedPlace={handleClearSelectedPlace}
          onCloseForm={() => {
            setSidebarMode("list");
            setIsFormOpen(false);
            setFormCoords(null);
            setSelectedPlace(null);
          }}
        />
      </div>
    </div>
  );
}

export default App;