'use client';

import PlaceCard from './PlaceCard';

export default function PlacesList({ places = [], onPlaceClick = () => {}, highlightPlaceId = null }) {
  return (
    <div className="space-y-3">
      {places.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold text-slate-700">
            +
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-950">Noch keine Orte sichtbar</h3>
          <p className="mx-auto mt-2 max-w-64 text-sm leading-6 text-slate-500">
            Klicke auf die Karte oder nutze „Neuer Ort“, um deinen ersten Reiseort anzulegen.
          </p>
        </div>
      ) : (
        places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onClick={onPlaceClick}
            highlight={String(place.id) === String(highlightPlaceId)}
            anchorId={`place-${place.id}`}
          />
        ))
      )}
    </div>
  );
}
