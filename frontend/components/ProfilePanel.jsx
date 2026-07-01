'use client';

import { useEffect, useState } from 'react';

function getUserId(user) {
  return user?.id ?? user?.userId ?? null;
}

function getDisplayName(user) {
  return user?.name || user?.email || 'Unbekannter Nutzer';
}

function formatDate(value) {
  if (!value) {
    return 'Nicht verfügbar';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Nicht verfügbar';
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function addContact(contacts, person, type, placeTitle, currentUser) {
  const currentUserId = getUserId(currentUser);
  const currentUserEmail = currentUser?.email;
  const personId = getUserId(person);

  if (!person || (personId && personId === currentUserId) || (person.email && person.email === currentUserEmail)) {
    return;
  }

  const key = personId ? `id:${personId}` : `email:${person.email}`;
  const existing = contacts.get(key) || {
    id: personId,
    name: person.name,
    email: person.email,
    sharedByThem: 0,
    sharedByMe: 0,
    examples: [],
  };

  if (type === 'sharedByThem') {
    existing.sharedByThem += 1;
  } else {
    existing.sharedByMe += 1;
  }

  if (placeTitle && existing.examples.length < 2) {
    existing.examples.push(placeTitle);
  }

  contacts.set(key, existing);
}

function buildContacts(places, currentUser) {
  const contacts = new Map();

  places.forEach((place) => {
    if (place.sharedWithMe) {
      addContact(contacts, place.sharedBy || place.owner, 'sharedByThem', place.title, currentUser);
      return;
    }

    const shares = Array.isArray(place.shares) ? place.shares : [];
    shares.forEach((share) => {
      addContact(contacts, share.recipient, 'sharedByMe', place.title, currentUser);
    });
  });

  return Array.from(contacts.values()).sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), 'de'));
}

export default function ProfilePanel({
  user = null,
  places = [],
  onClose = () => {},
  onUpdateProfile = async () => {},
  isSavingProfile = false,
}) {
  const contacts = buildContacts(places, user);
  const ownPlaces = places.filter((place) => place.canEdit !== false);
  const sharedWithMe = places.filter((place) => place.sharedWithMe);
  const sharedByMeCount = ownPlaces.reduce((count, place) => count + (Array.isArray(place.shares) ? place.shares.length : 0), 0);
  const initials = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    setEmail(user?.email || '');
  }, [user?.email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProfileMessage('');
    setProfileError('');

    const trimmedEmail = email.trim();
    const trimmedCurrentPassword = currentPassword;
    const trimmedNewPassword = newPassword;

    if (trimmedNewPassword && !trimmedCurrentPassword) {
      setProfileError('Bitte gib dein aktuelles Passwort ein.');
      return;
    }

    try {
      await onUpdateProfile({
        email: trimmedEmail,
        currentPassword: trimmedCurrentPassword,
        newPassword: trimmedNewPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setProfileMessage('Profil gespeichert.');
    } catch (error) {
      setProfileError(error.message || 'Profil konnte nicht gespeichert werden.');
    }
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
        ← Zurück
      </button>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xl font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-slate-950">{getDisplayName(user)}</h2>
            <p className="truncate text-sm text-slate-500">{user?.email || 'Keine E-Mail hinterlegt'}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
            <dt className="font-medium text-slate-500">Mitglied seit</dt>
            <dd className="font-semibold text-slate-900">{formatDate(user?.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-950">Login-Daten ändern</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-Mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aktuelles Passwort</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
              autoComplete="current-password"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Neues Passwort</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
              autoComplete="new-password"
              minLength={8}
            />
          </label>

          {profileError && <p className="text-sm font-medium text-rose-700">{profileError}</p>}
          {profileMessage && <p className="text-sm font-medium text-slate-700">{profileMessage}</p>}

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-900/15 transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
          >
            {isSavingProfile ? 'Speichere...' : 'Profil speichern'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-950">Übersicht</h3>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 px-2 py-3">
            <p className="text-lg font-semibold text-slate-950">{ownPlaces.length}</p>
            <p className="text-xs text-slate-500">Eigene Orte</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-3">
            <p className="text-lg font-semibold text-slate-950">{sharedWithMe.length}</p>
            <p className="text-xs text-slate-500">Erhalten</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-3">
            <p className="text-lg font-semibold text-slate-950">{sharedByMeCount}</p>
            <p className="text-xs text-slate-500">Geteilt</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-950">Freunde & Kontakte</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{contacts.length}</span>
        </div>

        {contacts.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-slate-500">Noch keine Kontakte aus geteilten Orten.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id || contact.email} className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{getDisplayName(contact)}</p>
                    <p className="truncate text-xs text-slate-500">{contact.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {contact.sharedByMe + contact.sharedByThem}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Du teilst: {contact.sharedByMe} · Mit dir geteilt: {contact.sharedByThem}
                </p>
                {contact.examples.length > 0 && (
                  <p className="mt-1 truncate text-xs text-slate-400">{contact.examples.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
