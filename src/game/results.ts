import type { ActiveGame } from '../types/game';

export interface VoteLeader {
  id: string;
  name: string;
  votes: number;
}

export type SideStatus = 'caught' | 'survived' | 'none';

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
}

/** Change this later without rewriting the results screen. */
export const WIN_RULES = {
  civiliansWinIfAllSpecialRolesIdentified: true,
};

export function tallyVotes(game: ActiveGame): VoteTally {
  const counts: Record<string, number> = {};
  for (const player of game.players) counts[player.id] = 0;
  for (const [voterId, suspects] of Object.entries(game.votes)) {
    for (const suspectId of suspects) {
      if (suspectId !== voterId && suspectId in counts) counts[suspectId] += 1;
    }
  }
  const topCount = Math.max(0, ...Object.values(counts));
  const leaders = game.players
    .filter((player) => topCount > 0 && counts[player.id] === topCount)
    .map((player) => ({ id: player.id, name: player.name, votes: counts[player.id] ?? 0 }));
  const tied = leaders.length > 1;
  const eliminatedIds = tied ? [] : leaders.map((leader) => leader.id);
  const undercoverIds = game.players.filter((player) => player.role === 'undercover').map((player) => player.id);
  const doesntKnowIds = game.players.filter((player) => player.role === 'doesntKnow').map((player) => player.id);
  const undercover = statusFor(undercoverIds, eliminatedIds);
  const doesntKnow = statusFor(doesntKnowIds, eliminatedIds);
  const specialIds = [...undercoverIds, ...doesntKnowIds];
  const allSpecialIdentified = specialIds.length > 0 && specialIds.every((id) => eliminatedIds.includes(id));
  const civiliansWin = WIN_RULES.civiliansWinIfAllSpecialRolesIdentified ? allSpecialIdentified : !allSpecialIdentified;
  return {
    counts,
    topCount,
    leaders,
    tied,
    eliminatedIds,
    undercoverIds,
    doesntKnowIds,
    civilians: civiliansWin ? 'win' : 'lose',
    undercover,
    doesntKnow,
    civiliansWin,
  };
}

function statusFor(ids: string[], eliminatedIds: string[]): SideStatus {
  if (!ids.length) return 'none';
  return ids.every((id) => eliminatedIds.includes(id)) ? 'caught' : 'survived';
}
