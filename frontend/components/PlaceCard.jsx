'use client';

export default function PlaceCard({ place, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(place)}
      className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="text-base font-semibold text-slate-950">{place.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{place.description}</p>
      {place.category && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{place.category}</p>}
    </button>
  );
}
