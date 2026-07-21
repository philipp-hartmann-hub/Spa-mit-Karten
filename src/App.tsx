import { useEffect, useState } from 'react'
import { HomeScreen } from './HomeScreen'
import SinglePlayerApp from './SinglePlayerApp'
import { MultiplayerApp } from './multiplayer/MultiplayerApp'
import { parseJoinHash } from './multiplayer/types'
import './App.css'

type Screen =
  | { kind: 'home' }
  | { kind: 'single' }
  | { kind: 'multi'; role: 'host' | 'guest'; code?: string }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'home' })
  const [detectedJoin, setDetectedJoin] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => {
      const code = parseJoinHash(window.location.hash)
      setDetectedJoin(code)
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  if (screen.kind === 'single') {
    return (
      <SinglePlayerApp
        onExit={() => {
          window.location.hash = ''
          setScreen({ kind: 'home' })
        }}
      />
    )
  }

  if (screen.kind === 'multi') {
    return (
      <MultiplayerApp
        role={screen.role}
        initialCode={screen.code}
        onExit={() => {
          window.location.hash = ''
          setScreen({ kind: 'home' })
        }}
      />
    )
  }

  return (
    <HomeScreen
      joinCode={detectedJoin}
      onSingle={() => setScreen({ kind: 'single' })}
      onMulti={() => {
        const code = undefined
        setScreen({ kind: 'multi', role: 'host', code })
      }}
      onJoinWithCode={(code) => {
        window.location.hash = `#/m/${code}`
        setScreen({ kind: 'multi', role: 'guest', code })
      }}
    />
  )
}
