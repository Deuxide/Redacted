import type { ActiveGame, AssignedPlayer } from '../types/game';

export interface VoteLeader {
  id: string;
  name: string;
  votes: number;
}

export type SideStatus = 'caught' | 'survived' | 'none';

export type GameResult =
  | { status: 'continue' }
  | { status: 'civilianWin' }
  | { status: 'undercoverWin' }
  | { status: 'doesntKnowWin' }
  | { status: 'draw' };

export type WinOutcome = GameResult['status'];

export interface VoteTally {
  counts: Record<string, number>;
  topCount: number;
  leaders: VoteLeader[];
  tied: boolean;
  eliminatedIds: string[];
  undercoverIds: string[];
  doesntKnowIds: string[];
  civilians: 'win' | 'lose';
  undercover: SideStatus;
  doesntKnow: SideStatus;
  civiliansWin: boolean;
  outcome: WinOutcome;
}

export const SKIP_VOTE_ID = 'skip';
export const MIN_ACTIVE_TO_VOTE = 3;
export const MIN_ACTIVE_WITH_DOESNT_KNOW = 4;

export function activePlayers(players: AssignedPlayer[]): AssignedPlayer[] {
  return players.filter((player) => !player.eliminated);
}

export function firstActiveIndex(order: string[], players: AssignedPlayer[]): number {
  const eliminated = new Set(players.filter((player) => player.eliminated).map((player) => player.id));
  const index = order.findIndex((id) => !eliminated.has(id));
  return index < 0 ? 0 : index;
}

export function nextActiveIndex(order: string[], players: AssignedPlayer[], from: number): number {
  const eliminated = new Set(players.filter((player) => player.eliminated).map((player) => player.id));
  for (let offset = 1; offset <= order.length; offset += 1) {
    const index = (from + offset) % order.length;
    if (order[index] && !eliminated.has(order[index])) return index;
  }
  return from;
}

export function playerInOrder(players: AssignedPlayer[], order: string[], index: number): AssignedPlayer | undefined {
  return players.find((player) => player.id === order[index]);
}

export function minActiveToContinue(active: AssignedPlayer[]): number {
  return active.some((player) => player.role === 'doesntKnow') ? MIN_ACTIVE_WITH_DOESNT_KNOW : MIN_ACTIVE_TO_VOTE;
}

export function isThreeRoleDraw(active: AssignedPlayer[]): boolean {
  if (active.length !== 3) return false;
  const roles = new Set(active.map((player) => player.role));
  return roles.has('civilian') && roles.has('undercover') && roles.has('doesntKnow');
}

export function evaluateGameState(players: AssignedPlayer[]): GameResult {
  const active = activePlayers(players);
  const civilians = active.filter((player) => player.role === 'civilian').length;
  const undercover = active.filter((player) => player.role === 'undercover').length;
  const doesntKnow = active.filter((player) => player.role === 'doesntKnow').length;
  if (civilians === 1 && undercover === 1 && doesntKnow === 1) return { status: 'draw' };
  if (undercover === 0 && civilians > 0) return { status: 'civilianWin' };
  if (civilians === 0 && undercover === 0 && doesntKnow > 0) return { status: 'doesntKnowWin' };
  if (civilians > 0 && undercover >= civilians) return { status: 'undercoverWin' };
  return { status: 'continue' };
}

export function canVoteAgain(players: AssignedPlayer[]): boolean {
  const active = activePlayers(players);
  return evaluateGameState(players).status === 'continue' && active.length >= minActiveToContinue(active);
}

export function evaluateWinCondition(players: AssignedPlayer[]): {
  outcome: WinOutcome;
  civiliansWin: boolean;
  undercover: SideStatus;
  doesntKnow: SideStatus;
} {
  const result = evaluateGameState(players);
  const eliminatedIds = players.filter((player) => player.eliminated).map((player) => player.id);
  const undercoverIds = players.filter((player) => player.role === 'undercover').map((player) => player.id);
  const doesntKnowIds = players.filter((player) => player.role === 'doesntKnow').map((player) => player.id);
  return {
    outcome: result.status,
    civiliansWin: result.status === 'civilianWin',
    undercover: statusFor(undercoverIds, eliminatedIds),
    doesntKnow: statusFor(doesntKnowIds, eliminatedIds),
  };
}

