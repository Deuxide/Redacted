import type { SetupDraft, TieBehavior } from '../types/game';
import { MAX_PLAYERS, MIN_PLAYERS, MIN_UNDERCOVER, maxSuspects, maxUndercover } from '../types/game';
import { BUILTIN_SET_ID } from '../data/builtinWordSets';
import { createId } from '../wordSets/ids';

const DRAFT_KEY = 'undercover.setupDraft.v1';

export function createPlayerId(): string {
  return createId('player');
}

export function createDefaultDraft(): SetupDraft {
  const playerCount = 4;
  return {
    playerCount,
    undercoverCount: 1,
    suspectsPerVote: 1,
    tieBehavior: 'eliminate-none',
    wordSetId: BUILTIN_SET_ID,
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: createPlayerId(),
      name: `Player ${index + 1}`,
    })),
  };
}

export function clampPlayerCount(value: number): number {
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(value)));
}

export function clampUndercoverCount(value: number, playerCount: number): number {
  return Math.min(maxUndercover(playerCount), Math.max(MIN_UNDERCOVER, Math.round(value)));
}

export function clampSuspects(value: number, undercoverCount: number, playerCount: number): number {
  return Math.min(maxSuspects(undercoverCount, playerCount), Math.max(1, Math.round(value)));
}

export function addPlayer(draft: SetupDraft): SetupDraft {
  if (draft.players.length >= MAX_PLAYERS) return draft;
  const next = [
    ...draft.players,
    { id: createPlayerId(), name: `Player ${draft.players.length + 1}` },
  ];
  return resizePlayers({ ...draft, players: next }, next.length);
}

export function removePlayer(draft: SetupDraft, playerId: string): SetupDraft {
  if (draft.players.length <= MIN_PLAYERS) return draft;
  const next = draft.players.filter((player) => player.id !== playerId);
  if (next.length === draft.players.length) return draft;
  return resizePlayers({ ...draft, players: next }, next.length);
}

export function displayName(name: string, index: number): string {
  const trimmed = name.trim();
  return trimmed || `Player ${index + 1}`;
}

export function resizePlayers(draft: SetupDraft, nextCount: number): SetupDraft {
  const playerCount = clampPlayerCount(nextCount);
  const players = draft.players.slice(0, playerCount);
  while (players.length < playerCount) {
    const index = players.length;
    players.push({ id: createPlayerId(), name: `Player ${index + 1}` });
  }
  const undercoverCount = clampUndercoverCount(draft.undercoverCount, playerCount);
  return {
    ...draft,
    playerCount,
    undercoverCount,
    suspectsPerVote: clampSuspects(draft.suspectsPerVote, undercoverCount, playerCount),
    players,
  };
}

export function loadDraft(): SetupDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return createDefaultDraft();
    const parsed = JSON.parse(raw) as Partial<SetupDraft>;
    const base = createDefaultDraft();
    const playerCount = clampPlayerCount(parsed.playerCount ?? base.playerCount);
    const incoming = Array.isArray(parsed.players) ? parsed.players : [];
    const players = Array.from({ length: playerCount }, (_, index) => {
      const item = incoming[index];
      const name = typeof item?.name === 'string' && item.name.trim() ? item.name : `Player ${index + 1}`;
      const id = typeof item?.id === 'string' && item.id ? item.id : createPlayerId();
      return { id, name };
    });
    const wordSetId = typeof parsed.wordSetId === 'string' && parsed.wordSetId.trim()
      ? parsed.wordSetId
      : base.wordSetId;
    const undercoverCount = clampUndercoverCount(parsed.undercoverCount ?? 1, playerCount);
    const tieBehavior: TieBehavior = parsed.tieBehavior === 'revote' ? 'revote' : 'eliminate-none';
    return {
      playerCount,
      undercoverCount,
      suspectsPerVote: clampSuspects(parsed.suspectsPerVote ?? 1, undercoverCount, playerCount),
      tieBehavior,
      wordSetId,
      players,
    };
  } catch {
    return createDefaultDraft();
  }
}

export function saveDraft(draft: SetupDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private mode or full storage should not block the game.
  }
}
