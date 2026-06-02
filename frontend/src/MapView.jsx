import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet default icon fix for Vite/react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapView({ places = [], onMapClick = () => {}, onMarkerClick = () => {}, onDeletePlace = () => {} }) {
  const customIcon = new L.DivIcon({
    className: "custom-marker-icon",
    html: `
      <span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#22c55e;border:4px solid rgba(255,255,255,0.95);box-shadow:0 0 0 10px rgba(34,197,94,0.14);"></span>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "24px", overflow: "hidden", boxShadow: "0 24px 80px rgba(15, 23, 42, 0.12)" }}>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={customIcon}
            eventHandlers={{
              click: () => onMarkerClick(place),
            }}
          >
            <Popup>
              <div style={{ maxWidth: "220px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <strong>{place.title}</strong>
                </div>
                <div style={{ color: "#4b5563", fontSize: "13px", lineHeight: "1.4" }}>
                  {place.description}
                </div>
                {place.category && (
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    Kategorie: {place.category}
                  </div>
                )}
                <button
                  onClick={() => onDeletePlace(place)}
                  style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Punkt löschen
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;

