import type { ActiveGame, SetupDraft, WordSet } from '../types/game';
import { clampSuspects, clampUndercoverCount, displayName } from './draft';
import { pickSecretWords, shuffle } from '../wordSets/assign';

export function createActiveGame(draft: SetupDraft, wordSet: WordSet): ActiveGame | null {
  const secret = pickSecretWords(wordSet);
  if (!secret) return null;
  const undercoverCount = clampUndercoverCount(draft.undercoverCount, draft.players.length);
  const undercoverSlots = new Set(shuffle(draft.players.map((_, index) => index)).slice(0, undercoverCount));

  return {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    wordSetId: wordSet.id,
    wordSetName: wordSet.name,
    civilianWord: secret.civilianWord,
    undercoverWord: secret.undercoverWord,
    revealIndex: 0,
    voteIndex: 0,
    suspectsPerVote: clampSuspects(draft.suspectsPerVote, undercoverCount, draft.players.length),
    tieBehavior: draft.tieBehavior,
    votes: {},
    phase: 'reveal',
    players: draft.players.map((player, index) => {
      const isUndercover = undercoverSlots.has(index);
      return {
        id: player.id,
        name: displayName(player.name, index),
        role: isUndercover ? 'undercover' : 'civilian',
        word: isUndercover ? secret.undercoverWord : secret.civilianWord,
        hasSeenWord: false,
      };
    }),
  };
}
