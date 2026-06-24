'use client';

import PlacesList from './PlacesList';
import PlaceDetail from './PlaceDetail';
import AddPlaceForm from './AddPlaceForm';

export default function Sidebar({
  mode = 'list',
  places = [],
  selectedPlace = null,
  formCoords = null,
  highlightPlaceId = null,
  onPlaceCardClick = () => {},
  onSavePlace = () => {},
  onEditPlace = () => {},
  onDeletePlace = () => {},
  onCloseForm = () => {},
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden bg-slate-50">
      <div className="border-b border-slate-200 px-5 py-4 bg-white">
        <h2 className="text-lg font-semibold text-slate-950">
          {mode === 'list' && 'Meine Orte'}
          {mode === 'detail' && selectedPlace?.title}
          {mode === 'form' && (selectedPlace ? 'Ort bearbeiten' : 'Neuen Ort hinzufügen')}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {mode === 'list' && (
          <PlacesList places={places} onPlaceClick={onPlaceCardClick} highlightPlaceId={highlightPlaceId} />
        )}
        {mode === 'detail' && selectedPlace && (
          <PlaceDetail
            place={selectedPlace}
            onEdit={onEditPlace}
            onDelete={onDeletePlace}
            onClose={onCloseForm}
          />
        )}
        {mode === 'form' && (
          <AddPlaceForm
            coords={formCoords}
            place={selectedPlace}
            onSave={onSavePlace}
            onCancel={onCloseForm}
          />
        )}
      </div>
    </div>
  );
}
