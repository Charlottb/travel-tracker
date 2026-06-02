'use client';

import { useState } from 'react';

export default function Navbar({ activeNav = 'karte', setActiveNav = () => {}, onAddPlace = () => {} }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');

  const handleLogin = (event) => {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      return;
    }
    setEmail(loginEmail.trim());
    setIsLoggedIn(true);
    setLoginEmail('');
    setLoginPassword('');
    setShowLoginModal(false);
  };

  const handleRegister = (event) => {
    event.preventDefault();
    if (!registerEmail.trim() || !registerPassword.trim() || !registerPasswordConfirm.trim()) {
      return;
    }
    if (registerPassword !== registerPasswordConfirm) {
      alert('Passwörter stimmen nicht überein.');
      return;
    }
    setEmail(registerEmail.trim());
    setIsLoggedIn(true);
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterPasswordConfirm('');
    setShowRegisterModal(false);
  };

  const handleLogout = () => {
    setEmail('');
    setIsLoggedIn(false);
  };

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Travel Tracker</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Meine Reiseorte</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {['karte', 'meine-orte', 'geteilt'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveNav(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeNav === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'karte' ? 'Karte' : tab === 'meine-orte' ? 'Meine Orte' : 'Geteilt'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddPlace}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + Neuer Ort
          </button>
          {isLoggedIn ? (
            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {email.charAt(0).toUpperCase()}
              </div>
              <span>{email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Registrieren
              </button>
            </div>
          )}
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Login</h2>
                <p className="text-sm text-slate-500">Melde dich mit deiner E-Mail-Adresse an.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 transition hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                E-Mail
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-900"
                  placeholder="deine@mail.de"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Passwort
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-900"
                  placeholder="Passwort"
                  required
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Einloggen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Registrieren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Registrieren</h2>
                <p className="text-sm text-slate-500">Erstelle ein Konto für Travel Tracker.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 transition hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                E-Mail
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-900"
                  placeholder="deine@mail.de"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Passwort
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-900"
                  placeholder="Passwort"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Passwort wiederholen
                <input
                  type="password"
                  value={registerPasswordConfirm}
                  onChange={(event) => setRegisterPasswordConfirm(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-900"
                  placeholder="Passwort erneut eingeben"
                  required
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Zur Anmeldung
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Konto erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
