'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, ZoomControl, ScaleControl, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CategoryBadge from './CategoryBadge';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function FitPlaces({ places }) {
  const map = useMap();

  useEffect(() => {
    if (!places.length) {
      return;
    }

    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng]));
    map.fitBounds(bounds, {
      animate: true,
      maxZoom: 12,
      padding: [70, 70],
    });
  }, [map, places]);

  return null;
}

function AddressSearchControl({ onSelectAddress }) {
  const map = useMap();
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    L.DomEvent.disableClickPropagation(containerRef.current);
    L.DomEvent.disableScrollPropagation(containerRef.current);
  }, []);

  const selectResult = (result) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    onSelectAddress({ lat, lng });
    map.flyTo([lat, lng], 17, { animate: true, duration: 0.8 });
    setQuery(result.display_name);
    setResults([]);
    setError('');
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setError('');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const params = new URLSearchParams({
        format: 'json',
        q: trimmedQuery,
        limit: '5',
        addressdetails: '1',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || data.length === 0) {
        setError('Keine Adresse gefunden.');
      }
    } catch (searchError) {
      console.error('[MapView] Address search failed:', searchError);
      setResults([]);
      setError('Adresssuche fehlgeschlagen.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div ref={containerRef} className="absolute left-4 right-4 top-4 z-[500] max-w-xl lg:right-auto lg:w-[28rem]">
      <form
        onSubmit={handleSearch}
        className="relative flex overflow-hidden rounded-full bg-white shadow-xl shadow-slate-900/12 ring-1 ring-slate-200"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 rounded-l-full border-r border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
          placeholder="Straße, Hausnummer oder Ort suchen"
          type="search"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="shrink-0 rounded-r-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-950/20 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 disabled:cursor-wait disabled:bg-slate-400 disabled:shadow-none"
        >
          {isSearching ? '...' : 'Suchen'}
        </button>
      </form>
      {(results.length > 0 || error) && (
        <div className="mt-2 overflow-hidden rounded-lg bg-white shadow-xl shadow-slate-900/12 ring-1 ring-slate-200">
          {error && <p className="px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => selectResult(result)}
              className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition last:border-b-0 hover:bg-slate-100 hover:text-slate-950"
            >
              <span className="line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapView({
  places = [],
  selectedCoords = null,
  onMapClick = () => {},
  onMarkerClick = () => {},
}) {
  const markerIcon = useMemo(
    () =>
      new L.DivIcon({
        className: 'travel-marker',
        html: '<span class="travel-marker__pin"><span class="travel-marker__dot"></span></span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      }),
    [],
  );
  const selectedMarkerIcon = useMemo(
    () =>
      new L.DivIcon({
        className: 'new-place-marker',
        html: '<span class="new-place-marker__pulse"></span><span class="new-place-marker__pin"></span>',
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -20],
      }),
    [],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <MapContainer
        center={[51.1657, 10.4515]}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" imperial={false} />
        <AddressSearchControl onSelectAddress={onMapClick} />
        <MapClickHandler onMapClick={onMapClick} />
        <FitPlaces places={places} />
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={markerIcon}
            eventHandlers={{ click: () => onMarkerClick(place) }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -22]}
              opacity={0.95}
              className="rounded-xl border border-slate-200 bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-950 shadow-lg shadow-slate-900/10"
            >
              {place.title}
            </Tooltip>
            <Popup>
              <div className="max-w-56 space-y-2 text-sm text-slate-800">
                <strong className="text-base text-slate-950">{place.title}</strong>
                {place.sharedWithMe && (
                  <p className="font-semibold text-slate-900">
                    Geteilt von {place.sharedBy?.name || place.sharedBy?.email || place.owner?.name || place.owner?.email || 'einem anderen Nutzer'}
                  </p>
                )}
                {place.description && <p className="leading-5">{place.description}</p>}
                {place.category && <CategoryBadge category={place.category} />}
              </div>
            </Popup>
          </Marker>
        ))}
        {selectedCoords && (
          <Marker
            position={[selectedCoords.lat, selectedCoords.lng]}
            icon={selectedMarkerIcon}
            interactive={false}
          />
        )}
      </MapContainer>
      <div className="pointer-events-none absolute left-4 top-[5.25rem] z-[400] rounded-lg bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/10 ring-1 ring-slate-200 lg:top-20">
        Klicke auf die Karte, um einen Ort hinzuzufügen
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-lg bg-slate-950/90 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-900/20">
        {places.length} {places.length === 1 ? 'Ort' : 'Orte'}
      </div>
    </div>
  );
}
