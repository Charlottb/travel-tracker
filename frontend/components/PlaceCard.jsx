'use client';

export default function PlaceCard({ place, onClick, highlight = false, anchorId }) {
  return (
    <button
      id={anchorId}
      type="button"
      onClick={() => onClick?.(place)}
      className={`w-full rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        highlight ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
      }`}
    >
      <h3 className="text-base font-semibold text-slate-950">{place.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{place.description}</p>
      {place.category && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{place.category}</p>}
    </button>
  );
}
