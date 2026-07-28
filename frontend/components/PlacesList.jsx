'use client';

import PlaceCard from './PlaceCard';
import { getTripLabel } from './placeMetadata';

export default function PlacesList({ places = [], onPlaceClick = () => {}, highlightPlaceId = null }) {
  const groupedPlaces = places.reduce((groups, place) => {
    const tripLabel = getTripLabel(place.tripName);
    return {
      ...groups,
      [tripLabel]: [...(groups[tripLabel] || []), place],
    };
  }, {});
  const tripGroups = Object.entries(groupedPlaces);

  return (
    <div className="space-y-4">
      {places.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/90 px-5 py-8 text-center shadow-sm shadow-slate-900/5">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-700">
            +
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-950">Noch keine Orte sichtbar</h3>
          <p className="mx-auto mt-2 max-w-64 text-sm leading-6 text-slate-500">
            Klicke auf die Karte oder nutze „Neuer Ort“, um deinen ersten Reiseort anzulegen.
          </p>
        </div>
      ) : (
        <>
          {tripGroups.map(([tripName, tripPlaces]) => (
            <section key={tripName} className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="truncate text-xs font-medium text-slate-500">{tripName}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{tripPlaces.length}</span>
              </div>
              {tripPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onClick={onPlaceClick}
                  highlight={String(place.id) === String(highlightPlaceId)}
                  anchorId={`place-${place.id}`}
                />
              ))}
            </section>
          ))}
          <p className="flex items-center gap-2 px-1 pt-2 text-xs font-normal leading-5 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
            Deine Sammlung wächst mit jedem Ort, den du festhältst.
          </p>
        </>
      )}
    </div>
  );
}
