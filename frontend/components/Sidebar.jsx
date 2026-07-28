'use client';

import PlacesList from './PlacesList';
import PlaceDetail from './PlaceDetail';
import AddPlaceForm from './AddPlaceForm';
import ProfilePanel from './ProfilePanel';

export default function Sidebar({
  mode = 'list',
  places = [],
  tripFilter = '',
  tripOptions = [],
  profilePlaces = [],
  currentUser = null,
  selectedPlace = null,
  formCoords = null,
  highlightPlaceId = null,
  onPlaceCardClick = () => {},
  onTripFilterChange = () => {},
  onSavePlace = () => {},
  onEditPlace = () => {},
  onDeletePlace = () => {},
  onSharePlace = async () => {},
  onUnsharePlace = async () => {},
  onCreatePublicShareLink = async () => {},
  onDisablePublicShareLink = async () => {},
  onUpdateProfile = async () => {},
  onCloseForm = () => {},
  isLoading = false,
}) {
  const titles = {
    list: 'Meine Orte',
    detail: selectedPlace?.title,
    form: selectedPlace ? 'Ort bearbeiten' : 'Neuen Ort hinzufügen',
    profile: 'Profil',
  };

  const subtitles = {
    list: `${places.length} ${places.length === 1 ? 'Ort' : 'Orte'} sichtbar`,
    detail: selectedPlace?.sharedWithMe ? 'Geteilter Ort' : 'Details und Freigaben',
    form: selectedPlace ? 'Details aktualisieren' : 'Karte anklicken und Ort speichern',
    profile: 'Konto, Login-Daten und Kontakte',
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {mode === 'profile' ? 'Konto' : 'Workspace'}
        </p>
        <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">{titles[mode]}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitles[mode]}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {mode === 'profile' && (
          <ProfilePanel
            user={currentUser}
            places={profilePlaces}
            onUpdateProfile={onUpdateProfile}
            isSavingProfile={isLoading}
            onClose={onCloseForm}
          />
        )}
        {mode === 'list' && (
          <div className="space-y-4">
            {tripOptions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Trip filtern</label>
                <select
                  value={tripFilter}
                  onChange={(event) => onTripFilterChange(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="">Alle Trips</option>
                  {tripOptions.map((tripName) => (
                    <option key={tripName} value={tripName}>
                      {tripName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <PlacesList places={places} onPlaceClick={onPlaceCardClick} highlightPlaceId={highlightPlaceId} />
          </div>
        )}
        {mode === 'detail' && selectedPlace && (
          <PlaceDetail
            place={selectedPlace}
            onEdit={onEditPlace}
            onDelete={onDeletePlace}
            onSharePlace={onSharePlace}
            onUnsharePlace={onUnsharePlace}
            onCreatePublicShareLink={onCreatePublicShareLink}
            onDisablePublicShareLink={onDisablePublicShareLink}
            isLoading={isLoading}
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
