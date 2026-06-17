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

export default function TravelTrackerApp({ initialPlaces = [] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [sidebarMode, setSidebarMode] = useState('list');
  const [formCoords, setFormCoords] = useState(null);
  const [activeNav, setActiveNav] = useState('karte');
  
  // ✅ NEW: Error State für User Feedback
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSavePlace = useCallback(async (placeData) => {
    if (isLoading) {
      console.warn('[TravelTrackerApp] Save already in progress, ignoring duplicate request');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    console.log('[TravelTrackerApp] 🚀 Saving place:', placeData);
    
    try {
      const url = `${API_BASE_URL}/places`;
      console.log('[TravelTrackerApp] POST to', url);
      
      const response = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeData),
      });

      console.log('[TravelTrackerApp] Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[TravelTrackerApp] ❌ POST failed:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const newPlace = await response.json();
      console.log('[TravelTrackerApp] ✅ Place saved:', newPlace);
      
      setPlaces((currentPlaces) => [...currentPlaces, newPlace]);
      setSidebarMode('list');
      setFormCoords(null);
      setSelectedPlace(null);

      if (socket && socket.connected) {
        socket.emit('new-place', newPlace);
      }
    } catch (err) {
      console.error('[TravelTrackerApp] ❌ Error saving place:', {
        message: err.message,
        name: err.name,
        url: `${API_BASE_URL}/places`,
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

  const handleEditPlace = useCallback(() => {
    if (selectedPlace) {
      setFormCoords({ lat: selectedPlace.lat, lng: selectedPlace.lng });
      setSidebarMode('form');
    }
  }, [selectedPlace]);

  const handleClearSelectedPlace = useCallback(() => {
    setSelectedPlace(null);
    setSidebarMode('list');
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:flex-row">
      {/* ✅ Error Toast */}
      {error && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-red-300 bg-red-50 p-4 shadow-lg">
          <p className="font-semibold text-red-900">❌ Fehler</p>
          <p className="mt-1 text-sm text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-700 underline"
          >
            Schließen
          </button>
        </div>
      )}

      <div className="flex h-[420px] min-h-[420px] flex-1 lg:h-auto lg:min-h-[auto]">
        <MapView
          places={places}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
        />
      </div>
      <div className="flex w-full flex-col lg:w-[420px]">
        <Navbar activeNav={activeNav} setActiveNav={setActiveNav} onAddPlace={handleOpenAddPlace} />
        <Sidebar
          mode={sidebarMode}
          places={places}
          selectedPlace={selectedPlace}
          formCoords={formCoords}
          onPlaceCardClick={handlePlaceCardClick}
          onSavePlace={handleSavePlace}
          onDeletePlace={handleDeletePlace}
          onEditPlace={handleEditPlace}
          onClearSelectedPlace={handleClearSelectedPlace}
        />
      </div>
    </div>
  );
}
