import { lazy, Suspense, useEffect, useState } from 'react'
import { HomeScreen } from './HomeScreen'
import SinglePlayerApp from './SinglePlayerApp'
import { parseJoinHash } from './multiplayer/types'
import './App.css'

const MultiplayerApp = lazy(() =>
  import('./multiplayer/MultiplayerApp').then((m) => ({ default: m.MultiplayerApp })),
)

type Screen =
  | { kind: 'home' }
  | { kind: 'single' }
  | { kind: 'multi'; role: 'host' | 'guest'; code?: string }

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    // Frischer Reload: immer Startseite — Join-Hash nur als Hinweis, nicht auto-starten
    return { kind: 'home' }
  })
  const [detectedJoin, setDetectedJoin] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => {
      setDetectedJoin(parseJoinHash(window.location.hash))
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const goHome = () => {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    setDetectedJoin(null)
    setScreen({ kind: 'home' })
  }

  if (screen.kind === 'single') {
    return <SinglePlayerApp onExit={goHome} />
  }

  if (screen.kind === 'multi') {
    return (
      <Suspense fallback={<div className="home"><p className="home-lead">…</p></div>}>
        <MultiplayerApp
          role={screen.role}
          initialCode={screen.code}
          onExit={goHome}
        />
      </Suspense>
    )
  }

  return (
    <HomeScreen
      joinCode={detectedJoin}
      onSingle={() => setScreen({ kind: 'single' })}
      onMulti={() => setScreen({ kind: 'multi', role: 'host' })}
      onJoinWithCode={(code) => {
        window.location.hash = `#/m/${code}`
        setScreen({ kind: 'multi', role: 'guest', code })
      }}
    />
  )
}