export function countVotes(game: ActiveGame): Record<string, number> {
  const activeIds = new Set(activePlayers(game.players).map((player) => player.id));
  const counts: Record<string, number> = { [SKIP_VOTE_ID]: 0 };
  for (const player of game.players) counts[player.id] = 0;
  for (const [voterId, targets] of Object.entries(game.votes)) {
    const voter = game.players.find((player) => player.id === voterId);
    if (!voter || voter.eliminated || !activeIds.has(voterId) || !targets?.length) continue;
    for (const target of [...new Set(targets)]) {
      if (target === SKIP_VOTE_ID) counts[SKIP_VOTE_ID] += 1;
      else if (target !== voterId && activeIds.has(target)) counts[target] += 1;
    }
  }
  return counts;
}

export function tallyVotes(game: ActiveGame): VoteTally {
  const counts = countVotes(game);
  const topCount = Math.max(0, counts[SKIP_VOTE_ID] ?? 0, ...activePlayers(game.players).map((player) => counts[player.id] ?? 0));
  const leaders = [
    ...activePlayers(game.players)
      .filter((player) => topCount > 0 && counts[player.id] === topCount)
      .map((player) => ({ id: player.id, name: player.name, votes: counts[player.id] ?? 0 })),
    ...(topCount > 0 && counts[SKIP_VOTE_ID] === topCount ? [{ id: SKIP_VOTE_ID, name: SKIP_VOTE_ID, votes: counts[SKIP_VOTE_ID] ?? 0 }] : []),
  ];
  const judged = evaluateWinCondition(game.players);
  return {
    counts,
    topCount,
    leaders,
    tied: leaders.length > 1,
    eliminatedIds: game.players.filter((player) => player.eliminated).map((player) => player.id),
    undercoverIds: game.players.filter((player) => player.role === 'undercover').map((player) => player.id),
    doesntKnowIds: game.players.filter((player) => player.role === 'doesntKnow').map((player) => player.id),
    civilians: judged.civiliansWin ? 'win' : 'lose',
    undercover: judged.undercover,
    doesntKnow: judged.doesntKnow,
    civiliansWin: judged.civiliansWin,
    outcome: judged.outcome,
  };
}

export function resolveCompletedVote(game: ActiveGame): ActiveGame {
  const active = activePlayers(game.players);
  const submitted = active.filter((player) => game.votes[player.id]?.length).length;
  if (submitted < active.length) return game;
  const tally = tallyVotes(game);
  const skipped = !tally.tied && tally.leaders.length === 1 && tally.leaders[0]?.id === SKIP_VOTE_ID;
  const history = {
    round: game.round,
    votes: game.votes,
    counts: tally.counts,
    eliminatedPlayerId: !tally.tied && !skipped ? tally.leaders[0]?.id : undefined,
    wasTie: tally.tied,
    skipped,
  };
  if (tally.tied || tally.leaders.length !== 1 || skipped) {
    return { ...game, voteHistory: [...(game.voteHistory ?? []), history], phase: 'elimination' };
  }
  const eliminatedId = tally.leaders[0]?.id;
  const players = game.players.map((player) => (player.id === eliminatedId ? { ...player, eliminated: true } : player));
  const eliminated = players.find((player) => player.id === eliminatedId);
  const needsGuess = eliminated?.role === 'doesntKnow' && eliminated.doesntKnowGuess !== 'correct' && eliminated.doesntKnowGuess !== 'incorrect';
  return {
    ...game,
    players: players.map((player) => player.id === eliminatedId && player.role === 'doesntKnow' ? { ...player, doesntKnowGuess: 'pending' } : player),
    eliminations: eliminatedId ? [...game.eliminations, { playerId: eliminatedId, round: game.round }] : game.eliminations,
    voteHistory: [...(game.voteHistory ?? []), history],
    phase: needsGuess ? 'guess' : 'elimination',
  };
}

export function wordsMatch(guess: string, target: string): boolean {
  return guess.trim().replace(/\s+/g, ' ').toLocaleLowerCase() === target.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function afterElimination(game: ActiveGame): ActiveGame {
  if (!canVoteAgain(game.players)) return { ...game, phase: 'results' };
  return { ...game, phase: 'voting', votes: {}, voteIndex: firstActiveIndex(game.playerOrder, game.players), round: game.round + 1 };
}

function statusFor(ids: string[], eliminatedIds: string[]): SideStatus {
  if (!ids.length) return 'none';
  return ids.every((id) => eliminatedIds.includes(id)) ? 'caught' : 'survived';
}
