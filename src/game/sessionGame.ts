import type { ActiveGame, AppScreen, Role, TieBehavior } from '../types/game';
import { maxSuspects } from '../types/game';

const SESSION_KEY = 'undercover.activeGame.v1';

export function screenForPhase(phase: ActiveGame['phase']): AppScreen {
  if (phase === 'discussion') return 'discussion';
  if (phase === 'voting') return 'voting';
  if (phase === 'results') return 'results';
  return 'reveal';
}

export function loadSessionGame(): ActiveGame | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const game = sanitizeGame(parsed);
    if (!game) sessionStorage.removeItem(SESSION_KEY);
    return game;
  } catch {
    return null;
  }
}

export function saveSessionGame(game: ActiveGame): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(game));
  } catch {
    // A full session store should not reveal words in the page.
  }
}

export function clearSessionGame(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function sanitizeGame(value: unknown): ActiveGame | null {
  if (!isRecord(value) || !Array.isArray(value.players) || value.players.length < 3) return null;
  const players = value.players.flatMap((player) => {
    if (!isRecord(player)) return [];
    const role: Role | null = player.role === 'undercover' || player.role === 'civilian' ? player.role : null;
    if (!role || typeof player.id !== 'string' || typeof player.name !== 'string' || typeof player.word !== 'string') return [];
    return [{ id: player.id, name: player.name, role, word: player.word, hasSeenWord: player.hasSeenWord === true }];
  });
  if (players.length !== value.players.length) return null;
  const phase = value.phase === 'discussion' || value.phase === 'voting' || value.phase === 'results' ? value.phase : 'reveal';
  const undercoverCount = players.filter((player) => player.role === 'undercover').length || 1;
  const suspectsPerVote = Math.min(
    maxSuspects(undercoverCount, players.length),
    Math.max(1, typeof value.suspectsPerVote === 'number' ? Math.round(value.suspectsPerVote) : 1),
  );
  const tieBehavior: TieBehavior = value.tieBehavior === 'revote' ? 'revote' : 'eliminate-none';
  const votes: Record<string, string[]> = {};
  if (isRecord(value.votes)) {
    for (const player of players) {
      const choice = value.votes[player.id];
      const picked = Array.isArray(choice) ? choice : typeof choice === 'string' ? [choice] : [];
      const valid = [...new Set(picked.filter((id) => typeof id === 'string' && id !== player.id && players.some((candidate) => candidate.id === id)))];
      if (valid.length) votes[player.id] = valid.slice(0, suspectsPerVote);
    }
  }
  const votedCount = players.filter((player) => votes[player.id]).length;
  const voteIndex = Math.min(votedCount, players.length - 1);
  return {
    id: typeof value.id === 'string' ? value.id : 'restored-game',
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : new Date().toISOString(),
    wordSetId: typeof value.wordSetId === 'string' ? value.wordSetId : '',
    wordSetName: typeof value.wordSetName === 'string' ? value.wordSetName : 'Word set',
    civilianWord: typeof value.civilianWord === 'string' ? value.civilianWord : '',
    undercoverWord: typeof value.undercoverWord === 'string' ? value.undercoverWord : '',
    players,
    revealIndex: clampIndex(value.revealIndex, players.length),
    voteIndex,
    suspectsPerVote,
    tieBehavior,
    votes,
    phase: phase === 'results' && votedCount < players.length ? 'voting' : phase,
  };
}

function clampIndex(value: unknown, length: number): number {
  const index = typeof value === 'number' ? Math.floor(value) : 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
