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
    detail: selectedPlace?.sharedWithMe ? 'Von jemandem mit dir geteilt' : 'Notizen, Lage und Teilen',
    form: selectedPlace ? 'Reisenotiz aktualisieren' : 'Karte anklicken und neuen Ort merken',
    profile: 'Konto und Einstellungen',
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fbfaf7]">
      <div className="bg-white/70 px-5 pb-3 pt-4 backdrop-blur xl:px-6">
        <p className="text-xs font-medium text-slate-500">
          {mode === 'profile' ? 'Konto' : 'Deine Sammlung'}
        </p>
        <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-950">{titles[mode]}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitles[mode]}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 xl:px-6">
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
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-3 shadow-sm shadow-slate-900/5">
                <label className="block text-sm font-medium text-slate-700">Nach Trip anzeigen</label>
                <div className="relative mt-2">
                  <select
                    value={tripFilter}
                    onChange={(event) => onTripFilterChange(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-[#fbfaf7] px-3 py-2.5 pr-9 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Alle Trips</option>
                    {tripOptions.map((tripName) => (
                      <option key={tripName} value={tripName}>
                        {tripName}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true">
                    ▾
                  </span>
                </div>
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
