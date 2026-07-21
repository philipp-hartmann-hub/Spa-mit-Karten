export const MP_MAX_PLAYERS = 8
export const MP_MIN_ROUNDS = 3
export const MP_MAX_ROUNDS = 30
export const MP_DEFAULT_ROUNDS = 10

export type MpPlayer = {
  id: string
  name: string
  isHost: boolean
}

export type MpRaceQuestion =
  | { kind: 'country'; targetId: string }
  | { kind: 'capital'; targetId: string }
  | { kind: 'flag'; targetId: string }
  | { kind: 'region'; countryId: string; regionId: string; quiz: 'name' | 'capital' | 'flag' }
  | { kind: 'city'; countryId: string; cityId: string }

export type MpBlitzQuestion = {
  letter: string
  color: string
}

export type MpGameConfig = {
  mode: 'country' | 'capital' | 'flag' | 'regions' | 'cities' | 'blitz'
  continent: string
  regionCountryId?: string
  regionQuiz?: 'name' | 'capital' | 'flag'
  rounds: number
  locale: string
}

export type MpRaceProgress = {
  playerId: string
  index: number
  finishedAt: number | null
}

export type MpBlitzRoundAnswers = Record<
  string,
  { country?: string; capital?: string; flag?: string }
>

export type MpRankingEntry = {
  playerId: string
  name: string
  /** Race: milliseconds; Blitz: points */
  value: number
  detail?: string
}

export type ClientToHost =
  | { type: 'join'; playerId: string; name: string }
  | { type: 'set-name'; playerId: string; name: string }
  | { type: 'race-progress'; playerId: string; index: number; finishedAt: number | null }
  | {
      type: 'blitz-submit'
      playerId: string
      roundIndex: number
      answers: { country: string | null; capital: string | null; flag: string | null }
    }
  | { type: 'ping' }

export type HostToClient =
  | { type: 'welcome'; you: MpPlayer; players: MpPlayer[]; config: MpGameConfig | null }
  | { type: 'roster'; players: MpPlayer[] }
  | { type: 'config'; config: MpGameConfig }
  | { type: 'room-full' }
  | { type: 'kicked'; reason: string }
  | {
      type: 'race-start'
      questions: MpRaceQuestion[]
      startedAt: number
      config: MpGameConfig
    }
  | {
      type: 'race-update'
      progress: MpRaceProgress[]
    }
  | {
      type: 'blitz-start'
      questions: MpBlitzQuestion[]
      config: MpGameConfig
      roundIndex: number
      roundEndsAt: number
    }
  | {
      type: 'blitz-next'
      roundIndex: number
      roundEndsAt: number
      scores: Record<string, number>
      lastRoundPoints: Record<string, number>
    }
  | {
      type: 'results'
      kind: 'race' | 'blitz'
      ranking: MpRankingEntry[]
      scores?: Record<string, number>
    }
  | { type: 'back-lobby' }

export function createRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function createPlayerId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}`
}

export function joinUrl(roomCode: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/m/${roomCode}`
}

export function parseJoinHash(hash: string): string | null {
  const m = hash.match(/^#\/m\/([A-Za-z0-9]{4,8})$/)
  return m?.[1]?.toUpperCase() ?? null
}
