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
    <div className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur xl:px-6">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-emerald-700 ring-1 ring-slate-200">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 21s7-5.5 7-12a7 7 0 0 0-14 0c0 6.5 7 12 7 12z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-600">Travel Tracker</p>
              <h1 className="mt-0.5 text-[1.65rem] font-semibold leading-8 tracking-tight text-slate-950">Reiseorte</h1>
            </div>
          </div>
          <button
            type="button"
            data-cy="add-place"
            onClick={onAddPlace}
            className="shrink-0 rounded-full bg-emerald-500 px-4 py-2.5 text-[15px] font-semibold text-slate-950 shadow-lg shadow-emerald-200 transition hover:bg-emerald-400"
          >
            + Neuer Ort
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100/80 p-1 ring-1 ring-slate-200">
            {['meine-orte', 'geteilt'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveNav(tab)}
                className={`rounded-full px-4 py-2 text-[15px] font-medium transition ${
                  activeNav === tab
                    ? 'bg-white text-slate-950 shadow-sm shadow-slate-900/5'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-950'
                }`}
              >
                {tab === 'meine-orte' ? 'Meine Orte' : 'Geteilt'}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 items-center border-t border-slate-100 pt-2">
            {isLoggedIn ? (
              <div className="flex w-full min-w-0 items-center gap-2 text-sm text-slate-700">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{email}</p>
                </div>
                <button
                  type="button"
                  data-cy="open-profile"
                  onClick={onOpenProfile}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                    isProfileOpen
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  Profil
                </button>
                <button
                  type="button"
                  data-cy="logout"
                  onClick={handleLogout}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => { window.location.href = '/login'; }}
                  className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { window.location.href = '/register'; }}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
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
