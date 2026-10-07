import type { Locale } from '../i18n/messages';
import type { PlayerDraft } from '../types/game';
import { shuffle } from '../wordSets/assign';
import { QUESTION_GROUPS } from './questions';
import type { QuestionSet } from './sets';

export type QuestionPhase = 'answer' | 'board' | 'voting' | 'results';
export type QuestionResult = 'civilianWin' | 'undercoverWin';

export interface QuestionPlayer {
  id: string;
  name: string;
  role: 'civilian' | 'undercover';
  question: string;
}

export interface QuestionRound {
  id: string;
  phase: QuestionPhase;
  playerOrder: string[];
  turnIndex: number;
  voteIndex: number;
  civilianQuestion: string;
  undercoverQuestion: string;
  undercoverPlayerId: string;
  civilianQuestionRevealed: boolean;
  players: QuestionPlayer[];
  answers: Record<string, string>;
  votes: Record<string, string>;
  eliminatedId?: string;
  result?: QuestionResult;
  voteHistory: { votes: Record<string, string>; counts: Record<string, number>; wasTie: boolean; skipped: boolean }[];
  pointsAwarded: boolean;
  notice?: 'tie' | 'skip';
}

export function createQuestionRound(players: PlayerDraft[], locale: Locale, set?: QuestionSet): QuestionRound | null {
  if (players.length < 3) return null;
  const builtin = QUESTION_GROUPS[Math.floor(Math.random() * QUESTION_GROUPS.length)];
  const custom = set && !set.builtin ? set.groups[Math.floor(Math.random() * set.groups.length)] : null;
  const civilianQuestion = custom?.civilianQuestion ?? builtin.civilian[locale];
  const undercoverQuestion = custom?.undercoverQuestion ?? builtin.undercover[locale];
  const order = shuffle(players.map((player) => player.id));
  const undercoverPlayerId = order[Math.floor(Math.random() * order.length)];
  return {
    id: crypto.randomUUID(),
    phase: 'answer',
    playerOrder: order,
    turnIndex: 0,
    voteIndex: 0,
    civilianQuestion,
    undercoverQuestion,
    undercoverPlayerId,
    civilianQuestionRevealed: false,
    players: players.map((player, index) => ({
      id: player.id,
      name: player.name.trim() || `Player ${index + 1}`,
      role: player.id === undercoverPlayerId ? 'undercover' : 'civilian',
      question: player.id === undercoverPlayerId ? undercoverQuestion : civilianQuestion,
    })),
    answers: {},
    votes: {},
    voteHistory: [],
    pointsAwarded: false,
  };
}
