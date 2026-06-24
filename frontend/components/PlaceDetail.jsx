'use client';

import CategoryBadge from './CategoryBadge';

export default function PlaceDetail({ place, onEdit, onDelete, onClose }) {
  if (!place) return null;

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Zurück
      </button>
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{place.title}</h2>
        {place.category && <CategoryBadge category={place.category} className="mt-2" />}
        <p className="mt-4 text-sm leading-7 text-slate-600">{place.description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onEdit} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          Bearbeiten
        </button>
        <button type="button" onClick={() => onDelete(place)} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600">
          Löschen
        </button>
      </div>
    </div>
  );
}
