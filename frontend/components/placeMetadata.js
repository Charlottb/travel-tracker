export const STATUS_OPTIONS = [
  { value: '', label: 'Kein Status' },
  { value: 'want_to_visit', label: 'Möchte hin' },
  { value: 'planned', label: 'Geplant' },
  { value: 'visited', label: 'Besucht' },
  { value: 'favorite', label: 'Favorit' },
];

export const MOOD_TAG_OPTIONS = [
  'ruhig',
  'aussicht',
  'guenstig',
  'romantisch',
  'kultur',
  'essen',
  'geheimtipp',
  'regenwetter',
  'sonnenuntergang',
];

export function getStatusLabel(status) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label || '';
}

export function parseMoodTags(moodTags) {
  if (!moodTags) {
    return [];
  }

  if (Array.isArray(moodTags)) {
    return moodTags.filter((tag) => MOOD_TAG_OPTIONS.includes(tag));
  }

  try {
    const parsedMoodTags = JSON.parse(moodTags);
    return Array.isArray(parsedMoodTags)
      ? parsedMoodTags.filter((tag) => MOOD_TAG_OPTIONS.includes(tag))
      : [];
  } catch (_error) {
    return [];
  }
}

export function getTripLabel(tripName) {
  return tripName?.trim() || 'Noch keiner Reise zugeordnet';
}
