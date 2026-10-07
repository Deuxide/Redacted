import { SKIP_VOTE_ID } from '../game/results';
import type { QuestionRound } from './createRound';

export function countQuestionVotes(round: QuestionRound): Record<string, number> {
  const counts: Record<string, number> = { [SKIP_VOTE_ID]: 0 };
  for (const player of round.players) counts[player.id] = 0;
  const active = new Set(round.players.map((player) => player.id));
  for (const [voterId, target] of Object.entries(round.votes)) {
    if (!active.has(voterId) || !target) continue;
    if (target === SKIP_VOTE_ID) counts[SKIP_VOTE_ID] += 1;
    else if (target !== voterId && active.has(target)) counts[target] += 1;
  }
  return counts;
}

export function resolveQuestionVote(round: QuestionRound): QuestionRound {
  if (Object.keys(round.votes).length < round.players.length) return round;
  const counts = countQuestionVotes(round);
  const top = Math.max(0, ...Object.values(counts));
  const leaders = Object.entries(counts).filter(([, count]) => count === top && top > 0).map(([id]) => id);
  const skipped = leaders.length === 1 && leaders[0] === SKIP_VOTE_ID;
  const history = { votes: round.votes, counts, wasTie: leaders.length !== 1, skipped };
  if (leaders.length !== 1 || skipped) {
    return { ...round, votes: {}, voteIndex: 0, phase: 'voting', notice: leaders.length !== 1 ? 'tie' : 'skip', voteHistory: [...round.voteHistory, history] };
  }
  const eliminatedId = leaders[0];
  return {
    ...round,
    eliminatedId,
    result: eliminatedId === round.undercoverPlayerId ? 'civilianWin' : 'undercoverWin',
    voteHistory: [...round.voteHistory, history],
    phase: 'results',
  };
}
