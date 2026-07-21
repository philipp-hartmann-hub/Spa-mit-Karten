import { useCallback, useEffect, useRef, useState } from 'react'
import { Peer, type DataConnection } from 'peerjs'
import {
  createPlayerId,
  MP_MAX_PLAYERS,
  type ClientToHost,
  type HostToClient,
  type MpGameConfig,
  type MpPlayer,
} from './types'

type Role = 'host' | 'guest'

type RoomState = {
  connected: boolean
  error: string | null
  players: MpPlayer[]
  config: MpGameConfig | null
  you: MpPlayer | null
  lastHostMessage: HostToClient | null
}

function peerIdForRoom(code: string) {
  return `smk-${code.toLowerCase()}`
}

export function useMultiplayerRoom(opts: {
  role: Role
  roomCode: string
  displayName: string
  enabled: boolean
}) {
  const { role, roomCode, displayName, enabled } = opts
  const [state, setState] = useState<RoomState>({
    connected: false,
    error: null,
    players: [],
    config: null,
    you: null,
    lastHostMessage: null,
  })

  const peerRef = useRef<Peer | null>(null)
  const connsRef = useRef<Map<string, DataConnection>>(new Map())
  const hostConnRef = useRef<DataConnection | null>(null)
  const playersRef = useRef<MpPlayer[]>([])
  const selfIdRef = useRef(createPlayerId())
  const nameRef = useRef(displayName)

  useEffect(() => {
    nameRef.current = displayName
  }, [displayName])

  const setPlayers = useCallback((players: MpPlayer[]) => {
    playersRef.current = players
    setState((s) => ({ ...s, players }))
  }, [])

  const broadcast = useCallback((msg: HostToClient) => {
    for (const conn of connsRef.current.values()) {
      if (conn.open) conn.send(msg)
    }
  }, [])

  const sendToHost = useCallback((msg: ClientToHost) => {
    const conn = hostConnRef.current
    if (conn?.open) conn.send(msg)
  }, [])

  const hostSendWelcome = useCallback(
    (conn: DataConnection, players: MpPlayer[], config: MpGameConfig | null) => {
      const you = players.find((p) => p.id === conn.metadata?.playerId) ?? null
      if (!you) return
      const msg: HostToClient = { type: 'welcome', you, players, config }
      conn.send(msg)
    },
    [],
  )

  useEffect(() => {
    if (!enabled || !roomCode) return

    let cancelled = false
    const selfId = selfIdRef.current
    const isHost = role === 'host'

    const peer = isHost
      ? new Peer(peerIdForRoom(roomCode), { debug: 0 })
      : new Peer({ debug: 0 })

    peerRef.current = peer

    peer.on('error', (err) => {
      if (cancelled) return
      const message = err?.type === 'unavailable-id' ? 'room-taken' : err.message
      setState((s) => ({ ...s, error: message, connected: false }))
    })

    peer.on('open', () => {
      if (cancelled) return

      if (isHost) {
        const hostPlayer: MpPlayer = {
          id: selfId,
          name: nameRef.current || 'Host',
          isHost: true,
        }
        setPlayers([hostPlayer])
        setState((s) => ({
          ...s,
          connected: true,
          error: null,
          you: hostPlayer,
        }))

        peer.on('connection', (conn) => {
          conn.on('open', () => {
            const guestId = (conn.metadata?.playerId as string) || createPlayerId()
            if (playersRef.current.length >= MP_MAX_PLAYERS) {
              conn.send({ type: 'room-full' } satisfies HostToClient)
              conn.close()
              return
            }
            connsRef.current.set(guestId, conn)
            const name = (conn.metadata?.name as string) || 'Player'
            const next = [
              ...playersRef.current.filter((p) => p.id !== guestId),
              { id: guestId, name, isHost: false },
            ]
            setPlayers(next)
            hostSendWelcome(conn, next, null)
            broadcast({ type: 'roster', players: next })

            conn.on('data', (raw) => {
              const msg = raw as ClientToHost
              if (msg.type === 'set-name') {
                const updated = playersRef.current.map((p) =>
                  p.id === msg.playerId ? { ...p, name: msg.name.slice(0, 24) } : p,
                )
                setPlayers(updated)
                broadcast({ type: 'roster', players: updated })
              } else if (msg.type === 'join') {
                /* already handled via metadata */
              } else {
                setState((s) => ({
                  ...s,
                  lastHostMessage: { type: 'back-lobby', ...(msg as object) } as HostToClient,
                }))
                // Forward client events to React via custom event pattern
                window.dispatchEvent(
                  new CustomEvent('smk-mp-client', { detail: msg }),
                )
              }
            })

            conn.on('close', () => {
              connsRef.current.delete(guestId)
              const updated = playersRef.current.filter((p) => p.id !== guestId)
              setPlayers(updated)
              broadcast({ type: 'roster', players: updated })
            })
          })
        })
      } else {
        const conn = peer.connect(peerIdForRoom(roomCode), {
          reliable: true,
          metadata: { playerId: selfId, name: nameRef.current || 'Player' },
        })
        hostConnRef.current = conn

        conn.on('open', () => {
          if (cancelled) return
          setState((s) => ({ ...s, connected: true, error: null }))
          conn.send({
            type: 'join',
            playerId: selfId,
            name: nameRef.current || 'Player',
          } satisfies ClientToHost)
        })

        conn.on('data', (raw) => {
          const msg = raw as HostToClient
          if (msg.type === 'welcome') {
            setState((s) => ({
              ...s,
              you: msg.you,
              players: msg.players,
              config: msg.config,
            }))
            playersRef.current = msg.players
          } else if (msg.type === 'roster') {
            setPlayers(msg.players)
          } else if (msg.type === 'config') {
            setState((s) => ({ ...s, config: msg.config }))
          } else if (msg.type === 'room-full') {
            setState((s) => ({ ...s, error: 'room-full', connected: false }))
          } else if (msg.type === 'kicked') {
            setState((s) => ({ ...s, error: msg.reason, connected: false }))
          } else {
            setState((s) => ({ ...s, lastHostMessage: msg }))
            window.dispatchEvent(new CustomEvent('smk-mp-host', { detail: msg }))
          }
        })

        conn.on('close', () => {
          if (!cancelled) {
            setState((s) => ({ ...s, connected: false, error: 'disconnected' }))
          }
        })
      }
    })

    return () => {
      cancelled = true
      for (const c of connsRef.current.values()) c.close()
      connsRef.current.clear()
      hostConnRef.current?.close()
      hostConnRef.current = null
      peer.destroy()
      peerRef.current = null
    }
  }, [enabled, roomCode, role, broadcast, hostSendWelcome, setPlayers])

  const updateName = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 24) || 'Player'
      nameRef.current = trimmed
      if (role === 'host') {
        const updated = playersRef.current.map((p) =>
          p.id === selfIdRef.current ? { ...p, name: trimmed } : p,
        )
        setPlayers(updated)
        broadcast({ type: 'roster', players: updated })
        setState((s) =>
          s.you ? { ...s, you: { ...s.you, name: trimmed } } : s,
        )
      } else {
        sendToHost({ type: 'set-name', playerId: selfIdRef.current, name: trimmed })
        setState((s) =>
          s.you ? { ...s, you: { ...s.you, name: trimmed } } : s,
        )
      }
    },
    [broadcast, role, sendToHost, setPlayers],
  )

  const hostBroadcast = useCallback(
    (msg: HostToClient) => {
      if (role !== 'host') return
      broadcast(msg)
      setState((s) => ({ ...s, lastHostMessage: msg }))
      window.dispatchEvent(new CustomEvent('smk-mp-host', { detail: msg }))
    },
    [broadcast, role],
  )

  const guestSend = useCallback(
    (msg: ClientToHost) => {
      if (role === 'host') {
        window.dispatchEvent(new CustomEvent('smk-mp-client', { detail: msg }))
      } else {
        sendToHost(msg)
      }
    },
    [role, sendToHost],
  )

  return {
    ...state,
    playerId: selfIdRef.current,
    updateName,
    hostBroadcast,
    guestSend,
    isHost: role === 'host',
  }
}
