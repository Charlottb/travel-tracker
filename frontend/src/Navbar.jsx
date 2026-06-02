import React, { useState } from "react";

function Navbar({ activeNav = "karte", setActiveNav = () => {}, onAddPlace = () => {} }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail.trim() && loginPassword.trim()) {
      setEmail(loginEmail);
      setIsLoggedIn(true);
      setLoginEmail("");
      setLoginPassword("");
      setShowLoginModal(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (registerEmail.trim() && registerPassword.trim() && registerPasswordConfirm.trim()) {
      if (registerPassword !== registerPasswordConfirm) {
        alert("Passwörter stimmen nicht überein!");
        return;
      }
      setEmail(registerEmail);
      setIsLoggedIn(true);
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterPasswordConfirm("");
      setShowRegisterModal(false);
    }
  };

  const handleLogout = () => {
    setEmail("");
    setIsLoggedIn(false);
    setLoginEmail("");
    setLoginPassword("");
  };

  return (
    <>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Travel Tracker
        </h1>
        <div
          style={{
            display: "flex",
            gap: "24px",
          }}
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav("karte");
            }}
            style={{
              color: activeNav === "karte" ? "#3b82f6" : "#6b7280",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "color 0.2s",
              borderBottom: activeNav === "karte" ? "2px solid #3b82f6" : "2px solid transparent",
              paddingBottom: "4px",
            }}
            onMouseEnter={(e) => {
              if (activeNav !== "karte") e.target.style.color = "#1f2937";
            }}
            onMouseLeave={(e) => {
              if (activeNav !== "karte") e.target.style.color = "#6b7280";
            }}
          >
            Karte
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav("meine-orte");
            }}
            style={{
              color: activeNav === "meine-orte" ? "#3b82f6" : "#6b7280",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "color 0.2s",
              borderBottom: activeNav === "meine-orte" ? "2px solid #3b82f6" : "2px solid transparent",
              paddingBottom: "4px",
            }}
            onMouseEnter={(e) => {
              if (activeNav !== "meine-orte") e.target.style.color = "#1f2937";
            }}
            onMouseLeave={(e) => {
              if (activeNav !== "meine-orte") e.target.style.color = "#6b7280";
            }}
          >
            Meine Orte
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav("geteilt");
            }}
            style={{
              color: activeNav === "geteilt" ? "#3b82f6" : "#6b7280",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "color 0.2s",
              borderBottom: activeNav === "geteilt" ? "2px solid #3b82f6" : "2px solid transparent",
              paddingBottom: "4px",
            }}
            onMouseEnter={(e) => {
              if (activeNav !== "geteilt") e.target.style.color = "#1f2937";
            }}
            onMouseLeave={(e) => {
              if (activeNav !== "geteilt") e.target.style.color = "#6b7280";
            }}
          >
            Geteilt
          </a>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            onClick={onAddPlace}
            style={{
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#3b82f6";
            }}
          >
            + Neuer Ort
          </button>
          {isLoggedIn ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "16px",
                  }}
                >
                  {email.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#1f2937",
                    fontWeight: "500",
                  }}
                >
                  {email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#6b7280",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e5e7eb";
                  e.target.style.color = "#1f2937";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6";
                  e.target.style.color = "#6b7280";
                }}
              >
                Abmelden
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                border: "2px solid #d1d5db",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#9ca3af";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "#d1d5db";
              }}
              title="Anmelden"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1f2937"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
          )}
        </div>
      </nav>

      {showLoginModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 24px 0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Anmelden
            </h2>
            <form onSubmit={handleLogin}>
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
                  E-Mail
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="deine@email.de"
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
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Passwort
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Dein Passwort"
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
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
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
                  Anmelden
                </button>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Kein Konto?
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontWeight: "600",
                    marginLeft: "4px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#3b82f6")}
                >
                  Registrieren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showRegisterModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 24px 0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Registrieren
            </h2>
            <form onSubmit={handleRegister}>
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
                  E-Mail
                </label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="deine@email.de"
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
                  Passwort
                </label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Wähle ein sicheres Passwort"
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
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  placeholder="Passwort wiederholen"
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
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
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
                  Registrieren
                </button>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Bereits registriert?
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontWeight: "600",
                    marginLeft: "4px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#3b82f6")}
                >
                  Anmelden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
