'use client';

import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS, CategoryIcon } from './CategoryBadge';

const CUSTOM_CATEGORY = '__custom__';
const categoryChoices = [
  { value: '', label: 'Keine', icon: 'none' },
  ...CATEGORY_OPTIONS,
  { value: CUSTOM_CATEGORY, label: 'Eigene', icon: 'custom' },
];

export default function AddPlaceForm({ coords, place = null, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const isEditing = Boolean(place?.id);
  const usesCustomCategory = category === CUSTOM_CATEGORY;

  useEffect(() => {
    const savedCategory = place?.category || '';
    const isKnownCategory = CATEGORY_OPTIONS.some((option) => option.value === savedCategory);

    setTitle(place?.title || '');
    setDescription(place?.description || '');
    setCategory(savedCategory && !isKnownCategory ? CUSTOM_CATEGORY : savedCategory);
    setCustomCategory(savedCategory && !isKnownCategory ? savedCategory : '');
  }, [place]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert('Bitte fülle Titel und Beschreibung aus.');
      return;
    }

    if (!coords || Number.isNaN(Number(coords.lat)) || Number.isNaN(Number(coords.lng))) {
      alert('Bitte wähle einen Ort auf der Karte aus.');
      return;
    }

    const finalCategory = usesCustomCategory ? customCategory.trim() : category;

    if (usesCustomCategory && !finalCategory) {
      alert('Bitte gib eine eigene Kategorie ein.');
      return;
    }

    onSave({
      ...(place?.id ? { id: place.id } : {}),
      lat: Number(coords.lat),
      lng: Number(coords.lng),
      title,
      description,
      category: finalCategory || undefined,
    });

    if (!isEditing) {
      setTitle('');
      setDescription('');
      setCategory('');
      setCustomCategory('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-900">
        ← Abbrechen
      </button>
      <div>
        <label className="block text-sm font-medium text-slate-700">Titel</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-900"
          placeholder="Name des Ortes"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Beschreibung</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-900"
          rows={4}
          placeholder="Was ist besonders an diesem Ort?"
        />
      </div>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {coords ? (
          <p>
            Koordinaten: <span className="font-semibold text-slate-900">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
          </p>
        ) : (
          <p>Wähle einen Ort auf der Karte aus, um die Koordinaten automatisch zu übernehmen.</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Kategorie</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {categoryChoices.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
              className={`flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-medium transition ${
                category === option.value
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <CategoryIcon type={option.icon} className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          ))}
        </div>
        {usesCustomCategory && (
          <input
            value={customCategory}
            onChange={(event) => setCustomCategory(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500"
            placeholder="Eigene Kategorie, z.B. Lieblingsplatz"
          />
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
          Abbrechen
        </button>
        <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          {isEditing ? 'Änderungen speichern' : 'Ort speichern'}
        </button>
      </div>
    </form>
  );
}
