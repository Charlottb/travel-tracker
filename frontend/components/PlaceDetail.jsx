'use client';

import { useState } from 'react';
import CategoryBadge from './CategoryBadge';

export default function PlaceDetail({
  place,
  onEdit,
  onDelete,
  onClose,
  onSharePlace = async () => {},
  onUnsharePlace = async () => {},
  isLoading = false,
}) {
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');

  if (!place) return null;

  const canEdit = place.canEdit !== false;
  const shares = Array.isArray(place.shares) ? place.shares : [];
  const sharedBy = place.sharedBy?.name || place.sharedBy?.email || place.owner?.name || place.owner?.email;

  const handleShare = async (event) => {
    event.preventDefault();
    setShareError('');

    try {
      await onSharePlace(place, shareEmail);
      setShareEmail('');
    } catch (error) {
      setShareError(error.message || 'Teilen fehlgeschlagen.');
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
        ← Zurück
      </button>
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{place.title}</h2>
        {place.category && <CategoryBadge category={place.category} className="mt-2" />}
        {place.sharedWithMe && (
          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800">
            Geteilt von {sharedBy || 'einem anderen Nutzer'}
          </p>
        )}
        {place.description && <p className="mt-4 text-sm leading-7 text-slate-600">{place.description}</p>}
      </div>
      {canEdit && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onEdit} className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-900/10 transition hover:bg-slate-700">
              Bearbeiten
            </button>
            <button type="button" onClick={() => onDelete(place)} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
              Löschen
            </button>
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Mit Person teilen</h3>
              <p className="mt-1 text-sm text-slate-500">Die Person muss bereits registriert sein.</p>
            </div>
            <form onSubmit={handleShare} className="space-y-3">
              <input
                type="email"
                value={shareEmail}
                onChange={(event) => setShareEmail(event.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                required
              />
              {shareError && <p className="text-sm font-medium text-rose-700">{shareError}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
              >
                {isLoading ? 'Teile...' : 'Ort teilen'}
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-950">Geteilt mit</h3>
              {shares.length === 0 ? (
                <p className="text-sm text-slate-500">Noch keine Freigaben.</p>
              ) : (
                shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {share.recipient?.name || share.recipient?.email}
                      </p>
                      <p className="truncate text-xs text-slate-500">{share.recipient?.email}</p>
                    </div>
                            <button
                      type="button"
                      onClick={() => onUnsharePlace(place, share)}
                      disabled={isLoading}
                      className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:text-slate-400"
                    >
                      Entfernen
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
