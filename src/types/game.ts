export type Role = 'civilian' | 'undercover' | 'doesntKnow';

export type AppScreen = 'home' | 'setup' | 'settings' | 'word-sets' | 'editor' | 'import' | 'export' | 'reveal' | 'discussion' | 'voting' | 'elimination' | 'guess' | 'results' | 'question-setup' | 'question-answer' | 'question-discussion' | 'question-vote' | 'question-results' | 'question-sets' | 'question-editor';

export interface WordGroup {
  id: string;
  label?: string;
  words: string[];
}

export interface WordSet {
  id: string;
  name: string;
  description: string;
  groups: WordGroup[];
  builtin: boolean;
}

export interface PlayerDraft {
  id: string;
  name: string;
}

export type TieBehavior = 'eliminate-none' | 'revote';

export interface SetupDraft {
  playerCount: number;
  undercoverCount: number;
  doesntKnowCount: number;
  suspectsPerVote: number;
  tieBehavior: TieBehavior;
  showRoleDuringReveal: boolean;
  wordSetId: string;
  players: PlayerDraft[];
}

export type DoesntKnowGuess = 'pending' | 'correct' | 'incorrect';

export interface AssignedPlayer {
  id: string;
  name: string;
  role: Role;
  word: string;
  hasSeenWord: boolean;
  eliminated: boolean;
  doesntKnowGuess?: DoesntKnowGuess;
  individualWins: number;
}

export interface EliminationRecord {
  playerId: string;
  round: number;
}

export interface VoteRound {
  round: number;
  votes: Record<string, string[]>;
  counts: Record<string, number>;
  eliminatedPlayerId?: string;
  wasTie: boolean;
  skipped: boolean;
}

export type GamePhase = 'reveal' | 'discussion' | 'voting' | 'elimination' | 'guess' | 'results';

export interface ActiveGame {
  id: string;
  startedAt: string;
  wordSetId: string;
  wordSetName: string;
  civilianWord: string;
  undercoverWord: string;
  players: AssignedPlayer[];
  playerOrder: string[];
  revealIndex: number;
  voteIndex: number;
  suspectsPerVote: number;
  tieBehavior: TieBehavior;
  showRoleDuringReveal: boolean;
  votes: Record<string, string[]>;
  round: number;
  eliminations: EliminationRecord[];
  voteHistory: VoteRound[];
  pointsAwarded: boolean;
  phase: GamePhase;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 30;
export const MIN_UNDERCOVER = 1;
export const MIN_DOESNT_KNOW = 0;
export const MIN_CIVILIANS = 1;
export const MIN_WORDS_PER_GROUP = 2;

export function maxUndercover(playerCount: number, doesntKnowCount = 0): number {
  return Math.max(MIN_UNDERCOVER, playerCount - Math.max(0, doesntKnowCount) - MIN_CIVILIANS);
}

export function maxDoesntKnow(playerCount: number, undercoverCount: number): number {
  return Math.max(MIN_DOESNT_KNOW, playerCount - undercoverCount - MIN_CIVILIANS);
}

export function civilianCount(playerCount: number, undercoverCount: number, doesntKnowCount: number): number {
  return playerCount - undercoverCount - doesntKnowCount;
}

export function roleLabel(role: Role): string {
  if (role === 'undercover') return 'Undercover';
  if (role === 'doesntKnow') return "Doesn't Know";
  return 'Civilian';
}

export function maxSuspects(undercoverCount: number, playerCount: number): number {
  return Math.max(1, Math.min(undercoverCount, playerCount - 1));
}

export function suggestedUndercover(playerCount: number): { min: number; max: number } {
  const cap = maxUndercover(playerCount);
  if (playerCount <= 5) return { min: 1, max: 1 };
  if (playerCount <= 10) return { min: 1, max: Math.min(2, cap) };
  return { min: Math.min(2, cap), max: Math.min(3, cap) };
}

export function playableGroups(set: WordSet): WordGroup[] {
  return set.groups.filter((group) => uniqueWords(group.words).length >= MIN_WORDS_PER_GROUP);
}

export function uniqueWords(words: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const word of words) {
    const cleaned = word.trim().replace(/\s+/g, ' ');
    const key = cleaned.toLocaleLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    unique.push(cleaned);
  }
  return unique;
}
