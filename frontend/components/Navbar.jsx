'use client';

export default function Navbar({
  activeNav = 'meine-orte',
  setActiveNav = () => {},
  onAddPlace = () => {},
  onOpenProfile = () => {},
  isProfileOpen = false,
  user = null,
}) {
  const isLoggedIn = Boolean(user);
  const email = user?.email || '';
  const displayName = user?.name || email || 'Gast';
  const initials = displayName.trim().charAt(0).toUpperCase();

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
    <div className="border-b border-slate-200 bg-white px-5 py-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Travel Tracker</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Reiseorte</h1>
          </div>
          <button
            type="button"
            onClick={onAddPlace}
            className="shrink-0 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
          >
            + Neuer Ort
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200">
            {['meine-orte', 'geteilt'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveNav(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeNav === tab
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-950'
                }`}
              >
                {tab === 'meine-orte' ? 'Meine Orte' : 'Geteilt'}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 items-center">
            {isLoggedIn ? (
              <div className="grid w-full max-w-full grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className={`col-span-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isProfileOpen
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Profil
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="col-span-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
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
    </div>
  );
}
