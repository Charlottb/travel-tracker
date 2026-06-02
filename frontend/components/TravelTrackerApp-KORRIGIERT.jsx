'use client';

import { useCallback, useState, useEffect } from 'react';
import Navbar from './Navbar';
import MapView from './MapView';
import Sidebar from './Sidebar';
import { api, ApiError } from '../lib/apiClient';

/**
 * ✅ RICHTIG: Client Component mit robustem API Client
 * 
 * Vorteile:
 * 1. Zentralisiertes Error-Handling
 * 2. Automatische Retry-Logik bei flüchtigen Fehlern
 * 3. Proper Logging für Debugging
 * 4. Timeout-Handling
 * 5. User Feedback bei Fehlern
 */

export default function TravelTrackerApp({ initialPlaces = [] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [sidebarMode, setSidebarMode] = useState('list');
  const [formCoords, setFormCoords] = useState(null);
  const [activeNav, setActiveNav] = useState('karte');
  
  // ✅ Fehler- und Lade-Status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Error-Toast nach 5 Sekunden entfernen
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ✅ ErrorToast Component
  const ErrorToast = () => {
    if (!error) return null;
    return (
      <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-red-300 bg-red-50 p-4 shadow-lg">
        <p className="font-semibold text-red-900">{error.title}</p>
        <p className="mt-1 text-sm text-red-800">{error.message}</p>
        {error.code && (
          <p className="mt-2 text-xs text-red-700">Code: {error.code}</p>
        )}
      </div>
    );
  };

  // ✅ ErrorToast Hilfsfunktion
  const showError = (title, message, code = null) => {
    setError({ title, message, code });
    console.error(`[UI Error] ${title}:`, message, code);
  };

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

  /**
   * ✅ Robustes POST mit Fehlerbehandlung
   */
  const handleSavePlace = useCallback(async (placeData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[handleSavePlace] Speichere:', placeData);

      // ✅ Verwende API Wrapper statt direktem fetch
      const newPlace = await api.post('/places', placeData);

      console.log('[handleSavePlace] Erfolgreich gespeichert:', newPlace);
      setPlaces((currentPlaces) => [...currentPlaces, newPlace]);
      setSidebarMode('list');
      setFormCoords(null);
      setSelectedPlace(null);
    } catch (err) {
      // ✅ ApiError Klasse bietet strukturierte Fehlerinformationen
      if (err instanceof ApiError) {
        console.error('[handleSavePlace] API Error:', {
          code: err.code,
          message: err.message,
          context: err.context,
        });

        showError(
          'Ort konnte nicht gespeichert werden',
          err.message,
          err.code
        );
      } else {
        console.error('[handleSavePlace] Unerwarteter Fehler:', err);
        showError(
          'Unerwarteter Fehler',
          err instanceof Error ? err.message : 'Unbekannter Fehler'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * ✅ Robustes DELETE mit Bestätigung
   */
  const handleDeletePlace = useCallback(async (placeToDelete) => {
    if (!placeToDelete?.id) {
      showError('Fehler', 'Ungültige Orts-ID');
      return;
    }

    if (!window.confirm(`Soll der Ort "${placeToDelete.title}" wirklich gelöscht werden?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[handleDeletePlace] Lösche Ort mit ID:', placeToDelete.id);

      // ✅ Verwende API Wrapper
      await api.delete(`/places/${placeToDelete.id}`);

      console.log('[handleDeletePlace] Erfolgreich gelöscht');
      setPlaces((currentPlaces) =>
        currentPlaces.filter((place) => place.id !== placeToDelete.id)
      );
      setSidebarMode('list');
      setSelectedPlace(null);
    } catch (err) {
      if (err instanceof ApiError) {
        console.error('[handleDeletePlace] API Error:', err.code, err.message);
        showError(
          'Ort konnte nicht gelöscht werden',
          err.message,
          err.code
        );
      } else {
        console.error('[handleDeletePlace] Unerwarteter Fehler:', err);
        showError('Fehler beim Löschen', 'Ein unerwarteter Fehler ist aufgetreten');
      }
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
      <ErrorToast />

      <div className="flex h-[420px] min-h-[420px] flex-1 lg:h-auto lg:min-h-[auto]">
        <MapView
          places={places}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          isLoading={isLoading}
        />
      </div>

      <div className="flex w-full flex-col lg:w-[420px]">
        <Navbar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onAddPlace={handleOpenAddPlace}
          isLoading={isLoading}
        />

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
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
