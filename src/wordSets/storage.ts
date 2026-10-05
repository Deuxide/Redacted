import type { WordSet } from '../types/game';
import { playableGroups, uniqueWords } from '../types/game';
import { BUILTIN_SET_ID } from '../data/builtinWordSets';
import { createId } from './ids';
import { importUnknown, type WordSetFile } from './validate';

const LIBRARY_KEY = 'undercover.wordLibrary.v1';

interface StoredLibrary {
  version: 1;
  sets: WordSet[];
}

export function loadCustomSets(): WordSet[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<StoredLibrary>;
    if (!Array.isArray(parsed.sets)) return [];
    return parsed.sets.flatMap((set) => normalizeStoredSet(set));
  } catch {
    return [];
  }
}

export function saveCustomSets(sets: WordSet[]): void {
  try {
    const payload: StoredLibrary = {
      version: 1,
      sets: sets.filter((set) => !set.builtin).map(stripBuiltin),
    };
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(payload));
  } catch {
    // Keep the in-memory edit even if storage is unavailable.
  }
}

export function downloadWordSet(set: WordSet): { ok: true } | { ok: false; error: string } {
  const file: WordSetFile = {
    version: 1,
    id: set.builtin ? createId('set') : set.id,
    name: set.name,
    description: set.description,
    groups: playableGroups(set).map((group) => ({
      id: group.id,
      label: group.label,
      words: uniqueWords(group.words),
    })),
  };
  if (!file.groups.length) {
    return { ok: false, error: 'exportNeedsWords' };
  }
  const blob = new Blob([`${JSON.stringify(file, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${file.name.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-') || 'word-set'}.json`;
  link.click();
  URL.revokeObjectURL(url);
  return { ok: true };
}

function normalizeStoredSet(value: unknown): WordSet[] {
  const imported = importUnknown(value);
  if (!imported.ok) return [];
  return imported.sets.map((set) => ({
    ...set,
    id: set.id === BUILTIN_SET_ID ? createId('set') : set.id,
    builtin: false,
  }));
}

function stripBuiltin(set: WordSet): WordSet {
  return { ...set, builtin: false, groups: set.groups.map((group) => ({ ...group, words: [...group.words] })) };
}
