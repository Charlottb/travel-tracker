'use client';

import PlacesList from './PlacesList';
import PlaceDetail from './PlaceDetail';
import AddPlaceForm from './AddPlaceForm';

export default function Sidebar({
  mode = 'list',
  places = [],
  selectedPlace = null,
  formCoords = null,
  onPlaceCardClick = () => {},
  onSavePlace = () => {},
  onEditPlace = () => {},
  onDeletePlace = () => {},
  onClearSelectedPlace = () => {},
  onCloseForm = () => {},
}) {
  return (
    <div className="flex h-full min-h-[18rem] flex-col overflow-hidden bg-slate-50">
      <div className="border-b border-slate-200 px-5 py-4 bg-white">
        <h2 className="text-lg font-semibold text-slate-950">
          {mode === 'list' && 'Meine Orte'}
          {mode === 'detail' && selectedPlace?.title}
          {mode === 'form' && 'Neuen Ort hinzufügen'}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {mode === 'list' && <PlacesList places={places} onPlaceClick={onPlaceCardClick} />}
        {mode === 'detail' && selectedPlace && (
          <PlaceDetail
            place={selectedPlace}
            onEdit={onEditPlace}
            onDelete={onDeletePlace}
            onClose={onCloseForm}
          />
        )}
        {mode === 'form' && (
          <>
            <AddPlaceForm coords={formCoords} onSave={onSavePlace} onCancel={onCloseForm} />
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Bestehende Orte</h3>
              <PlacesList places={places} onPlaceClick={onPlaceCardClick} />
            </div>
            {selectedPlace && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <PlaceDetail
                  place={selectedPlace}
                  onEdit={onEditPlace}
                  onDelete={onDeletePlace}
                  onClose={onClearSelectedPlace}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
