import React, { useState } from "react";

function AddPlaceForm({ coords, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Bitte gib einen Titel ein.");
      return;
    }

    if (!coords || Number.isNaN(Number(coords.lat)) || Number.isNaN(Number(coords.lng))) {
      alert("Bitte wähle einen Ort auf der Karte aus.");
      return;
    }

    onSave({
      lat: Number(coords.lat),
      lng: Number(coords.lng),
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      isShared: false,
    });

    setTitle("");
    setDescription("");
    setCategory("");
  };

  return (
    <div>
      <button
        onClick={onCancel}
        style={{
          background: "none",
          border: "none",
          color: "#6b7280",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "12px",
          padding: 0,
        }}
        title="Abbrechen"
      >
        ← Abbrechen
      </button>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Neuer Ort
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Titel
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name des Ortes"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Beschreibung optional
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Was ist besonders an diesem Ort?"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
              minHeight: "80px",
              resize: "vertical",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          {!coords ? (
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                padding: "12px",
                color: "#374151",
                fontSize: "14px",
              }}
            >
              Bitte wähle einen Ort auf der Karte aus, um die Koordinaten automatisch zu verwenden.
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                padding: "12px",
                color: "#374151",
                fontSize: "14px",
              }}
            >
              Koordinaten: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Kategorie (optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          >
            <option value="">-- Keine --</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Hotel">Hotel</option>
            <option value="Sehenswürdigkeit">Sehenswürdigkeit</option>
            <option value="Natur">Natur</option>
            <option value="Shopping">Shopping</option>
            <option value="Sonstiges">Sonstiges</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#6b7280",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f3f4f6";
            }}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#10b981",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#059669";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#10b981";
            }}
          >
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPlaceForm;
