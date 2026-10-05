import type { ActiveGame } from '../types/game';
import { activePlayers, evaluateGameState } from './results';

export interface SessionPlayer {
  id: string;
  name: string;
  points: number;
  doesntKnowGuessWins: number;
}

export interface PointSession {
  startedAt: string;
  players: SessionPlayer[];
}

const SESSION_KEY = 'undercover.pointSession.v1';

export function emptySession(players: { id: string; name: string }[]): PointSession {
  return {
    startedAt: new Date().toISOString(),
    players: players.map((player) => ({ id: player.id, name: player.name, points: 0, doesntKnowGuessWins: 0 })),
  };
}

export function loadPointSession(): PointSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PointSession>;
    if (!Array.isArray(parsed.players)) return null;
    return {
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : new Date().toISOString(),
      players: parsed.players.flatMap((player) => {
        if (!player || typeof player.id !== 'string' || typeof player.name !== 'string') return [];
        return [{ id: player.id, name: player.name, points: typeof player.points === 'number' ? player.points : 0, doesntKnowGuessWins: typeof player.doesntKnowGuessWins === 'number' ? player.doesntKnowGuessWins : 0 }];
      }),
    };
  } catch {
    return null;
  }
}

export function savePointSession(session: PointSession | null): void {
  try {
    if (!session) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Scores still exist for this visit.
  }
}

export function roundPointsFor(game: ActiveGame): Record<string, number> {
  const result = evaluateGameState(game.players);
  const points: Record<string, number> = {};
  for (const player of game.players) points[player.id] = 0;
  if (result.status === 'civilianWin') {
    for (const player of game.players) if (player.role === 'civilian') points[player.id] = 1;
  } else if (result.status === 'undercoverWin') {
    for (const player of game.players) if (player.role === 'undercover') points[player.id] = 2;
  } else if (result.status === 'doesntKnowWin') {
    for (const player of activePlayers(game.players)) if (player.role === 'doesntKnow') points[player.id] = 2;
  }
  return points;
}

export function applyRoundPoints(session: PointSession, game: ActiveGame, earned: Record<string, number>): PointSession {
  return {
    ...session,
    players: session.players.map((player) => {
      const roundPlayer = game.players.find((entry) => entry.id === player.id);
      const guessWin = roundPlayer?.doesntKnowGuess === 'correct' ? 1 : 0;
      return { ...player, name: roundPlayer?.name ?? player.name, points: player.points + (earned[player.id] ?? 0), doesntKnowGuessWins: player.doesntKnowGuessWins + guessWin };
    }),
  };
}
