import React from "react";

function PlaceDetail({ place, onEdit, onDelete, onClose }) {
  if (!place) return null;

  return (
    <div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#6b7280",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "12px",
          padding: 0,
        }}
        title="Zurück"
      >
        ← Zurück
      </button>

      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            margin: "0 0 12px 0",
            fontSize: "20px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          {place.title}
        </h2>

        {place.category && (
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
              marginBottom: "12px",
            }}
          >
            {place.category}
          </span>
        )}

        <p
          style={{
            margin: "12px 0",
            fontSize: "14px",
            color: "#4b5563",
            lineHeight: "1.6",
          }}
        >
          {place.description}
        </p>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#3b82f6",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#3b82f6";
            }}
          >
            Bearbeiten
          </button>
          <button
            onClick={() => onDelete(place)}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#ef4444",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#ef4444";
            }}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlaceDetail;
