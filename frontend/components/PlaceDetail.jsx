'use client';

import { useState } from 'react';
import CategoryBadge from './CategoryBadge';
import { getStatusLabel, getTripLabel, parseMoodTags } from './placeMetadata';

export default function PlaceDetail({
  place,
  onEdit,
  onDelete,
  onClose,
  onSharePlace = async () => {},
  onUnsharePlace = async () => {},
  onCreatePublicShareLink = async () => {},
  onDisablePublicShareLink = async () => {},
  isLoading = false,
}) {
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [publicShareError, setPublicShareError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  if (!place) return null;

  const canEdit = place.canEdit !== false;
  const shares = Array.isArray(place.shares) ? place.shares : [];
  const publicShare = place.publicShare?.enabled ? place.publicShare : null;
  const hasPublicShare = Boolean(publicShare);
  const sharedBy = place.sharedBy?.name || place.sharedBy?.email || place.owner?.name || place.owner?.email;
  const moodTags = parseMoodTags(place.moodTags);
  const statusLabel = getStatusLabel(place.status);

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

  const handleCreatePublicShareLink = async () => {
    setPublicShareError('');
    setCopyStatus('');

    try {
      await onCreatePublicShareLink(place);
    } catch (error) {
      setPublicShareError(error.message || 'Share-Link konnte nicht erstellt werden.');
    }
  };

  const handleDisablePublicShareLink = async () => {
    setPublicShareError('');
    setCopyStatus('');

    try {
      await onDisablePublicShareLink(place);
    } catch (error) {
      setPublicShareError(error.message || 'Share-Link konnte nicht deaktiviert werden.');
    }
  };

  const handleCopyPublicShareLink = async () => {
    if (!publicShare?.url) {
      return;
    }

    setPublicShareError('');

    try {
      await navigator.clipboard.writeText(publicShare.url);
      setCopyStatus('Link kopiert.');
    } catch (_error) {
      setPublicShareError('Link konnte nicht kopiert werden.');
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-emerald-50 hover:text-slate-900">
        ← Zurück
      </button>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Travel Note</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{place.title}</h2>
        {place.category && <CategoryBadge category={place.category} className="mt-2" />}
        {(place.tripName || statusLabel || moodTags.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {place.tripName && (
              <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                {getTripLabel(place.tripName)}
              </span>
            )}
            {statusLabel && (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                {statusLabel}
              </span>
            )}
            {moodTags.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        )}
        {place.sharedWithMe && (
          <p className="mt-3 rounded-2xl bg-[#f4f8f5] px-3 py-2 text-sm font-semibold text-slate-800">
            Geteilt von {sharedBy || 'einem anderen Nutzer'}
          </p>
        )}
        {place.description && <p className="mt-4 rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-7 text-slate-600 ring-1 ring-slate-100">{place.description}</p>}
      </div>
      {canEdit && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onEdit} className="rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm shadow-emerald-200 transition hover:bg-emerald-400">
              Bearbeiten
            </button>
            <button type="button" data-cy="delete-place" onClick={() => onDelete(place)} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100">
              Löschen
            </button>
          </div>

          <div className="space-y-5 border-t border-slate-200 pt-5">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Öffentlicher Link</h3>
                <p className="mt-1 text-sm text-slate-500">Personen mit diesem Link können den Ort ansehen.</p>
              </div>

              {hasPublicShare && (
                <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-3">
                  {publicShare?.url ? (
                    <p className="break-all text-sm font-medium text-slate-800">{publicShare.url}</p>
                  ) : (
                    <p className="text-sm font-medium text-slate-700">
                      Ein öffentlicher Link ist aktiv. Erstelle einen neuen Link, um ihn erneut zu kopieren.
                    </p>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {publicShare?.url && (
                      <button
                        type="button"
                        onClick={handleCopyPublicShareLink}
                        disabled={isLoading}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 disabled:cursor-wait disabled:text-slate-400"
                      >
                        Link kopieren
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDisablePublicShareLink}
                      disabled={isLoading}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-wait disabled:text-rose-400 sm:col-span-1"
                    >
                      Link deaktivieren
                    </button>
                  </div>
                </div>
              )}

              {!hasPublicShare && (
                <button
                  type="button"
                  onClick={handleCreatePublicShareLink}
                  disabled={isLoading}
                  className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm shadow-emerald-200 transition hover:bg-emerald-400 disabled:cursor-wait disabled:bg-emerald-200"
                >
                  Link erstellen
                </button>
              )}

              {hasPublicShare && (
                <button
                  type="button"
                  onClick={handleCreatePublicShareLink}
                  disabled={isLoading}
                  className="w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
                >
                  Neuen Link erstellen
                </button>
              )}

              {copyStatus && <p className="text-sm font-medium text-emerald-700">{copyStatus}</p>}
              {publicShareError && <p className="text-sm font-medium text-rose-700">{publicShareError}</p>}
            </div>

            <div className="border-t border-slate-200 pt-5">
            <div>
              <h3 className="text-sm font-bold text-slate-950">Mit Person teilen</h3>
              <p className="mt-1 text-sm text-slate-500">Die Person muss bereits registriert sein.</p>
            </div>
            <form onSubmit={handleShare} className="mt-3 space-y-3">
              <input
                type="email"
                data-cy="share-email"
                value={shareEmail}
                onChange={(event) => setShareEmail(event.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                required
              />
              {shareError && <p className="text-sm font-medium text-rose-700">{shareError}</p>}
              <button
                type="submit"
                data-cy="share-submit"
                disabled={isLoading}
                className="w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
              >
                {isLoading ? 'Teile...' : 'Ort teilen'}
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-950">Geteilt mit</h3>
              {shares.length === 0 ? (
                <p className="text-sm text-slate-500">Noch keine Freigaben.</p>
              ) : (
                shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-900/5">
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
                      className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:text-slate-400"
                    >
                      Entfernen
                    </button>
                  </div>
                ))
              )}
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
