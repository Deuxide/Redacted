import type { WordGroup, WordSet } from '../types/game';
import { MIN_WORDS_PER_GROUP, uniqueWords } from '../types/game';
import { createId } from './ids';

export const WORD_SET_VERSION = 1;
const MAX_GROUPS = 80;
const MAX_WORDS = 12;
const MAX_WORD_LENGTH = 32;
const MAX_NAME_LENGTH = 40;

export interface WordSetFile {
  version: 1;
  id: string;
  name: string;
  description: string;
  groups: Array<{ id: string; label?: string; words: string[] }>;
}

export interface ImportSuccess {
  ok: true;
  sets: WordSet[];
  warnings: string[];
}

export interface ImportFailure {
  ok: false;
  errors: string[];
}

export type ImportResult = ImportSuccess | ImportFailure;

export function toWordSetFile(set: WordSet): WordSetFile {
  return {
    version: WORD_SET_VERSION,
    id: set.id,
    name: set.name,
    description: set.description,
    groups: set.groups
      .map((group) => ({
        id: group.id,
        label: group.label?.trim() || undefined,
        words: uniqueWords(group.words).slice(0, MAX_WORDS),
      }))
      .filter((group) => group.words.length >= MIN_WORDS_PER_GROUP),
  };
}

export function parseWordSetJson(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ['That file is not valid JSON.'] };
  }
  return importUnknown(parsed);
}

export function importUnknown(parsed: unknown): ImportResult {
  const warnings: string[] = [];
  if (Array.isArray(parsed)) {
    return collectSets(parsed, warnings, 'Item');
  }
  if (!isRecord(parsed)) {
    return { ok: false, errors: ['JSON must be a word set object, a list of word sets, or a word map.'] };
  }
  if (Array.isArray(parsed.sets)) {
    return collectSets(parsed.sets, warnings, 'Set');
  }
  if (isShorthand(parsed)) {
    const shorthand = shorthandToSet(parsed, warnings);
    return shorthand.groups.length
      ? { ok: true, sets: [shorthand], warnings }
      : { ok: false, errors: ['The word map needs at least one group with 2 different words.'] };
  }
  const set = readSet(parsed, warnings, 'Word set');
  if (!set.ok) return set;
  return { ok: true, sets: [set.set], warnings };
}

function collectSets(items: unknown[], warnings: string[], label: string): ImportResult {
  if (items.length === 0) return { ok: false, errors: ['The file does not contain any word sets.'] };
  const sets: WordSet[] = [];
  const errors: string[] = [];
  items.forEach((item, index) => {
    const result = readSet(item, warnings, `${label} ${index + 1}`);
    if (result.ok) sets.push(result.set);
    else errors.push(...result.errors);
  });
  if (!sets.length) return { ok: false, errors };
  return { ok: true, sets, warnings: [...warnings, ...errors.map((error) => `Skipped: ${error}`)] };
}

function readSet(value: unknown, warnings: string[], label: string): { ok: true; set: WordSet } | ImportFailure {
  if (!isRecord(value)) return { ok: false, errors: [`${label} must be an object with a name and groups.`] };
  if (!Array.isArray(value.groups)) {
    return { ok: false, errors: [`${label} needs a "groups" array.`] };
  }
  const name = typeof value.name === 'string' ? value.name.trim().slice(0, MAX_NAME_LENGTH) : '';
  if (!name) return { ok: false, errors: [`${label} needs a non-empty "name".`] };
  const description = typeof value.description === 'string' ? value.description.trim().slice(0, 120) : '';
  const requestedId = typeof value.id === 'string' && value.id.trim() ? value.id.trim().slice(0, 60) : createId('set');
  const groups: WordGroup[] = [];
  value.groups.slice(0, MAX_GROUPS).forEach((group, index) => {
    const read = readGroup(group, `${label} group ${index + 1}`, warnings);
    if (read) groups.push(read);
  });
  if (value.groups.length > MAX_GROUPS) warnings.push(`${label} kept the first ${MAX_GROUPS} groups.`);
  if (!groups.length) {
    return { ok: false, errors: [`${label} has no group with at least ${MIN_WORDS_PER_GROUP} different words.`] };
  }
  return {
    ok: true,
    set: { id: requestedId, name, description, groups, builtin: false },
  };
}

function readGroup(value: unknown, label: string, warnings: string[]): WordGroup | null {
  if (!isRecord(value) || !Array.isArray(value.words)) {
    warnings.push(`${label} was skipped because it has no "words" array.`);
    return null;
  }
  const rawWords = value.words.filter((word): word is string => typeof word === 'string');
  if (rawWords.length !== value.words.length) warnings.push(`${label} ignored values that were not text.`);
  const words = uniqueWords(rawWords.map((word) => word.slice(0, MAX_WORD_LENGTH))).slice(0, MAX_WORDS);
  if (words.length < rawWords.length) warnings.push(`${label} ignored empty or repeated words.`);
  if (words.length < MIN_WORDS_PER_GROUP) {
    warnings.push(`${label} was skipped because it needs at least ${MIN_WORDS_PER_GROUP} different words.`);
    return null;
  }
  const id = typeof value.id === 'string' && value.id.trim() ? value.id.trim().slice(0, 60) : createId('group');
  const labelText = typeof value.label === 'string' ? value.label.trim().slice(0, 40) : '';
  return { id, label: labelText || undefined, words };
}

function shorthandToSet(value: Record<string, unknown>, warnings: string[]): WordSet {
  const groups: WordGroup[] = [];
  for (const [key, words] of Object.entries(value)) {
    if (!Array.isArray(words)) continue;
    const group = readGroup({ id: createId('group'), label: key, words }, `Group "${key}"`, warnings);
    if (group) groups.push(group);
  }
  return {
    id: createId('set'),
    name: 'Imported words',
    description: 'Imported from a word map.',
    groups,
    builtin: false,
  };
}

function isShorthand(value: Record<string, unknown>): boolean {
  const entries = Object.entries(value);
  if (!entries.length || 'groups' in value || 'sets' in value) return false;
  return entries.every(([, entry]) => Array.isArray(entry) && entry.every((word) => typeof word === 'string'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
