export interface QuestionGroupFile {
  id: string;
  civilianQuestion: string;
  undercoverQuestion: string;
}

import { QUESTION_GROUPS } from './questions';

export interface QuestionSet {
  id: string;
  name: string;
  builtin: boolean;
  groups: QuestionGroupFile[];
}

export const BUILTIN_QUESTION_SET: QuestionSet = {
  id: 'builtin-questions',
  name: 'Starter Questions',
  builtin: true,
  groups: QUESTION_GROUPS.map((group) => ({ id: group.id, civilianQuestion: group.civilian.en, undercoverQuestion: group.undercover.en })),
};

const KEY = 'undercover.questionSets.v1';

export function loadQuestionSets(): QuestionSet[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { sets?: unknown };
    return Array.isArray(parsed.sets) ? parsed.sets.flatMap((item) => (isSet(item) ? [item] : [])) : [];
  } catch {
    return [];
  }
}

export function saveQuestionSets(sets: QuestionSet[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, sets: sets.filter((set) => !set.builtin) }));
  } catch {
    // Sets still exist for this visit.
  }
}

export function parseQuestionSet(raw: string): { ok: true; set: QuestionSet } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as { name?: unknown; groups?: unknown };
    if (typeof parsed.name !== 'string' || !parsed.name.trim() || !Array.isArray(parsed.groups)) return { ok: false, error: 'badShape' };
    const ids = new Set<string>();
    const groups = parsed.groups.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const group = item as Partial<QuestionGroupFile>;
      if (typeof group.id !== 'string' || ids.has(group.id)) return [];
      if (typeof group.civilianQuestion !== 'string' || typeof group.undercoverQuestion !== 'string') return [];
      const civilian = group.civilianQuestion.trim();
      const undercover = group.undercoverQuestion.trim();
      if (!civilian || !undercover || civilian.toLocaleLowerCase() === undercover.toLocaleLowerCase()) return [];
      ids.add(group.id);
      return [{ id: group.id, civilianQuestion: civilian, undercoverQuestion: undercover }];
    });
    if (!groups.length) return { ok: false, error: 'badShape' };
    return { ok: true, set: { id: crypto.randomUUID(), name: parsed.name.trim().slice(0, 40), builtin: false, groups } };
  } catch {
    return { ok: false, error: 'invalidJson' };
  }
}

function isSet(value: unknown): value is QuestionSet {
  return Boolean(value && typeof value === 'object' && typeof (value as QuestionSet).id === 'string' && Array.isArray((value as QuestionSet).groups));
}
