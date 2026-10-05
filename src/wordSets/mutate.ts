import type { WordSet } from '../types/game';
import { uniqueWords } from '../types/game';
import { createId } from './ids';

export function blankSet(): WordSet {
  return {
    id: createId('set'),
    name: 'My word set',
    description: '',
    builtin: false,
    groups: [blankGroup()],
  };
}

export function blankGroup() {
  return { id: createId('group'), label: '', words: ['', ''] };
}

export function duplicateSet(set: WordSet): WordSet {
  return {
    id: createId('set'),
    name: `${set.name} copy`.slice(0, 40),
    description: set.description,
    builtin: false,
    groups: set.groups.map((group) => ({
      id: createId('group'),
      label: group.label,
      words: [...group.words],
    })),
  };
}

export function cleanSetForPlay(set: WordSet): WordSet {
  return {
    ...set,
    groups: set.groups.map((group) => ({ ...group, words: uniqueWords(group.words) })),
  };
}
