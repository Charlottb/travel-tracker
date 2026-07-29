'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { getTripLabel } from './placeMetadata';
import { authFetch } from '../lib/authFetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
});

export default function TravelTrackerApp({ initialPlaces = [], currentUser = null }) {
  const socketRef = useRef(null);
  const [places, setPlaces] = useState(initialPlaces);
  const [currentUserState, setCurrentUserState] = useState(currentUser);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [sidebarMode, setSidebarMode] = useState('list');
  const [formCoords, setFormCoords] = useState(null);
  const [activeNav, setActiveNav] = useState('meine-orte');
  const [tripFilter, setTripFilter] = useState('');
  const [highlightPlaceId, setHighlightPlaceId] = useState(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  
  // ✅ NEW: Error State für User Feedback
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const placesForActiveNav = useMemo(() => {
    if (activeNav === 'geteilt') {
      return places.filter((place) => place.sharedWithMe);
    }

    return places.filter((place) => place.canEdit !== false);
  }, [activeNav, places]);

  const tripOptions = useMemo(() => {
    return [...new Set(placesForActiveNav.map((place) => getTripLabel(place.tripName)))].sort((a, b) =>
      a.localeCompare(b, 'de'),
    );
  }, [placesForActiveNav]);

  const visiblePlaces = useMemo(() => {
    if (!tripFilter) {
      return placesForActiveNav;
    }

    return placesForActiveNav.filter((place) => getTripLabel(place.tripName) === tripFilter);
  }, [placesForActiveNav, tripFilter]);

  useEffect(() => {
    if (tripFilter && !tripOptions.includes(tripFilter)) {
      setTripFilter('');
    }
  }, [tripFilter, tripOptions]);

  useEffect(() => {
    const loadMap = () => setShouldLoadMap(true);

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(loadMap, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(loadMap, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const refreshPlaces = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/places`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const freshPlaces = await response.json();
      setPlaces(freshPlaces);
    } catch (err) {
      console.error('[TravelTrackerApp] Error refreshing places:', err);
    }
  }, []);

  const readApiError = useCallback(async (response) => {
    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return data?.details || data?.error || text;
    } catch (_error) {
      return text || response.statusText || `HTTP ${response.status}`;
    }
  }, []);

  const replacePlace = useCallback((updatedPlace) => {
    setPlaces((currentPlaces) =>
      currentPlaces.map((place) => (place.id === updatedPlace.id ? updatedPlace : place)),
    );
    setSelectedPlace((currentPlace) => (currentPlace?.id === updatedPlace.id ? updatedPlace : currentPlace));
  }, []);

  useEffect(() => {
    let isMounted = true;
    let socketInstance = null;
    let idleId = null;
    let timeoutId = null;

    const connectSocket = async () => {
      try {
        const { io } = await import('socket.io-client');

        if (!isMounted) {
          return;
        }

        socketInstance = io(BACKEND_URL, {
          path: '/socket.io',
          transports: ['websocket'],
          withCredentials: true,
        });

        socketRef.current = socketInstance;

        socketInstance.on('place-created', async () => {
          await refreshPlaces();
        });
      } catch (socketError) {
        console.warn('[TravelTrackerApp] socket.io setup failed', socketError);
      }
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(connectSocket, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(connectSocket, 0);
    }

    return () => {
      isMounted = false;

      if (idleId) {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (socketInstance) {
        socketInstance.disconnect();
      }

      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
    };
  }, [refreshPlaces]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const eventSource = new EventSource(`${BACKEND_URL}/api/events`, { withCredentials: true });

    eventSource.addEventListener('place-created', async (event) => {
      console.log('[TravelTrackerApp] Received SSE place-created', event.data);
      await refreshPlaces();
    });

    eventSource.onerror = (error) => {
      console.warn('[TravelTrackerApp] SSE connection error', error);
    };

    return () => {
      eventSource.close();
      console.log('[TravelTrackerApp] SSE connection closed');
    };
  }, [refreshPlaces]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const url = new URL(window.location.href);
    const placeId = url.searchParams.get('place');

    if (placeId) {
      setHighlightPlaceId(placeId);
      window.requestAnimationFrame(() => {
        const element = document.getElementById(`place-${placeId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    return undefined;
  }, [places.length]);

  const handleMapClick = useCallback((latlng) => {
    setFormCoords(latlng);
    setSidebarMode('form');
    setSelectedPlace(null);
  }, []);

  const handleMarkerClick = useCallback((place) => {
    setSelectedPlace(place);
    setSidebarMode('detail');
  }, []);

  const handlePlaceCardClick = useCallback((place) => {
    setSelectedPlace(place);
    setSidebarMode('detail');
  }, []);

  const handleOpenAddPlace = useCallback(() => {
    setSelectedPlace(null);
    setFormCoords(null);
    setSidebarMode('form');
  }, []);

  const handleOpenProfile = useCallback(() => {
    setSelectedPlace(null);
    setFormCoords(null);
    setSidebarMode('profile');
  }, []);

  const handleSavePlace = useCallback(async (placeData) => {
    if (isLoading) {
      console.warn('[TravelTrackerApp] Save already in progress, ignoring duplicate request');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const isEditing = Boolean(placeData.id);
    const endpoint = isEditing ? `${API_BASE_URL}/places/${placeData.id}` : `${API_BASE_URL}/places`;
    const method = isEditing ? 'PUT' : 'POST';

    console.log('[TravelTrackerApp] 🚀 Saving place:', placeData);
    
    try {
      console.log(`[TravelTrackerApp] ${method} to`, endpoint);
      
      const response = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeData),
      });

      console.log('[TravelTrackerApp] Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[TravelTrackerApp] ❌ ${method} failed:`, errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const savedPlace = await response.json();
      console.log('[TravelTrackerApp] ✅ Place saved:', savedPlace);
      
      setPlaces((currentPlaces) => {
        if (isEditing) {
          return currentPlaces.map((place) => (place.id === savedPlace.id ? savedPlace : place));
        }

        return [...currentPlaces, savedPlace];
      });
      setSidebarMode('list');
      setFormCoords(null);
      setSelectedPlace(null);

      const socketInstance = socketRef.current;
      if (!isEditing && socketInstance?.connected) {
        socketInstance.emit('new-place', savedPlace);
      }
    } catch (err) {
      console.error('[TravelTrackerApp] ❌ Error saving place:', {
        message: err.message,
        name: err.name,
        url: endpoint,
      });
      setError(`Fehler beim Speichern: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleDeletePlace = useCallback(async (placeToDelete) => {
    if (!placeToDelete?.id) {
      console.error('[TravelTrackerApp] Delete called without valid ID');
      return;
    }

    if (!window.confirm(`Soll der Ort "${placeToDelete.title}" wirklich gelöscht werden?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    console.log('[TravelTrackerApp] 🚀 Deleting place:', placeToDelete.id);

    try {
      const url = `${API_BASE_URL}/places/${placeToDelete.id}`;
      console.log('[TravelTrackerApp] DELETE to', url);
      
      const response = await authFetch(url, {
        method: 'DELETE',
      });

      console.log('[TravelTrackerApp] Response:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[TravelTrackerApp] ❌ DELETE failed:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      console.log('[TravelTrackerApp] ✅ Place deleted:', placeToDelete.id);
      setPlaces((currentPlaces) => currentPlaces.filter((place) => place.id !== placeToDelete.id));
      setSidebarMode('list');
      setSelectedPlace(null);
    } catch (err) {
      console.error('[TravelTrackerApp] ❌ Error deleting place:', {
        message: err.message,
        name: err.name,
        url: `${API_BASE_URL}/places/${placeToDelete.id}`,
      });
      setError(`Fehler beim Löschen: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSharePlace = useCallback(async (place, email) => {
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';

    if (!place?.id || !trimmedEmail) {
      throw new Error('Bitte gib eine E-Mail-Adresse ein.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE_URL}/places/${place.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const result = await response.json();

      if (result?.id) {
        replacePlace(result);
      }

      return result;
    } catch (err) {
      setError(`Fehler beim Teilen: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [readApiError, replacePlace]);

  const handleUnsharePlace = useCallback(async (place, share) => {
    if (!place?.id || !share?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE_URL}/places/${place.id}/share/${share.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const updatedPlace = await response.json();
      replacePlace(updatedPlace);
    } catch (err) {
      setError(`Fehler beim Entfernen der Freigabe: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [readApiError, replacePlace]);

  const handleCreatePublicShareLink = useCallback(async (place) => {
    if (!place?.id) {
      throw new Error('Ort nicht gefunden.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE_URL}/places/${place.id}/public-share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const updatedPlace = await response.json();
      replacePlace(updatedPlace);
      return updatedPlace;
    } catch (err) {
      setError(`Fehler beim Erstellen des Share-Links: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [readApiError, replacePlace]);

  const handleDisablePublicShareLink = useCallback(async (place) => {
    if (!place?.id) {
      throw new Error('Ort nicht gefunden.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE_URL}/places/${place.id}/public-share`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const updatedPlace = await response.json();
      replacePlace(updatedPlace);
      return updatedPlace;
    } catch (err) {
      setError(`Fehler beim Deaktivieren des Share-Links: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [readApiError, replacePlace]);

  const handleUpdateProfile = useCallback(async ({ email, currentPassword, newPassword }) => {
    const payload = {
      email,
    };

    if (currentPassword) {
      payload.currentPassword = currentPassword;
    }

    if (newPassword) {
      payload.newPassword = newPassword;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = await response.json();
      setCurrentUserState(data.user);
      return data.user;
    } catch (err) {
      setError(`Fehler beim Speichern des Profils: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [readApiError]);

  const handleEditPlace = useCallback(() => {
    if (selectedPlace) {
      setFormCoords({ lat: selectedPlace.lat, lng: selectedPlace.lng });
      setSidebarMode('form');
    }
  }, [selectedPlace]);

  const handleClearSelectedPlace = useCallback(() => {
    setSelectedPlace(null);
    setFormCoords(null);
    setSidebarMode('list');
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden border border-slate-200 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur lg:min-h-[calc(100vh-3rem)] lg:rounded-[1.75rem] lg:flex-row">
      {/* ✅ Error Toast */}
      {error && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-2xl border border-red-200 bg-white p-4 shadow-xl shadow-red-950/10">
          <p className="font-semibold text-red-900">Fehler</p>
          <p className="mt-1 text-sm text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-3 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Schließen
          </button>
        </div>
      )}

      <div className="flex min-h-[340px] min-w-0 overflow-hidden lg:h-auto lg:basis-[59%] lg:flex-none">
        {shouldLoadMap ? (
          <MapView
            places={visiblePlaces}
            selectedCoords={formCoords}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-slate-100" />
        )}
      </div>
      <aside className="flex w-full min-w-0 flex-col border-t border-slate-200 bg-[#fbfaf7]/95 lg:min-h-0 lg:basis-[41%] lg:border-l lg:border-t-0">
        <Navbar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onAddPlace={handleOpenAddPlace}
          onOpenProfile={handleOpenProfile}
          isProfileOpen={sidebarMode === 'profile'}
          user={currentUserState}
        />
        <Sidebar
          mode={sidebarMode}
          places={visiblePlaces}
          tripFilter={tripFilter}
          tripOptions={tripOptions}
          profilePlaces={places}
          currentUser={currentUserState}
          selectedPlace={selectedPlace}
          formCoords={formCoords}
          highlightPlaceId={highlightPlaceId}
          onPlaceCardClick={handlePlaceCardClick}
          onTripFilterChange={setTripFilter}
          onSavePlace={handleSavePlace}
          onDeletePlace={handleDeletePlace}
          onEditPlace={handleEditPlace}
          onSharePlace={handleSharePlace}
          onUnsharePlace={handleUnsharePlace}
          onCreatePublicShareLink={handleCreatePublicShareLink}
          onDisablePublicShareLink={handleDisablePublicShareLink}
          onUpdateProfile={handleUpdateProfile}
          onClearSelectedPlace={handleClearSelectedPlace}
          onCloseForm={handleClearSelectedPlace}
          isLoading={isLoading}
        />
      </aside>
    </div>
  );
}
