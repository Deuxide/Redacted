import type { WordSet } from '../types/game';

export const BUILTIN_SET_ID = 'builtin-starter';

export const BUILTIN_WORD_SET: WordSet = {
  id: BUILTIN_SET_ID,
  name: 'Starter Pack',
  description: 'Related words for a first game. Duplicate this set to edit it.',
  builtin: true,
  groups: [
    { id: 'fruit', label: 'Fruit', words: ['Apple', 'Orange', 'Banana'] },
    { id: 'pets', label: 'Pets', words: ['Cat', 'Dog'] },
    { id: 'water', label: 'Water', words: ['Ocean', 'River'] },
    { id: 'meals', label: 'Meals', words: ['Pizza', 'Burger'] },
    { id: 'rides', label: 'Rides', words: ['Bus', 'Train'] },
    { id: 'seasons', label: 'Seasons', words: ['Summer', 'Winter'] },
    { id: 'drinks', label: 'Drinks', words: ['Coffee', 'Tea'] },
    { id: 'sports', label: 'Sports', words: ['Soccer', 'Basketball'] },
    { id: 'school', label: 'School', words: ['Pencil', 'Pen', 'Marker'] },
    { id: 'outdoors', label: 'Outdoors', words: ['Mountain', 'Hill'] },
  ],
};

export function cloneBuiltinSet(): WordSet {
  return {
    ...BUILTIN_WORD_SET,
    groups: BUILTIN_WORD_SET.groups.map((group) => ({ ...group, words: [...group.words] })),
  };
}
