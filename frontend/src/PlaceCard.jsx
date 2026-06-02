import React from "react";

function PlaceCard({ place, onClick }) {
  return (
    <div
      onClick={() => onClick?.(place)}
      style={{
        backgroundColor: "#ffffff",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: "15px",
          fontWeight: "600",
          color: "#1f2937",
        }}
      >
        {place.title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: "#6b7280",
          lineHeight: "1.4",
        }}
      >
        {place.description}
      </p>
      {place.category && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          {place.category}
        </div>
      )}
    </div>
  );
}

export default PlaceCard;