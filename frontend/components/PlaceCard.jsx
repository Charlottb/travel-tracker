'use client';

import CategoryBadge from './CategoryBadge';
import { getStatusLabel, getTripLabel, parseMoodTags } from './placeMetadata';

export default function PlaceCard({ place, onClick, highlight = false, anchorId }) {
  const sharedBy = place.sharedBy?.name || place.sharedBy?.email || place.owner?.name || place.owner?.email;
  const moodTags = parseMoodTags(place.moodTags);
  const statusLabel = getStatusLabel(place.status);
  const tripLabel = getTripLabel(place.tripName);
  const metaLine = [tripLabel, statusLabel, moodTags[0]].filter(Boolean).join(' · ');

  return (
    <button
      id={anchorId}
      type="button"
      onClick={() => onClick?.(place)}
      className={`group w-full rounded-2xl border px-4 py-3.5 text-left shadow-sm transition duration-200 hover:-translate-y-px hover:border-slate-300 hover:bg-white hover:shadow-md hover:shadow-slate-900/8 ${
        highlight ? 'border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-100' : 'border-slate-200 bg-white/95'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-medium text-emerald-700">Travel Note</p>
          <h3 className="truncate text-[15px] font-semibold leading-5 tracking-tight text-slate-950">{place.title}</h3>
          {metaLine && <p className="mt-1 truncate text-xs font-normal text-slate-500">{metaLine}</p>}
          {place.category && <CategoryBadge category={place.category} className="mt-2" />}
        </div>
        <span className="mt-5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-slate-300 transition group-hover:translate-x-0.5 group-hover:bg-emerald-50 group-hover:text-emerald-600">→</span>
      </div>
      {place.sharedWithMe && (
        <p className="mt-1 text-xs font-normal text-slate-600">
          Geteilt von {sharedBy || 'einem anderen Nutzer'}
        </p>
      )}
      {(place.tripName || statusLabel) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {place.tripName && (
          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {tripLabel}
            </span>
          )}
          {statusLabel && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              {statusLabel}
            </span>
          )}
        </div>
      )}
      {place.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{place.description}</p>}
      {moodTags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {moodTags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-normal text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
