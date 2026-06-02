import React from "react";
import PlaceCard from "./PlaceCard";

function PlacesList({ places = [], onPlaceClick = () => {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {places.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
          Klicke auf die Karte, um einen neuen Ort zu erstellen.
        </p>
      ) : (
        places.map((place) => (
          <PlaceCard key={place.id} place={place} onClick={onPlaceClick} />
        ))
      )}
    </div>
  );
}

export default PlacesList;