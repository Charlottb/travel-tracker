import React from "react";
import PlacesList from "./PlacesList";
import PlaceDetail from "./PlaceDetail";
import AddPlaceForm from "./AddPlaceForm";

function Sidebar({
  mode = "list",
  places = [],
  selectedPlace = null,
  formCoords = null,
  onPlaceCardClick = () => {},
  onSavePlace = () => {},
  onEditPlace = () => {},
  onDeletePlace = () => {},
  onClearSelectedPlace = () => {},
  onCloseForm = () => {},
}) {
  return (
    <div
      style={{
        flex: "0 0 30%",
        backgroundColor: "#f9fafb",
        borderLeft: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          {mode === "list" && "Meine Orte"}
          {mode === "detail" && selectedPlace?.title}
          {mode === "form" && "Neuer Ort"}
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 24px",
        }}
      >
        {mode === "list" && (
          <PlacesList places={places} onPlaceClick={onPlaceCardClick} />
        )}

        {mode === "detail" && selectedPlace && (
          <PlaceDetail
            place={selectedPlace}
            onEdit={onEditPlace}
            onDelete={onDeletePlace}
            onClose={() => {
              onCloseForm();
            }}
          />
        )}

        {mode === "form" && (
          <>
            <AddPlaceForm
              coords={formCoords}
              onSave={onSavePlace}
              onCancel={onCloseForm}
            />

            <div style={{ marginTop: "24px" }}>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                Bestehende Orte
              </h3>
              <PlacesList places={places} onPlaceClick={onPlaceCardClick} />
            </div>

            {selectedPlace && (
              <div style={{ marginTop: "24px" }}>
                <PlaceDetail
                  place={selectedPlace}
                  onEdit={onEditPlace}
                  onDelete={onDeletePlace}
                  onClose={onClearSelectedPlace}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebar;