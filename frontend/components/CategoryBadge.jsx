'use client';

export const CATEGORY_OPTIONS = [
  { value: 'Restaurant', label: 'Restaurant', icon: 'restaurant' },
  { value: 'Hotel', label: 'Hotel', icon: 'hotel' },
  { value: 'Sehenswürdigkeit', label: 'Sehenswürdigkeit', icon: 'landmark' },
  { value: 'Natur', label: 'Natur', icon: 'nature' },
  { value: 'Shopping', label: 'Shopping', icon: 'shopping' },
  { value: 'Sonstiges', label: 'Sonstiges', icon: 'other' },
];

const iconByCategory = CATEGORY_OPTIONS.reduce((icons, option) => {
  icons[option.value] = option.icon;
  return icons;
}, {});

function CategoryIcon({ type = 'custom', className = 'h-4 w-4' }) {
  const commonProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (type) {
    case 'restaurant':
      return (
        <svg {...commonProps}>
          <path d="M7 3v8" />
          <path d="M5 3v4" />
          <path d="M9 3v4" />
          <path d="M7 11v10" />
          <path d="M17 3c-2 2-3 5-3 8h4" />
          <path d="M18 3v18" />
        </svg>
      );
    case 'hotel':
      return (
        <svg {...commonProps}>
          <path d="M4 20V5" />
          <path d="M20 20V9" />
          <path d="M4 12h16" />
          <path d="M4 16h16" />
          <path d="M7 9h5" />
          <path d="M12 12V9" />
        </svg>
      );
    case 'landmark':
      return (
        <svg {...commonProps}>
          <path d="M4 10h16" />
          <path d="M6 10v8" />
          <path d="M10 10v8" />
          <path d="M14 10v8" />
          <path d="M18 10v8" />
          <path d="M3 18h18" />
          <path d="M12 4 4 8h16L12 4Z" />
        </svg>
      );
    case 'nature':
      return (
        <svg {...commonProps}>
          <path d="M5 13c6 0 10-3 14-9 1 8-3 15-10 15-3 0-5-2-5-5" />
          <path d="M4 20c3-6 7-9 13-12" />
        </svg>
      );
    case 'shopping':
      return (
        <svg {...commonProps}>
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>
      );
    case 'other':
      return (
        <svg {...commonProps}>
          <path d="M5 12h.01" />
          <path d="M12 12h.01" />
          <path d="M19 12h.01" />
        </svg>
      );
    case 'none':
      return (
        <svg {...commonProps}>
          <path d="M5 12h14" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <path d="M20 13 13 20 4 11V4h7l9 9Z" />
          <path d="M7.5 7.5h.01" />
        </svg>
      );
  }
}

export function getCategoryIconType(category) {
  return iconByCategory[category] || (category ? 'custom' : 'none');
}

export default function CategoryBadge({ category, className = '' }) {
  const label = category || 'Keine Kategorie';

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 ${className}`}
    >
      <CategoryIcon type={getCategoryIconType(category)} className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export { CategoryIcon };
