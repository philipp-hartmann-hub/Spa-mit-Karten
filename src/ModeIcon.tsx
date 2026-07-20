import type { GameMode } from './gameModes'

type Props = { id: GameMode; className?: string }

/** Einfache Linien-Icons für die Orbit-Moduskreise */
export function ModeIcon({ id, className }: Props) {
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
    case 'country':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.8 2.5 15.2 0 18M12 3c-2.5 2.8-2.5 15.2 0 18" />
        </svg>
      )
    case 'capital':
      return (
        <svg {...common}>
          <path d="M12 3.5 14.2 9h5.8l-4.7 3.4 1.8 5.6L12 14.8 7 18l1.8-5.6L4 9h5.8L12 3.5Z" />
        </svg>
      )
    case 'flag':
      return (
        <svg {...common}>
          <path d="M6 21V4.5" />
          <path d="M6 5h9.5c.8 0 1.3.9.9 1.5L15 9.5l1.4 2.5c.4.7-.1 1.5-.9 1.5H6" />
        </svg>
      )
    case 'regions':
      return (
        <svg {...common}>
          <path d="M4 7.5 12 3.5l8 4v9l-8 4-8-4v-9Z" />
          <path d="M12 3.5v16M4 7.5l8 4.5 8-4.5" />
        </svg>
      )
    case 'cities':
      return (
        <svg {...common}>
          <path d="M4 20V9l4-2v13M8 20V7l4 2v11M12 20V9l4-3v14M16 20V6l4 2v12" />
          <path d="M3 20h18" />
        </svg>
      )
  }
}
