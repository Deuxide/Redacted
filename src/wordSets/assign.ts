import type { WordSet } from '../types/game';
import { playableGroups, uniqueWords } from '../types/game';

export interface SecretWords {
  groupId: string;
  civilianWord: string;
  undercoverWord: string;
}

export function pickSecretWords(set: WordSet): SecretWords | null {
  const groups = playableGroups(set);
  if (!groups.length) return null;
  const group = groups[randomBelow(groups.length)];
  const words = shuffle(uniqueWords(group.words));
  return {
    groupId: group.id,
    civilianWord: words[0],
    undercoverWord: words[1],
  };
}

function randomBelow(limit: number): number {
  if (limit <= 1) return 0;
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % limit;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomBelow(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
