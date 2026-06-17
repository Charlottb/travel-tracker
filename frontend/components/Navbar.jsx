'use client';

export default function Navbar({ activeNav = 'karte', setActiveNav = () => {}, onAddPlace = () => {}, user = null }) {
  const isLoggedIn = Boolean(user);
  const email = user?.email || '';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('[Navbar] Logout failed:', error);
    }

    window.location.href = '/login';
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
                onClick={() => { window.location.href = '/login'; }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/register'; }}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Registrieren
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
