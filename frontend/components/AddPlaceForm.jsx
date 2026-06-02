'use client';

import { useState } from 'react';

const categoryOptions = [
  '',
  'Restaurant',
  'Hotel',
  'Sehenswürdigkeit',
  'Natur',
  'Shopping',
  'Sonstiges',
];

export default function AddPlaceForm({ coords, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

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

    onSave({
      lat: Number(coords.lat),
      lng: Number(coords.lng),
      title,
      description,
      category: category || undefined,
    });

    setTitle('');
    setDescription('');
    setCategory('');
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
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-900"
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option || 'Keine Kategorie'}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
          Abbrechen
        </button>
        <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          Ort speichern
        </button>
      </div>
    </form>
  );
}
