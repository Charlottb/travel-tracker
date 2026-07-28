'use client';

import CategoryBadge from './CategoryBadge';
import { getStatusLabel, getTripLabel, parseMoodTags } from './placeMetadata';

export default function PlaceCard({ place, onClick, highlight = false, anchorId }) {
  const sharedBy = place.sharedBy?.name || place.sharedBy?.email || place.owner?.name || place.owner?.email;
  const moodTags = parseMoodTags(place.moodTags);
  const statusLabel = getStatusLabel(place.status);
  const hasPrimaryMetadata = Boolean(place.tripName || statusLabel);

  return (
    <button
      id={anchorId}
      type="button"
      onClick={() => onClick?.(place)}
      className={`group w-full rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 ${
        highlight ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-semibold text-slate-950">{place.title}</h3>
        <span className="mt-0.5 shrink-0 text-slate-300 transition group-hover:text-slate-500">→</span>
      </div>
      {place.sharedWithMe && (
        <p className="mt-1 text-xs font-semibold text-slate-700">
          Geteilt von {sharedBy || 'einem anderen Nutzer'}
        </p>
      )}
      {hasPrimaryMetadata && (
        <div className="mt-3 flex flex-wrap gap-2">
          {place.tripName && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {getTripLabel(place.tripName)}
            </span>
          )}
          {statusLabel && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {statusLabel}
            </span>
          )}
        </div>
      )}
      {place.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{place.description}</p>}
      {place.category && <CategoryBadge category={place.category} className="mt-3" />}
      {moodTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {moodTags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500">
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
