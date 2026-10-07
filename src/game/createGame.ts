import type { ActiveGame, SetupDraft, WordSet } from '../types/game';
import { clampSuspects, balanceRoles, displayName } from './draft';
import { pickSecretWords, shuffle } from '../wordSets/assign';

export function createActiveGame(draft: SetupDraft, wordSet: WordSet): ActiveGame | null {
  const secret = pickSecretWords(wordSet);
  if (!secret) return null;
  const roles = balanceRoles(draft.players.length, draft.undercoverCount, draft.doesntKnowCount);
  const order = shuffle(draft.players.map((_, index) => index));
  const undercoverSlots = new Set(order.slice(0, roles.undercoverCount));
  const doesntKnowSlots = new Set(order.slice(roles.undercoverCount, roles.undercoverCount + roles.doesntKnowCount));

  return {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    wordSetId: wordSet.id,
    wordSetName: wordSet.name,
    civilianWord: secret.civilianWord,
    undercoverWord: secret.undercoverWord,
    revealIndex: 0,
    voteIndex: 0,
    suspectsPerVote: clampSuspects(draft.suspectsPerVote, roles.undercoverCount + roles.doesntKnowCount, draft.players.length),
    tieBehavior: draft.tieBehavior,
    showRoleDuringReveal: draft.showRoleDuringReveal !== false,
    votes: {},
    round: 1,
    eliminations: [],
    voteHistory: [],
    pointsAwarded: false,
    phase: 'reveal',
    players: draft.players.map((player, index) => {
      const role = undercoverSlots.has(index) ? 'undercover' : doesntKnowSlots.has(index) ? 'doesntKnow' : 'civilian';
      return {
        id: player.id,
        name: displayName(player.name, index),
        role,
        word: role === 'undercover' ? secret.undercoverWord : role === 'civilian' ? secret.civilianWord : '',
        hasSeenWord: false,
        eliminated: false,
        individualWins: 0,
      };
    }),
    playerOrder: shuffle(draft.players.map((player) => player.id)),
  };
}
