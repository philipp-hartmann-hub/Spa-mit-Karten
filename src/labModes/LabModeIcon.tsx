import type { LabMode } from '../gameModes'

type Props = { id: LabMode; className?: string }

export function LabModeIcon({ id, className }: Props) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (id) {
    case 'area':
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="1.5" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      )
    case 'distance':
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M8 12h8" />
        </svg>
      )
    case 'antipode':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
          <circle cx="12" cy="17" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'fits':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="1" />
          <rect x="6" y="8" width="5" height="4" />
          <rect x="12" y="8" width="5" height="4" />
          <rect x="6" y="13" width="5" height="4" />
        </svg>
      )
    case 'route':
      return (
        <svg {...common}>
          <path d="M4 16c4-8 8 4 12-4 2-4 4-2 4-2" />
          <circle cx="4" cy="16" r="1.5" fill="currentColor" />
          <circle cx="20" cy="10" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'place':
      return (
        <svg {...common}>
          <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      )
    case 'puzzle':
      return (
        <svg {...common}>
          <path d="M4 8h5v3a2 2 0 1 0 0 2v3H4V8Zm5 0h6v3a2 2 0 1 1 0 2v3H9V8Zm6 0h5v11h-5v-3a2 2 0 1 0 0-2V8Z" />
        </svg>
      )
    case 'daynight':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" opacity="0.35" />
        </svg>
      )
    case 'split':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7 5l10 14" />
        </svg>
      )
  }
}
