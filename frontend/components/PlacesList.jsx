'use client';

import PlaceCard from './PlaceCard';

export default function PlacesList({ places = [], onPlaceClick = () => {}, highlightPlaceId = null }) {
  return (
    <div className="space-y-3">
      {places.length === 0 ? (
        <p className="text-sm text-slate-500">Wähle einen Punkt auf der Karte, um einen neuen Ort zu erstellen.</p>
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
