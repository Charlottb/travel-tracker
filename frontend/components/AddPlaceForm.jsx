'use client';

import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS, CategoryIcon } from './CategoryBadge';
import { MOOD_TAG_OPTIONS, STATUS_OPTIONS, parseMoodTags } from './placeMetadata';

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
  const [tripName, setTripName] = useState('');
  const [status, setStatus] = useState('');
  const [moodTags, setMoodTags] = useState([]);
  const isEditing = Boolean(place?.id);
  const usesCustomCategory = category === CUSTOM_CATEGORY;

  const isCategorySelected = (optionValue) =>
    optionValue === CUSTOM_CATEGORY ? usesCustomCategory : category === optionValue;

  useEffect(() => {
    const savedCategory = place?.category || '';
    const isKnownCategory = CATEGORY_OPTIONS.some((option) => option.value === savedCategory);

    setTitle(place?.title || '');
    setDescription(place?.description || '');
    setCategory(savedCategory && !isKnownCategory ? CUSTOM_CATEGORY : savedCategory);
    setCustomCategory(savedCategory && !isKnownCategory ? savedCategory : '');
    setTripName(place?.tripName || '');
    setStatus(place?.status || '');
    setMoodTags(parseMoodTags(place?.moodTags));
  }, [place]);

  const toggleMoodTag = (tag) => {
    setMoodTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag],
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim()) {
      alert('Bitte gib einen Titel ein.');
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
      title: title.trim(),
      description: description.trim() || undefined,
      category: finalCategory || undefined,
      tripName: tripName.trim() || undefined,
      status: status || undefined,
      moodTags: moodTags.length > 0 ? JSON.stringify(moodTags) : undefined,
    });

    if (!isEditing) {
      setTitle('');
      setDescription('');
      setCategory('');
      setCustomCategory('');
      setTripName('');
      setStatus('');
      setMoodTags([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <button type="button" onClick={onCancel} className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
        ← Abbrechen
      </button>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Titel</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          placeholder="Name des Ortes"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Beschreibung optional</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          rows={4}
          placeholder="Was ist besonders an diesem Ort?"
        />
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800">
        {coords ? (
          <p>
            Koordinaten: <span className="font-semibold">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
          </p>
        ) : (
          <p>Wähle einen Ort auf der Karte aus, um die Koordinaten automatisch zu übernehmen.</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Trip oder Sammlung optional</label>
        <input
          value={tripName}
          onChange={(event) => setTripName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          maxLength={80}
          placeholder="z.B. Rom Wochenende, Japan 2026"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Status</label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Mood-Tags</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOOD_TAG_OPTIONS.map((tag) => {
            const isSelected = moodTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleMoodTag(tag)}
                aria-pressed={isSelected}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Kategorie</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {categoryChoices.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
              aria-pressed={isCategorySelected(option.value)}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-left text-sm font-semibold transition ${
                isCategorySelected(option.value)
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm shadow-slate-900/20 ring-2 ring-slate-900/10'
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
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
            placeholder="Eigene Kategorie, z.B. Lieblingsplatz"
          />
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
          Abbrechen
        </button>
        <button type="submit" className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-900/15 transition hover:bg-slate-800">
          {isEditing ? 'Änderungen speichern' : 'Ort speichern'}
        </button>
      </div>
    </form>
  );
}
