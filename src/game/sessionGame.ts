import type { ActiveGame, AppScreen, Role, TieBehavior } from '../types/game';
import { maxSuspects } from '../types/game';

const SESSION_KEY = 'undercover.activeGame.v1';

export function screenForPhase(phase: ActiveGame['phase']): AppScreen {
  if (phase === 'discussion') return 'discussion';
  if (phase === 'voting') return 'voting';
  if (phase === 'elimination') return 'elimination';
  if (phase === 'guess') return 'guess';
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
    const role: Role | null =
      player.role === 'undercover' || player.role === 'civilian' || player.role === 'doesntKnow' ? player.role : null;
    if (!role || typeof player.id !== 'string' || typeof player.name !== 'string' || typeof player.word !== 'string') return [];
    if (role !== 'doesntKnow' && !player.word) return [];
    const guess: 'pending' | 'correct' | 'incorrect' | undefined = player.doesntKnowGuess === 'pending' || player.doesntKnowGuess === 'correct' || player.doesntKnowGuess === 'incorrect' ? player.doesntKnowGuess : undefined;
    return [{ id: player.id, name: player.name, role, word: role === 'doesntKnow' ? '' : player.word, hasSeenWord: player.hasSeenWord === true, eliminated: player.eliminated === true, doesntKnowGuess: guess, individualWins: typeof player.individualWins === 'number' ? player.individualWins : guess === 'correct' ? 1 : 0 }];
  });
  if (players.length !== value.players.length) return null;
  const phase = value.phase === 'discussion' || value.phase === 'voting' || value.phase === 'elimination' || value.phase === 'guess' || value.phase === 'results' ? value.phase : 'reveal';
  const specialCount = players.filter((player) => player.role !== 'civilian').length || 1;
  const suspectsPerVote = Math.min(
    maxSuspects(specialCount, players.length),
    Math.max(1, typeof value.suspectsPerVote === 'number' ? Math.round(value.suspectsPerVote) : 1),
  );
  const tieBehavior: TieBehavior = value.tieBehavior === 'revote' ? 'revote' : 'eliminate-none';
  const votes: Record<string, string[]> = {};
  if (isRecord(value.votes)) {
    for (const player of players) {
      const choice = value.votes[player.id];
      const picked = Array.isArray(choice) ? choice : typeof choice === 'string' ? [choice] : [];
      const valid = [...new Set(picked.filter((id) => id === 'skip' || (typeof id === 'string' && id !== player.id && players.some((candidate) => candidate.id === id && !candidate.eliminated))))];
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
    playerOrder: (() => {
      const saved = Array.isArray(value.playerOrder) ? value.playerOrder.filter((id): id is string => typeof id === 'string' && players.some((player) => player.id === id)) : [];
      return saved.length === players.length ? saved : players.map((player) => player.id);
    })(),
    revealIndex: clampIndex(value.revealIndex, players.length),
    voteIndex,
    suspectsPerVote,
    tieBehavior,
    showRoleDuringReveal: value.showRoleDuringReveal !== false,
    votes,
    round: typeof value.round === 'number' && value.round > 0 ? Math.round(value.round) : 1,
    eliminations: Array.isArray(value.eliminations)
      ? value.eliminations.flatMap((item) => (isRecord(item) && typeof item.playerId === 'string' ? [{ playerId: item.playerId, round: typeof item.round === 'number' ? item.round : 1 }] : []))
      : [],
    voteHistory: Array.isArray(value.voteHistory) ? value.voteHistory.flatMap((item) => (isRecord(item) && isRecord(item.counts) ? [{ round: typeof item.round === 'number' ? item.round : 1, votes: {}, counts: item.counts as Record<string, number>, wasTie: item.wasTie === true, skipped: item.skipped === true, eliminatedPlayerId: typeof item.eliminatedPlayerId === 'string' ? item.eliminatedPlayerId : undefined }] : [])) : [],
    pointsAwarded: value.pointsAwarded === true,
    phase: phase === 'results' && votedCount < players.filter((player) => !player.eliminated).length && players.some((player) => !player.eliminated) ? 'voting' : phase,
  };
}

function clampIndex(value: unknown, length: number): number {
  const index = typeof value === 'number' ? Math.floor(value) : 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
