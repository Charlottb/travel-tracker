'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { authFetch } from '../lib/authFetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
});

// Debug: Zeige URL wenn geladen
if (typeof window !== 'undefined') {
  console.log('[TravelTrackerApp] Client-side API URL:', API_BASE_URL);
}

export default function TravelTrackerApp({ initialPlaces = [], currentUser = null }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [currentUserState, setCurrentUserState] = useState(currentUser);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [sidebarMode, setSidebarMode] = useState('list');
  const [formCoords, setFormCoords] = useState(null);
  const [activeNav, setActiveNav] = useState('meine-orte');
  const [highlightPlaceId, setHighlightPlaceId] = useState(null);
  
  // ✅ NEW: Error State für User Feedback
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const visiblePlaces = useMemo(() => {
    if (activeNav === 'geteilt') {
      return places.filter((place) => place.sharedWithMe);
    }

    return places.filter((place) => place.canEdit !== false);
  }, [activeNav, places]);

  // Debug bei Mount
  useEffect(() => {
    console.log('[TravelTrackerApp] Mounted with', initialPlaces.length, 'initial places');
  }, [initialPlaces.length]);

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

  const socket = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const socketInstance = io(BACKEND_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('[TravelTrackerApp] socket.io connected', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[TravelTrackerApp] socket.io disconnected', reason);
    });

    socketInstance.on('place-created', async () => {
      console.log('[TravelTrackerApp] Received place-created event from socket.io');
      await refreshPlaces();
    });

    return socketInstance;
  }, [refreshPlaces]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    return () => {
      socket.disconnect();
    };
  }, [socket]);

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

      if (!isEditing && socket && socket.connected) {
        socket.emit('new-place', savedPlace);
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
  }, [isLoading, socket]);

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

      const updatedPlace = await response.json();
      replacePlace(updatedPlace);
      return updatedPlace;
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

  const handleUpdateProfile = useCallback(async ({ email, currentPassword, newPassword }) => {
    const payload = {
      email,
    };

    if (newPassword) {
      payload.currentPassword = currentPassword;
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
    <div className="flex min-h-screen flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:min-h-[calc(100vh-3rem)] lg:rounded-2xl lg:flex-row">
      {/* ✅ Error Toast */}
      {error && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-red-200 bg-white p-4 shadow-xl shadow-red-950/10">
          <p className="font-semibold text-red-900">Fehler</p>
          <p className="mt-1 text-sm text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-3 rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Schließen
          </button>
        </div>
      )}

      <div className="flex min-h-[340px] min-w-0 flex-1 overflow-hidden lg:h-auto">
        <MapView
          places={visiblePlaces}
          selectedCoords={formCoords}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
        />
      </div>
      <aside className="flex w-full min-w-0 flex-col border-t border-slate-200 bg-slate-50/80 lg:w-[440px] lg:min-h-0 lg:border-l lg:border-t-0">
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
          profilePlaces={places}
          currentUser={currentUserState}
          selectedPlace={selectedPlace}
          formCoords={formCoords}
          highlightPlaceId={highlightPlaceId}
          onPlaceCardClick={handlePlaceCardClick}
          onSavePlace={handleSavePlace}
          onDeletePlace={handleDeletePlace}
          onEditPlace={handleEditPlace}
          onSharePlace={handleSharePlace}
          onUnsharePlace={handleUnsharePlace}
          onUpdateProfile={handleUpdateProfile}
          onClearSelectedPlace={handleClearSelectedPlace}
          onCloseForm={handleClearSelectedPlace}
          isLoading={isLoading}
        />
      </aside>
    </div>
  );
}
